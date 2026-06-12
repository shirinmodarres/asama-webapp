import { getProductStatusLabel } from "@/lib/domain/statuses";
import type {
  Product,
  ProductStatus,
  SepidarProductSyncSummary,
} from "@/lib/models/product.model";
import {
  toBooleanValue,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import { normalizeDigits } from "@/lib/utils/number-format";
import { mapProductWarehouseInventoryListDto } from "@/lib/mappers/warehouse.mapper";

export function mapProductDto(dto: unknown): Product {
  const record = toRecord(dto);
  const objectId = toStringValue(record.objectId);
  const id = normalizeDigits(
    toStringValue(record.id) || toStringValue(record.sku),
  );
  const sku = normalizeDigits(
    toStringValue(record.sku) || toStringValue(record.id),
  );
  const inventories = mapProductWarehouseInventoryListDto(
    record.inventories ??
      record.warehouseInventories ??
      record.inventorySummary,
  );
  const generalInventories = inventories.filter((inventory) =>
    isGeneralWarehouseType(inventory.warehouseType),
  );
  const najaInventories = inventories.filter(
    (inventory) => inventory.warehouseType === "naja",
  );
  const inventorySalesStock = sumInventory(generalInventories, "stock");
  const inventoryReservedStock = sumInventory(
    generalInventories,
    "reservedStock",
  );
  const inventoryAvailableStock = sumInventory(
    generalInventories,
    "availableStock",
  );
  const inventoryWarehouseStock = sumInventory(inventories, "stock");
  const inventoryWarehouseAvailableStock = sumInventory(
    inventories,
    "availableStock",
  );
  const inventoryNajaStock = sumInventory(najaInventories, "stock");

  const salesStock = inventories.length
    ? inventorySalesStock
    : toNumberValue(record.salesStock ?? record.totalStock);
  const warehouseStock = inventories.length
    ? inventoryWarehouseStock
    : toNumberValue(record.warehouseStock);
  const reservedStock = inventories.length
    ? inventoryReservedStock
    : toNumberValue(record.reservedStock);
  const backendAvailableQuantity =
    record.availableQuantity ??
    record.availableSalesQuantity ??
    record.availableStock;
  const availableStock =
    backendAvailableQuantity !== undefined &&
    backendAvailableQuantity !== null
      ? toNumberValue(backendAvailableQuantity)
      : inventories.length
        ? inventoryAvailableStock
        : salesStock - reservedStock;
  const warehouseAvailableStock = inventories.length
    ? inventoryWarehouseAvailableStock
    : record.warehouseAvailableStock === undefined
      ? warehouseStock
      : toNumberValue(record.warehouseAvailableStock);
  const najaInventoryQty = inventories.length
    ? inventoryNajaStock
    : toNumberValue(record.najaInventoryQty);

  return {
    objectId,
    id,
    sku,
    barcode: toNullableString(record.barcode ?? record.productBarcode),
    sepidarItemId:
      record.sepidarItemId === undefined || record.sepidarItemId === null
        ? null
        : toNumberValue(record.sepidarItemId),
    sepidarCode: toNullableString(record.sepidarCode ?? record.code),
    name: toStringValue(record.name ?? record.title),
    brand: toStringValue(record.brand),
    model: toNullableString(record.model),
    category: toStringValue(record.category),
    unit: toStringValue(record.unit) || "عدد",
    unitPrice: toNumberValue(record.unitPrice ?? record.fee ?? record.price),
    priceNoteItemId:
      record.priceNoteItemId === undefined || record.priceNoteItemId === null
        ? null
        : toNumberValue(record.priceNoteItemId),
    description: toNullableString(record.description),
    isSyncedFromSepidar:
      toBooleanValue(
        record.isSyncedFromSepidar ??
          record.syncedFromSepidar ??
          record.isSepidarSynced,
      ) ||
      [
        toStringValue(record.source),
        toStringValue(record.sourceSystem),
        toStringValue(record.syncSource),
      ].some((source) => source.toLowerCase() === "sepidar"),
    isActive:
      record.isActive === undefined || record.isActive === null
        ? null
        : toBooleanValue(record.isActive),
    isSellable:
      record.isSellable === undefined || record.isSellable === null
        ? null
        : toBooleanValue(record.isSellable),
    status: mapProductStatus(record.status),
    statusLabel:
      getProductStatusLabel(toStringValue(record.status)) ||
      toStringValue(record.statusLabel),
    totalStock: salesStock,
    salesStock,
    warehouseStock,
    reservedStock,
    availableStock,
    availableSalesQuantity: availableStock,
    hasAvailableSalesQuantity: false,
    availableStocks: [],
    warehouseAvailableStock,
    najaInventoryQty,
    inventories,
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapProductListDto(dto: unknown): Product[] {
  return Array.isArray(dto) ? dto.map(mapProductDto) : [];
}

export function mapProductOrderOptionDto(dto: unknown): Product {
  const record = toRecord(dto);
  const product = mapProductDto(dto);
  const hasAvailableSalesQuantity = Object.prototype.hasOwnProperty.call(
    record,
    "availableSalesQuantity",
  );
  if (!hasAvailableSalesQuantity && process.env.NODE_ENV === "development") {
    console.warn(
      "[ORDER_OPTIONS_MISSING_AVAILABLE_SALES_QUANTITY]",
      record,
    );
  }
  const availableSalesQuantity = toNumberValue(
    record.availableSalesQuantity,
  );
  return {
    ...product,
    availableSalesQuantity,
    hasAvailableSalesQuantity,
    availableStocks: Array.isArray(record.availableStocks)
      ? record.availableStocks.map((value) => {
          const stock = toRecord(value);
          return {
            stockObjectId: toStringValue(stock.stockObjectId),
            sepidarStockId:
              stock.sepidarStockId === null ||
              stock.sepidarStockId === undefined
                ? null
                : toNumberValue(stock.sepidarStockId),
            stockTitle: toStringValue(stock.stockTitle),
            realQuantity: toNumberValue(stock.realQuantity),
            salesQuantity: toNumberValue(stock.salesQuantity),
            reservedQuantity: toNumberValue(stock.reservedQuantity),
            useFullRealQuantityForSales:
              stock.useFullRealQuantityForSales === true,
            availableSalesQuantity: toNumberValue(
              stock.availableSalesQuantity,
            ),
          };
        })
      : [],
  };
}

export function mapProductOrderOptionListDto(dto: unknown): Product[] {
  return Array.isArray(dto) ? dto.map(mapProductOrderOptionDto) : [];
}

export function mapSepidarProductSyncSummaryDto(
  dto: unknown,
): SepidarProductSyncSummary {
  const response = toRecord(dto);
  const record = toRecord(response.summary ?? response);
  return {
    total: toNumberValue(
      record.total ?? record.totalCount ?? record.totalFromSepidar,
    ),
    processed: toNumberValue(record.processed ?? record.processedCount),
    created: toNumberValue(record.created ?? record.createdCount),
    updated: toNumberValue(record.updated ?? record.updatedCount),
    rejected: toNumberValue(
      record.rejected ?? record.rejectedCount ?? record.skippedCount,
    ),
    failed: toNumberValue(
      record.failed ?? record.failedCount ?? record.errorCount,
    ),
  };
}

function mapProductStatus(value: unknown): ProductStatus {
  return value === "inactive" ? "inactive" : "active";
}

function isGeneralWarehouseType(type: string): boolean {
  return type === "general" || type === "normal" || !type;
}

function sumInventory(
  inventories: Array<{
    stock: number;
    reservedStock: number;
    availableStock: number;
  }>,
  field: "stock" | "reservedStock" | "availableStock",
): number {
  return inventories.reduce((sum, inventory) => sum + inventory[field], 0);
}
