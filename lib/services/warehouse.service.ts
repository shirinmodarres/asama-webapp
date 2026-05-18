import { httpClient } from "@/lib/api/http-client";
import { ApiError } from "@/lib/api/api-error";
import { mapOrderListDto } from "@/lib/mappers/order.mapper";
import { mapProductListDto } from "@/lib/mappers/product.mapper";
import {
  mapExitSlipDto,
  mapExitSlipPdfDataDto,
  mapExitSlipListDto,
  mapProductWarehouseInventoryListDto,
  mapWarehouseDto,
  mapWarehouseInboundReceiptDto,
  mapWarehouseInboundReceiptListDto,
  mapWarehouseItemUnitDto,
  mapWarehouseItemUnitListDto,
  mapWarehouseListDto,
} from "@/lib/mappers/warehouse.mapper";
import type { Order } from "@/lib/models/order.model";
import type { Product } from "@/lib/models/product.model";
import type {
  ConfirmDeliveryPayload,
  CreateExitSlipPayload,
  CreateInboundReceiptPayload,
  ExitSlip,
  ExitSlipPdfData,
  ProductWarehouseInventory,
  UpdateInboundReceiptPayload,
  ValidateExitSlipScanPayload,
  Warehouse,
  WarehouseInboundReceipt,
  WarehouseItemUnit,
} from "@/lib/models/warehouse.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

export interface WarehousePayload {
  name: string;
  code: string;
  type: string;
  allowedOrderTypes: Array<"normal" | "naja">;
  isDefault?: boolean;
  status?: string;
}

export async function listWarehouses(): Promise<Warehouse[]> {
  const data = await httpClient.get<unknown>("/api/warehouses");
  return mapWarehouseListDto(data);
}

export async function getWarehouse(objectId: string): Promise<Warehouse> {
  const data = await httpClient.get<unknown>(`/api/warehouses/${objectId}`);
  return mapWarehouseDto(data);
}

export async function createWarehouse(
  payload: WarehousePayload,
): Promise<Warehouse> {
  const data = await httpClient.post<unknown>(
    "/api/warehouses",
    normalizeWarehousePayload(payload),
  );
  return mapWarehouseDto(data);
}

export async function updateWarehouse(
  objectId: string,
  payload: Partial<WarehousePayload>,
): Promise<Warehouse> {
  const data = await httpClient.put<unknown>(
    `/api/warehouses/${objectId}`,
    normalizeWarehousePayload(payload),
  );
  return mapWarehouseDto(data);
}

export async function getWarehouseInventory(
  filters?: Record<string, string | undefined>,
): Promise<Product[]> {
  const data = await httpClient.get<unknown>(buildWarehouseInventoryPath(filters));
  return mapProductListDto(data);
}

export async function getProductWarehouseInventory(
  productObjectId: string,
): Promise<ProductWarehouseInventory[]> {
  const data = await httpClient.get<unknown>(
    `/api/products/${productObjectId}/warehouse-inventory`,
  );
  return mapProductWarehouseInventoryListDto(data);
}

export async function createInboundReceipt(
  payload: CreateInboundReceiptPayload,
): Promise<WarehouseInboundReceipt> {
  const data = await httpClient.post<unknown>(
    "/api/warehouse/inbound",
    normalizeInboundPayload(payload),
  );
  return mapWarehouseInboundReceiptDto(data);
}

export async function listInboundReceipts(): Promise<WarehouseInboundReceipt[]> {
  const data = await httpClient.get<unknown>("/api/warehouse/inbound");
  return mapWarehouseInboundReceiptListDto(data);
}

export async function getInboundReceipt(
  objectId: string,
): Promise<WarehouseInboundReceipt> {
  const data = await httpClient.get<unknown>(`/api/warehouse/inbound/${objectId}`);
  return mapWarehouseInboundReceiptDto(data);
}

export async function updateInboundReceipt(
  objectId: string,
  payload: UpdateInboundReceiptPayload,
): Promise<WarehouseInboundReceipt> {
  const data = await httpClient.put<unknown>(
    `/api/warehouse/inbound/${objectId}`,
    normalizeUpdateInboundPayload(payload),
  );
  return mapWarehouseInboundReceiptDto(data);
}

export async function listWarehouseUnits(
  filters?: Record<string, string | undefined>,
): Promise<WarehouseItemUnit[]> {
  const data = await httpClient.get<unknown>(buildWarehouseUnitsPath(filters));
  return mapWarehouseItemUnitListDto(data);
}

export async function listWarehouseOrders(): Promise<Order[]> {
  const data = await httpClient.get<unknown>("/api/warehouse/orders");
  return mapOrderListDto(data);
}

export async function listWarehouseInventory(): Promise<Product[]> {
  try {
    const data = await httpClient.get<unknown>("/api/warehouse/inventory");
    return mapProductListDto(data);
  } catch (error) {
    // Backward compatible while older backend deployments do not expose
    // /api/warehouse/inventory yet. The warehouse viewer role still returns
    // warehouseStock from the product serializer.
    if (error instanceof ApiError && error.status === 404) {
      const fallbackData = await httpClient.get<unknown>(
        "/api/products?viewerRole=warehouse",
      );
      return mapProductListDto(fallbackData);
    }
    throw error;
  }
}

export async function validateExitSlipScan(
  orderObjectId: string,
  payload: ValidateExitSlipScanPayload,
): Promise<WarehouseItemUnit> {
  const data = await httpClient.post<unknown>(
    `/api/orders/${orderObjectId}/exit-slip/validate-scan`,
    {
      scannedCode: normalizeDigits(payload.scannedCode.trim()),
      currentScannedUnitIds: payload.currentScannedUnitIds,
    },
  );
  return mapWarehouseItemUnitDto(data);
}

export async function createExitSlip(
  orderObjectId: string,
  payload: CreateExitSlipPayload,
): Promise<ExitSlip> {
  const data = await httpClient.post<unknown>(
    `/api/orders/${orderObjectId}/exit-slip`,
    {
      ...payload,
      unitObjectIds: payload.unitObjectIds,
    },
  );
  return mapExitSlipDto(data);
}

export async function listExitSlips(): Promise<ExitSlip[]> {
  const data = await httpClient.get<unknown>("/api/exit-slips");
  return mapExitSlipListDto(data);
}

export async function getExitSlip(objectId: string): Promise<ExitSlip> {
  const data = await httpClient.get<unknown>(`/api/exit-slips/${objectId}`);
  return mapExitSlipDto(data);
}

export async function getExitSlipPdfData(
  objectId: string,
): Promise<ExitSlipPdfData> {
  const data = await httpClient.get<unknown>(
    `/api/exit-slips/${objectId}/pdf-data`,
  );
  return mapExitSlipPdfDataDto(data);
}

export async function getDeliveryByToken(token: string): Promise<ExitSlip> {
  const data = await httpClient.get<unknown>(`/api/delivery/${token}`);
  return mapExitSlipDto(data);
}

export async function confirmDelivery(
  token: string,
  payload: ConfirmDeliveryPayload,
): Promise<ExitSlip> {
  const data = await httpClient.post<unknown>(
    `/api/delivery/${token}/confirm`,
    {
      phone: normalizePhone(payload.phone),
      deliveryCode: normalizeDigits(payload.deliveryCode.trim()),
    },
  );
  return mapExitSlipDto(data);
}

export async function confirmExitSlipDelivery(
  exitSlipObjectId: string,
): Promise<ExitSlip> {
  const data = await httpClient.post<unknown>(
    `/api/exit-slips/${exitSlipObjectId}/confirm-delivery`,
  );
  return mapExitSlipDto(data);
}

function normalizeInboundPayload(
  payload: CreateInboundReceiptPayload,
): CreateInboundReceiptPayload {
  return {
    ...payload,
    warehouseId: payload.warehouseId
      ? normalizeDigits(payload.warehouseId)
      : payload.warehouseId,
    units: payload.units.map((unit) => ({
      productIdentifier: normalizeDigits(unit.productIdentifier.trim()),
      serialNumber: normalizeDigits(unit.serialNumber.trim()),
      trackingCode: normalizeDigits(unit.trackingCode.trim()),
    })),
  };
}

function normalizeWarehousePayload(
  payload: Partial<WarehousePayload>,
): Record<string, unknown> {
  return {
    ...payload,
    code: payload.code ? normalizeDigits(payload.code) : payload.code,
    allowedOrderTypes: payload.allowedOrderTypes ?? [],
  };
}

function normalizeUpdateInboundPayload(
  payload: UpdateInboundReceiptPayload,
): UpdateInboundReceiptPayload {
  return {
    ...payload,
    units: payload.units.map((unit) => ({
      objectId: unit.objectId,
      productIdentifier: normalizeDigits(unit.productIdentifier.trim()),
      serialNumber: normalizeDigits(unit.serialNumber.trim()),
      trackingCode: normalizeDigits(unit.trackingCode.trim()),
    })),
  };
}

function buildWarehouseUnitsPath(
  filters?: Record<string, string | undefined>,
): string {
  if (!filters) return "/api/warehouse/units";

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `/api/warehouse/units?${query}` : "/api/warehouse/units";
}

function buildWarehouseInventoryPath(
  filters?: Record<string, string | undefined>,
): string {
  if (!filters) return "/api/warehouse/inventory";

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `/api/warehouse/inventory?${query}` : "/api/warehouse/inventory";
}
