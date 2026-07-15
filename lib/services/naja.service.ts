import { httpClient } from "@/lib/api/http-client";
import { mapInvoiceDto } from "@/lib/mappers/invoice.mapper";
import { mapOrderDto } from "@/lib/mappers/order.mapper";
import type { Invoice } from "@/lib/models/invoice.model";
import type {
  CompleteNajaWarehouseInfoPayload,
  CreateNajaInvoicePayload,
  CreateNajaOrderPayload,
  NajaRialReport,
  NajaRialReportFilters,
  NajaRialReportRow,
} from "@/lib/models/naja.model";
import type { Order } from "@/lib/models/order.model";
import { toArray, toNumberValue, toRecord, toStringValue } from "@/lib/mappers/mapper-utils";
import { normalizeDigits, toNumber } from "@/lib/utils/number-format";

export async function createNajaOrder(
  payload: CreateNajaOrderPayload,
): Promise<Order> {
  const data = await httpClient.post<unknown>(
    "/api/naja/orders",
    {
      ...payload,
      recipientNationalId: normalizeDigits(payload.recipientNationalId),
      najaOrderNumber: normalizeDigits(payload.najaOrderNumber),
      quantity:
        payload.quantity !== undefined ? toNumber(payload.quantity) : undefined,
      items: payload.items?.map((item) => ({
        ...item,
        quantity: toNumber(item.quantity),
        unitPrice:
          item.unitPrice !== undefined ? toNumber(item.unitPrice) : undefined,
        priceNoteItemId:
          item.priceNoteItemId !== undefined && item.priceNoteItemId !== null
            ? toNumber(item.priceNoteItemId)
            : item.priceNoteItemId,
      })),
    },
  );
  return mapOrderDto(data);
}

export async function approveNajaOrder(
  orderObjectId: string,
): Promise<Order> {
  const data = await httpClient.post<unknown>(
    `/api/naja/orders/${orderObjectId}/approve`,
  );
  return mapOrderDto(data);
}

export async function rejectNajaOrder(
  orderObjectId: string,
  payload: { reason: string; rejectedByName?: string },
): Promise<Order> {
  const data = await httpClient.post<unknown>(
    `/api/naja/orders/${orderObjectId}/reject`,
    payload,
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

export async function getNajaRialReport(
  filters: NajaRialReportFilters = {},
): Promise<NajaRialReport> {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      query.set(key, String(value));
    }
  });
  const path = `/api/naja/reports/rial${query.toString() ? `?${query.toString()}` : ""}`;
  const data = await httpClient.get<unknown>(path);
  const record = toRecord(data);
  return {
    rows: toArray(record.rows).map(mapNajaRialReportRow),
    totals: {
      totalOrders: toNumberValue(toRecord(record.totals).totalOrders),
      totalQuantity: toNumberValue(toRecord(record.totals).totalQuantity),
      totalRialAmount: toNumberValue(toRecord(record.totals).totalRialAmount),
    },
  };
}

function mapNajaRialReportRow(dto: unknown): NajaRialReportRow {
  const record = toRecord(dto);
  return {
    id: toStringValue(record.id),
    orderObjectId: toStringValue(record.orderObjectId),
    orderCode: toStringValue(record.orderCode),
    createdAt: nullableString(record.createdAt),
    najaPurchaseDate: nullableString(record.najaPurchaseDate),
    customerObjectId: nullableString(record.customerObjectId),
    customerName: nullableString(record.customerName),
    sepidarCustomerCode: nullableString(record.sepidarCustomerCode),
    expertUserId: nullableString(record.expertUserId),
    expertName: nullableString(record.expertName),
    recipientFirstName: nullableString(record.recipientFirstName),
    recipientLastName: nullableString(record.recipientLastName),
    recipientFullName: nullableString(record.recipientFullName),
    recipientNationalId: nullableString(record.recipientNationalId),
    recipientMobile: nullableString(record.recipientMobile),
    najaOrderNumber: nullableString(record.najaOrderNumber),
    productObjectId: nullableString(record.productObjectId),
    productSku: nullableString(record.productSku),
    productName: toStringValue(record.productName),
    quantity: toNumberValue(record.quantity),
    unitPrice: toNumberValue(record.unitPrice),
    lineTotal: toNumberValue(record.lineTotal),
    orderTotal: toNumberValue(record.orderTotal),
    orderStatus: toStringValue(record.orderStatus),
    orderStatusLabel: toStringValue(record.orderStatusLabel),
    stockObjectId: nullableString(record.stockObjectId),
    sepidarStockId:
      record.sepidarStockId === null || record.sepidarStockId === undefined
        ? null
        : toNumberValue(record.sepidarStockId),
    stockTitle: nullableString(record.stockTitle),
    saleTypeObjectId: nullableString(record.saleTypeObjectId),
    sepidarSaleTypeId:
      record.sepidarSaleTypeId === null || record.sepidarSaleTypeId === undefined
        ? null
        : toNumberValue(record.sepidarSaleTypeId),
    priceListTitle: nullableString(record.priceListTitle),
    saleTypeTitle: nullableString(record.saleTypeTitle),
  };
}

function nullableString(value: unknown): string | null {
  const text = toStringValue(value);
  return text ? text : null;
}
