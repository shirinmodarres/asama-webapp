import { httpClient } from "@/lib/api/http-client";
import {
  mapProductStockInventoryDto,
  mapProductStockInventoryListDto,
  mapSepidarStockDto,
  mapSepidarStockListDto,
  mapStockTransferRequestDto,
  mapStockTransferRequestListDto,
} from "@/lib/mappers/stock.mapper";
import type {
  CreateStockTransferPayload,
  ProductStockInventory,
  SepidarStock,
  SepidarStockInventory,
  StockTransferRequest,
  UpdateProductStockInventoryPayload,
} from "@/lib/models/stock.model";
import { toRecord } from "@/lib/mappers/mapper-utils";
import { toNumber } from "@/lib/utils/number-format";

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
}): Promise<StockTransferRequest[]> {
  return listTransfersFromPath("/api/support/stock-transfers", filters);
}

export async function listManagerStockTransfers(filters?: {
  status?: string;
}): Promise<StockTransferRequest[]> {
  return listTransfersFromPath("/api/manager/stock-transfers", filters);
}

export async function listWarehouseStockTransfers(filters?: {
  status?: string;
}): Promise<StockTransferRequest[]> {
  return listTransfersFromPath("/api/warehouse/stock-transfers", filters);
}

async function listTransfersFromPath(
  path: string,
  filters?: { status?: string },
): Promise<StockTransferRequest[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await httpClient.get<unknown>(`${path}${suffix}`);
  return mapStockTransferRequestListDto(data);
}

export async function createStockTransfer(
  payload: CreateStockTransferPayload,
): Promise<StockTransferRequest> {
  const data = await httpClient.post<unknown>("/api/support/stock-transfers", {
    ...payload,
    quantity: toNumber(payload.quantity),
  });
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
  const data = await httpClient.get<unknown>(
    `/api/support/product-stock-inventory${suffix}`,
  );
  return mapProductStockInventoryListDto(data);
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
