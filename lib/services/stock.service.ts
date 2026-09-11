import { httpClient } from "@/lib/api/http-client";
import {
  mapProductStockInventoryDto,
  mapProductStockInventoryListDto,
  mapSepidarStockDto,
  mapSepidarStockListDto,
  mapStockTransferRequestDto,
  mapStockTransferRequestListDto,
} from "@/lib/mappers/stock.mapper";
import { listWarehouseInventoryUnits } from "@/lib/services/warehouse.service";
import type {
  BulkUpdateProductStockInventoryItem,
  BulkUpdateProductStockInventoryResult,
  CreateStockTransferPayload,
  ProductStockInventory,
  SepidarStock,
  SepidarStockInventory,
  StockTransferListResult,
  StockTransferRequest,
  UpdateProductStockInventoryPayload,
} from "@/lib/models/stock.model";
import { mapWarehouseItemUnitDto } from "@/lib/mappers/warehouse.mapper";
import type { WarehouseItemUnit } from "@/lib/models/warehouse.model";
import { toArray, toRecord, toStringValue, toNumberValue } from "@/lib/mappers/mapper-utils";
import { toNumber } from "@/lib/utils/number-format";

const RESERVED_UNIT_STATUSES = new Set(["reserved_for_order", "reserved"]);

export async function listSepidarStocks(): Promise<SepidarStock[]> {
  const data = await httpClient.get<unknown>(
    "/api/integrations/sepidar/stocks",
  );
  return mapSepidarStockListDto(data);
}

export async function listSupportStocks(): Promise<SepidarStock[]> {
  const data = await httpClient.get<unknown>("/api/support/stocks");
  return mapSepidarStockListDto(data);
}

export async function listStocks(): Promise<SepidarStock[]> {
  const data = await httpClient.get<unknown>("/api/stocks");
  return mapSepidarStockListDto(data);
}

export async function getSepidarStockInventory(
  objectId: string,
): Promise<SepidarStockInventory> {
  const data = await httpClient.get<unknown>(
    `/api/stocks/${objectId}/inventory`,
  );
  const record = toRecord(data);
  return {
    stock: mapSepidarStockDto(record.stock),
    products: mapProductStockInventoryListDto(record.products),
  };
}

export async function listStockTransfers(filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<StockTransferRequest[]> {
  return (await listSupportStockTransfersPage(filters)).items;
}

export function listSupportStockTransfersPage(filters?: TransferListFilters): Promise<StockTransferListResult> {
  return listTransferPageFromPath("/api/support/stock-transfers", filters);
}

export async function getSupportStockTransfer(
  objectId: string,
): Promise<StockTransferRequest> {
  const data = await httpClient.get<unknown>(
    `/api/support/stock-transfers/${objectId}`,
  );
  return mapStockTransferRequestDto(data);
}

export async function cancelStockTransfer(
  objectId: string,
  payload: { cancelledByName?: string; reason?: string },
): Promise<StockTransferRequest> {
  const data = await httpClient.post<unknown>(
    `/api/support/stock-transfers/${objectId}/cancel`,
    payload,
  );
  return mapStockTransferRequestDto(data);
}

export async function cancelManagerStockTransfer(
  objectId: string,
  payload: { cancelledByName?: string; reason?: string },
): Promise<StockTransferRequest> {
  const data = await httpClient.post<unknown>(
    `/api/manager/stock-transfers/${objectId}/cancel`,
    payload,
  );
  return mapStockTransferRequestDto(data);
}

export async function listManagerStockTransfers(filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<StockTransferRequest[]> {
  return (await listManagerStockTransfersPage(filters)).items;
}

export function listManagerStockTransfersPage(filters?: TransferListFilters): Promise<StockTransferListResult> {
  return listTransferPageFromPath("/api/manager/stock-transfers", filters);
}

export async function getManagerStockTransfer(
  objectId: string,
): Promise<StockTransferRequest> {
  const data = await httpClient.get<unknown>(
    `/api/manager/stock-transfers/${objectId}`,
  );
  return mapStockTransferRequestDto(data);
}

export async function listWarehouseStockTransfers(filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<StockTransferRequest[]> {
  return (await listWarehouseStockTransfersPage(filters)).items;
}

export function listWarehouseStockTransfersPage(filters?: TransferListFilters): Promise<StockTransferListResult> {
  return listTransferPageFromPath("/api/warehouse/stock-transfers", filters);
}

type TransferListFilters = { status?: string; page?: number; pageSize?: number; search?: string };

async function listTransferPageFromPath(
  path: string,
  filters?: TransferListFilters,
): Promise<StockTransferListResult> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters?.search) params.set("search", filters.search);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await httpClient.get<unknown>(`${path}${suffix}`);
  const record = toRecord(data);
  const pagination = toRecord(record.pagination);
  const items = mapStockTransferRequestListDto(data);
  return {
    items,
    pagination: {
      page: toNumberValue(pagination.page) || filters?.page || 1,
      pageSize: toNumberValue(pagination.pageSize) || filters?.pageSize || items.length || 20,
      total: toNumberValue(pagination.total) || items.length,
      totalPages: toNumberValue(pagination.totalPages) || 1,
    },
  };
}

export async function updateStockTransfer(
  objectId: string,
  payload: CreateStockTransferPayload,
): Promise<StockTransferRequest> {
  const data = await httpClient.patch<unknown>(
    `/api/support/stock-transfers/${objectId}`,
    payload,
  );
  return mapStockTransferRequestDto(data);
}

export async function createStockTransfer(
  payload: CreateStockTransferPayload,
): Promise<StockTransferRequest> {
  const normalizedItems = payload.items?.map((item) => ({
    productObjectId: item.productObjectId,
    sepidarItemId: item.sepidarItemId,
    productNameSnapshot: item.productNameSnapshot,
    quantity: toNumber(item.quantity),
  }));
  const data = await httpClient.post<unknown>("/api/support/stock-transfers", {
    ...payload,
    items: normalizedItems,
    quantity:
      payload.quantity !== undefined ? toNumber(payload.quantity) : undefined,
  });
  return mapStockTransferRequestDto(data);
}

export async function getWarehouseStockTransfer(
  objectId: string,
): Promise<StockTransferRequest> {
  const data = await httpClient.get<unknown>(
    `/api/warehouse/stock-transfers/${objectId}`,
  );
  return mapStockTransferRequestDto(data);
}

export async function approveStockTransfer(
  objectId: string,
  payload: { approvedByName?: string },
): Promise<StockTransferRequest> {
  const data = await httpClient.post<unknown>(
    `/api/manager/stock-transfers/${objectId}/approve`,
    payload,
  );
  return mapStockTransferRequestDto(data);
}

export async function rejectStockTransfer(
  objectId: string,
  payload: { rejectedByName?: string; note?: string },
): Promise<StockTransferRequest> {
  const data = await httpClient.post<unknown>(
    `/api/manager/stock-transfers/${objectId}/reject`,
    payload,
  );
  return mapStockTransferRequestDto(data);
}

export async function validateStockTransferScan(
  objectId: string,
  payload: {
    scannedCode: string;
    productObjectId?: string;
    currentScannedUnitIds?: string[];
  },
): Promise<WarehouseItemUnit> {
  const data = await httpClient.post<unknown>(
    `/api/warehouse/stock-transfers/${objectId}/validate-scan`,
    payload,
  );
  return mapWarehouseItemUnitDto(data);
}

export async function executeStockTransfer(
  objectId: string,
  payload: {
    unitObjectIds?: string[];
    items?: Array<{
      productObjectId: string;
      sepidarItemId?: number | null;
      unitObjectIds: string[];
    }>;
    executedByName?: string;
  },
): Promise<{ transfer: StockTransferRequest; slip?: unknown }> {
  const data = await httpClient.post<unknown>(
    `/api/warehouse/stock-transfers/${objectId}/execute`,
    payload,
  );
  const record = toRecord(data);
  return {
    transfer: mapStockTransferRequestDto(record.transfer),
    slip: record.slip,
  };
}

export async function listProductStockInventory(filters?: {
  stockObjectId?: string;
  productObjectId?: string;
}): Promise<ProductStockInventory[]> {
  const params = new URLSearchParams();
  if (filters?.stockObjectId) {
    params.set("stockObjectId", filters.stockObjectId);
  }
  if (filters?.productObjectId) {
    params.set("productObjectId", filters.productObjectId);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const [supportData, tracedRows] = await Promise.all([
    httpClient.get<unknown>(`/api/support/product-stock-inventory${suffix}`),
    listWarehouseInventoryUnits(filters),
  ]);
  const supportRows = mapProductStockInventoryListDto(supportData);
  const tracedReservedByKey = tracedRows.reduce((map, row) => {
    if (!RESERVED_UNIT_STATUSES.has(String(row.status || "").trim())) {
      return map;
    }
    const key = `${String(row.productObjectId || "").trim()}::${String(row.stockObjectId || "").trim()}`;
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return supportRows.map((row: ProductStockInventory) => {
    const key = `${String(row.productObjectId || "").trim()}::${String(row.stockObjectId || "").trim()}`;
    const tracedReservedQuantity = tracedReservedByKey.get(key) ?? 0;
    if (tracedReservedQuantity <= 0) {
      return row;
    }

    const realQuantity = toNumber(row.realQuantity);
    const salesQuantity = toNumber(row.salesQuantity);
    const salesCapacity = toNumber(
      row.salesCapacity ??
        (row.useFullRealQuantityForSales
          ? realQuantity
          : salesQuantity),
    );
    const reservedQuantity = tracedReservedQuantity;
    const unreservedQuantity = Math.max(0, realQuantity - reservedQuantity);
    const availableForSale = Math.max(0, salesCapacity - reservedQuantity);
    return {
      ...row,
      reservedQuantity,
      unreservedQuantity,
      availableForSale,
      availableSalesQuantity: availableForSale,
    };
  });
}

export async function updateProductStockInventory(
  objectId: string,
  payload: UpdateProductStockInventoryPayload,
): Promise<ProductStockInventory> {
  const data = await httpClient.patch<unknown>(
    `/api/support/product-stock-inventory/${objectId}/sales`,
    {
      ...payload,
      salesQuantity:
        payload.salesQuantity !== undefined
          ? toNumber(payload.salesQuantity)
          : undefined,
    },
  );
  return mapProductStockInventoryDto(data);
}

export async function bulkUpdateProductStockInventory(
  updates: BulkUpdateProductStockInventoryItem[],
): Promise<BulkUpdateProductStockInventoryResult> {
  const data = await httpClient.patch<unknown>(
    "/api/support/product-stock-inventory/sales/bulk",
    {
      updates: updates.map((item) => ({
        ...item,
        salesQuantity:
          item.salesQuantity !== undefined
            ? toNumber(item.salesQuantity)
            : undefined,
      })),
    },
  );
  const record = toRecord(data);
  const summary = toRecord(record.summary);
  return {
    updated: mapProductStockInventoryListDto(record.updated),
    failed: toArray(record.failed).map((item) => {
      const failure = toRecord(item);
      return {
        objectId:
          failure.objectId === undefined || failure.objectId === null
            ? null
            : toStringValue(failure.objectId),
        code: toStringValue(failure.code),
        message: toStringValue(failure.message),
        status:
          failure.status === undefined || failure.status === null
            ? undefined
            : toNumberValue(failure.status),
      };
    }),
    summary: {
      requested: toNumberValue(summary.requested),
      updated: toNumberValue(summary.updated),
      failed: toNumberValue(summary.failed),
    },
  };
}
