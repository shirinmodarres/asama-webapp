import { httpClient } from "@/lib/api/http-client";
import { mapInvoiceDto } from "@/lib/mappers/invoice.mapper";
import { mapOrderDto } from "@/lib/mappers/order.mapper";
import type { Invoice } from "@/lib/models/invoice.model";
import type {
  CompleteNajaWarehouseInfoPayload,
  CreateNajaInvoicePayload,
  CreateNajaOrderPayload,
} from "@/lib/models/naja.model";
import type { Order } from "@/lib/models/order.model";
import {
  normalizeDigits,
  normalizePhone,
  toNumber,
} from "@/lib/utils/number-format";

export async function createNajaOrder(
  payload: CreateNajaOrderPayload,
): Promise<Order> {
  const data = await httpClient.post<unknown>(
    "/api/naja/orders",
    {
      ...payload,
      customerNationalId: normalizeDigits(payload.customerNationalId),
      customerPhone: normalizePhone(payload.customerPhone),
      quantity: toNumber(payload.quantity),
    },
  );
  return mapOrderDto(data);
}

export async function completeNajaWarehouseInfo(
  orderObjectId: string,
  payload: CompleteNajaWarehouseInfoPayload,
): Promise<Order> {
  const data = await httpClient.post<unknown>(
    `/api/naja/orders/${orderObjectId}/warehouse-info`,
    {
      ...payload,
      productIdentifier: normalizeDigits(payload.productIdentifier),
      trackingCode: normalizeDigits(payload.trackingCode),
    },
  );
  return mapOrderDto(data);
}

export async function createNajaInvoice(
  orderObjectId: string,
  payload: CreateNajaInvoicePayload,
): Promise<Invoice> {
  const data = await httpClient.post<unknown>(
    `/api/naja/orders/${orderObjectId}/invoice`,
    payload,
  );
  return mapInvoiceDto(data);
}

export async function returnNajaOrder(
  orderObjectId: string,
  reason: string,
): Promise<Order> {
  const data = await httpClient.post<unknown>(
    `/api/naja/orders/${orderObjectId}/return`,
    { reason },
  );
  return mapOrderDto(data);
}
