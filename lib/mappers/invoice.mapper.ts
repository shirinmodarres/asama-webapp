import { getInvoiceStatusLabel } from "@/lib/domain/statuses";
import {
  toArray,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import type {
  Invoice,
  InvoiceLine,
  InvoiceStatus,
  InvoiceType,
} from "@/lib/models/invoice.model";

export function mapInvoiceDto(dto: unknown): Invoice {
  const record = toRecord(dto);

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    invoiceCode: toStringValue(record.invoiceCode),
    orderId: toStringValue(record.orderId),
    orderCode: toStringValue(record.orderCode),
    invoiceType: mapInvoiceType(record.invoiceType),
    invoiceName: toStringValue(record.invoiceName),
    createdByName: toStringValue(record.createdByName),
    totalAmount: toNumberValue(record.totalAmount),
    status: mapInvoiceStatus(record.status),
    statusLabel:
      toStringValue(record.statusLabel) ||
      getInvoiceStatusLabel(toStringValue(record.status)),
    notes: toNullableString(record.notes),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
    lines: toArray(record.lines).map(mapInvoiceLineDto),
  };
}

export function mapInvoiceListDto(dto: unknown): Invoice[] {
  return Array.isArray(dto) ? dto.map(mapInvoiceDto) : [];
}

function mapInvoiceLineDto(dto: unknown): InvoiceLine {
  const record = toRecord(dto);
  const quantity = toNumberValue(record.quantity);
  const unitPrice = toNumberValue(record.unitPrice);

  return {
    objectId: toStringValue(record.objectId),
    productId: toStringValue(record.productId),
    productSku: toStringValue(record.productSku),
    productName: toStringValue(record.productName),
    brand: toStringValue(record.brand),
    quantity,
    unitPrice,
    totalAmount: toNumberValue(record.totalAmount) || quantity * unitPrice,
  };
}

function mapInvoiceType(value: unknown): InvoiceType {
  return value === "naja" ? "naja" : "normal";
}

function mapInvoiceStatus(value: unknown): InvoiceStatus {
  return value === "needs_follow_up" ? "needs_follow_up" : "issued";
}
