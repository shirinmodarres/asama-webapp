#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Audits DB fields against the current canonical Sepidar/inventory field list.
 *
 * This script is intentionally read-only. It can run in two modes:
 * - With Parse REST env vars: reports DB non-null counts and code usage.
 * - Without Parse REST env vars: reports code usage and marks DB counts unknown.
 *
 * Env vars:
 *   PARSE_SERVER_URL=http://localhost:1337/parse
 *   PARSE_APP_ID=...
 *   PARSE_MASTER_KEY=...
 */

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

const CLASS_DEFINITIONS = {
  Product: {
    keep: [
      "objectId",
      "sepidarItemId",
      "sepidarCode",
      "sku",
      "barcode",
      "name",
      "title",
      "unit",
      "unitPrice",
      "isActive",
      "isSellable",
      "isSyncedFromSepidar",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [
      "totalStock",
      "salesStock",
      "warehouseStock",
      "reservedStock",
      "availableStock",
      "warehouseAvailableStock",
      "najaInventoryQty",
      "inventories",
    ],
  },
  Customer: {
    keep: [
      "objectId",
      "sepidarCustomerId",
      "sepidarCustomerCode",
      "fullName",
      "phone",
      "mobile",
      "address",
      "rawSepidarCustomer",
      "createdAt",
      "updatedAt",
    ],
    deprecate: ["najaInventoryQty", "najaStock", "najaWarehouse"],
  },
  SepidarStock: {
    keep: [
      "objectId",
      "sepidarStockId",
      "code",
      "title",
      "isActive",
      "isZagros",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
  SepidarSaleType: {
    keep: [
      "objectId",
      "sepidarSaleTypeId",
      "title",
      "market",
      "isAvailable",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
  SepidarPriceNoteItem: {
    keep: [
      "objectId",
      "sepidarPriceNoteItemId",
      "sepidarItemId",
      "sepidarSaleTypeId",
      "itemObjectId",
      "saleTypeObjectId",
      "unitPrice",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
  ProductStockInventory: {
    keep: [
      "objectId",
      "productObjectId",
      "sepidarItemId",
      "stockObjectId",
      "sepidarStockId",
      "stockTitle",
      "realQuantity",
      "salesQuantity",
      "reservedQuantity",
      "useFullRealQuantityForSales",
      "lastUpdatedAt",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
  WarehouseItemUnit: {
    keep: [
      "objectId",
      "productObjectId",
      "sepidarItemId",
      "stockObjectId",
      "sepidarStockId",
      "stockTitle",
      "productIdentifier",
      "serialNumber",
      "trackingCode",
      "status",
      "inboundReceiptId",
      "transferRequestId",
      "orderId",
      "exitSlipId",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
  WarehouseInboundReceipt: {
    keep: [
      "objectId",
      "receiptCode",
      "productObjectId",
      "sepidarItemId",
      "stockObjectId",
      "sepidarStockId",
      "stockTitle",
      "supplierName",
      "receiptDate",
      "quantity",
      "notes",
      "units",
      "createdByName",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
  StockTransferRequest: {
    keep: [
      "objectId",
      "sourceStockObjectId",
      "sourceSepidarStockId",
      "destinationStockObjectId",
      "destinationSepidarStockId",
      "productObjectId",
      "sepidarItemId",
      "quantity",
      "status",
      "requestedAt",
      "approvedAt",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
  ExpertCustomerAssignment: {
    keep: [
      "objectId",
      "customerObjectId",
      "sepidarCustomerId",
      "expertUserId",
      "saleTypeObjectId",
      "sepidarSaleTypeId",
      "allowedStockObjectIds",
      "allowedSepidarStockIds",
      "status",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
  Order: {
    keep: [
      "objectId",
      "customerObjectId",
      "sepidarCustomerId",
      "customerName",
      "customerMobile",
      "customerAddress",
      "saleTypeObjectId",
      "sepidarSaleTypeId",
      "saleTypeTitle",
      "stockObjectId",
      "sepidarStockId",
      "stockTitle",
      "orderType",
      "orderStatus",
      "warehouseStatus",
      "recipientFirstName",
      "recipientLastName",
      "recipientNationalId",
      "recipientMobile",
      "najaOrderNumber",
      "items",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [
      "najaInventoryQty",
      "najaStock",
      "najaWarehouse",
      "warehouseQuantity",
      "stockQuantity",
    ],
  },
  ExitSlip: {
    keep: [
      "objectId",
      "slipCode",
      "orderId",
      "orderCode",
      "customerName",
      "receiverFullName",
      "receiverPhone",
      "deliveryFullAddress",
      "items",
      "units",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
  InternalInvoice: {
    keep: [
      "objectId",
      "invoiceNumber",
      "orderId",
      "exitSlipId",
      "customerName",
      "stockTitle",
      "saleTypeTitle",
      "items",
      "status",
      "statusLabel",
      "createdAt",
      "updatedAt",
    ],
    deprecate: [],
  },
};

const PARSE_SERVER_URL = trimTrailingSlash(process.env.PARSE_SERVER_URL || "");
const PARSE_APP_ID = process.env.PARSE_APP_ID || "";
const PARSE_MASTER_KEY = process.env.PARSE_MASTER_KEY || "";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const codeIndex = buildCodeIndex(repoRoot);
  const hasParseConfig = Boolean(
    PARSE_SERVER_URL && PARSE_APP_ID && PARSE_MASTER_KEY,
  );

  if (!hasParseConfig) {
    console.warn(
      "Parse env vars are missing. DB counts will be null; code usage audit will still run.",
    );
  }

  const report = [];

  for (const [className, definition] of Object.entries(CLASS_DEFINITIONS)) {
    const fields = new Set([...definition.keep, ...definition.deprecate]);
    const schemaFields = hasParseConfig
      ? await listSchemaFields(className).catch((error) => {
          console.warn(`Could not read schema for ${className}: ${error.message}`);
          return [];
        })
      : [];

    schemaFields.forEach((field) => fields.add(field));

    for (const field of Array.from(fields).sort()) {
      const dbCount = hasParseConfig
        ? await countNonNull(className, field).catch((error) => {
            console.warn(
              `Could not count ${className}.${field}: ${error.message}`,
            );
            return null;
          })
        : null;
      const usedInCode = codeIndex.has(field);
      const recommendedAction = recommendAction(field, definition, usedInCode, dbCount);
      report.push({
        className,
        field,
        nonNullCount: dbCount,
        usedInCode: usedInCode ? "yes" : "no",
        recommendedAction,
      });
    }
  }

  console.table(report);
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2));
}

async function listSchemaFields(className) {
  const response = await parseFetch(`/schemas/${encodeURIComponent(className)}`);
  const fields = response.fields || {};
  return Object.keys(fields).filter((field) => !field.startsWith("_"));
}

async function countNonNull(className, field) {
  const params = new URLSearchParams({
    count: "1",
    limit: "0",
    where: JSON.stringify({ [field]: { $exists: true, $ne: null } }),
  });
  const response = await parseFetch(
    `/classes/${encodeURIComponent(className)}?${params.toString()}`,
  );
  return Number(response.count || 0);
}

async function parseFetch(pathname) {
  const response = await fetch(`${PARSE_SERVER_URL}${pathname}`, {
    headers: {
      "X-Parse-Application-Id": PARSE_APP_ID,
      "X-Parse-Master-Key": PARSE_MASTER_KEY,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return body;
}

function recommendAction(field, definition, usedInCode, dbCount) {
  if (definition.keep.includes(field)) return "keep";
  if (definition.deprecate.includes(field)) {
    return usedInCode || (dbCount ?? 0) > 0 ? "deprecate" : "remove later";
  }
  return usedInCode || (dbCount ?? 0) > 0 ? "review manually" : "remove later";
}

function buildCodeIndex(root) {
  const result = new Set();
  const allowedExtensions = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
  ]);

  walk(root, (filePath) => {
    if (
      filePath === __filename ||
      filePath.endsWith(`${path.sep}scripts${path.sep}cleanup-legacy-fields.js`)
    ) {
      return;
    }
    if (!allowedExtensions.has(path.extname(filePath))) return;
    const content = fs.readFileSync(filePath, "utf8");
    for (const definition of Object.values(CLASS_DEFINITIONS)) {
      for (const field of [...definition.keep, ...definition.deprecate]) {
        if (content.includes(field)) result.add(field);
      }
    }
  });

  return result;
}

function walk(directory, onFile) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git"
    ) {
      continue;
    }
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, onFile);
    } else {
      onFile(fullPath);
    }
  }
}

function trimTrailingSlash(value) {
  return value.replace(/\/$/, "");
}
