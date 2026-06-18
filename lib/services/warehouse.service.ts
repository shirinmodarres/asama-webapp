import { httpClient } from "@/lib/api/http-client";
import { getOrder } from "@/lib/services/order.service";
import { mapOrderListDto } from "@/lib/mappers/order.mapper";
import { mapProductListDto } from "@/lib/mappers/product.mapper";
import { mapProductStockInventoryListDto } from "@/lib/mappers/stock.mapper";
import {
  mapExitSlipDto,
  mapExitSlipPdfDataDto,
  mapExitSlipListDto,
  mapProductWarehouseInventoryListDto,
  mapWarehouseInboundReceiptDto,
  mapWarehouseInboundReceiptListDto,
  mapWarehouseItemUnitDto,
  mapWarehouseItemUnitListDto,
} from "@/lib/mappers/warehouse.mapper";
import type { Order } from "@/lib/models/order.model";
import type { Product } from "@/lib/models/product.model";
import type { ProductStockInventory } from "@/lib/models/stock.model";
import type {
  ConfirmDeliveryPayload,
  CreateExitSlipPayload,
  CreateInboundReceiptPayload,
  ExitSlip,
  ExitSlipPdfData,
  ProductWarehouseInventory,
  UpdateInboundReceiptPayload,
  ValidateExitSlipScanPayload,
  WarehouseInboundReceipt,
  WarehouseItemUnit,
} from "@/lib/models/warehouse.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

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

export async function getInboundReceiptEditData(
  objectId: string,
): Promise<WarehouseInboundReceipt> {
  const data = await httpClient.get<unknown>(
    `/api/warehouse/inbound-receipts/${objectId}/edit`,
  );
  return mapWarehouseInboundReceiptDto(data);
}

export async function updateInboundReceipt(
  objectId: string,
  payload: UpdateInboundReceiptPayload,
): Promise<WarehouseInboundReceipt> {
  const data = await httpClient.patch<unknown>(
    `/api/warehouse/inbound-receipts/${objectId}`,
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

export async function listWarehouseInventory(): Promise<
  ProductStockInventory[]
> {
  const data = await httpClient.get<unknown>("/api/warehouse/inventory");
  return mapProductStockInventoryListDto(data);
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
  const slip = mapExitSlipDto(data);
  return hydrateExitSlipOrder(slip);
}

export async function getExitSlipPdfData(
  objectId: string,
): Promise<ExitSlipPdfData> {
  const [data, slip] = await Promise.all([
    httpClient.get<unknown>(`/api/exit-slips/${objectId}/pdf-data`),
    getExitSlip(objectId),
  ]);
  const pdfData = mapExitSlipPdfDataDto(data);

  return {
    ...pdfData,
    customer: {
      name: pdfData.customer.name || slip.customerName,
      sepidarCustomerCode:
        pdfData.customer.sepidarCustomerCode || slip.sepidarCustomerCode,
      mobile: pdfData.customer.mobile || slip.customerMobile,
      phone: pdfData.customer.phone || slip.customerPhone,
      address:
        pdfData.customer.address ||
        slip.customerAddress ||
        slip.deliveryAddress ||
        slip.deliveryFullAddress,
    },
    recipient: {
      firstName:
        pdfData.recipient.firstName || slip.recipientFirstName,
      lastName: pdfData.recipient.lastName || slip.recipientLastName,
      nationalId:
        pdfData.recipient.nationalId || slip.recipientNationalId,
      mobile: pdfData.recipient.mobile || slip.recipientMobile,
      najaOrderNumber:
        pdfData.recipient.najaOrderNumber || slip.najaOrderNumber,
    },
    order: pdfData.order || slip.order,
  };
}

export async function getDeliveryByToken(token: string): Promise<ExitSlip> {
  const data = await httpClient.get<unknown>(`/api/delivery/${token}`);
  const delivery = mapExitSlipDto(data);
  return hydrateExitSlipOrder(delivery);
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
  const delivery = mapExitSlipDto(data);
  return hydrateExitSlipOrder(delivery);
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
    units: payload.units.map((unit) => ({
      productIdentifier: normalizeDigits(unit.productIdentifier.trim()),
      serialNumber: normalizeDigits(unit.serialNumber.trim()),
      trackingCode: normalizeDigits(unit.trackingCode.trim()),
    })),
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
      quantity: Number(unit.quantity) || 0,
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

async function hydrateExitSlipOrder(slip: ExitSlip): Promise<ExitSlip> {
  if (slip.order || !slip.orderId) return slip;

  try {
    const order = await getOrder(slip.orderId);
    return { ...slip, order };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[EXIT_SLIP_ORDER_LOAD_FAILED]", {
        exitSlipObjectId: slip.objectId,
        orderId: slip.orderId,
        error,
      });
    }
    return slip;
  }
}
