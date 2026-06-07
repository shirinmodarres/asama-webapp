import {
  toArray,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import { mapWarehouseItemUnitListDto } from "@/lib/mappers/warehouse.mapper";
import type {
  InternalInvoice,
  InternalInvoiceItem,
} from "@/lib/models/internal-invoice.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

const STATUS_LABELS: Record<string, string> = {
  ready: "آماده ثبت",
  pending_entry: "آماده ثبت",
  entered: "ثبت‌شده در حسابداری",
};

export function mapInternalInvoiceItemDto(dto: unknown): InternalInvoiceItem {
  const record = toRecord(dto);
  const product = toRecord(record.product);
  const quantity = toNumberValue(record.quantity);
  const unitPrice = toNumberValue(record.unitPrice ?? record.price);

  return {
    objectId: toStringValue(record.objectId),
    productObjectId: toStringValue(
      record.productObjectId ?? record.productId ?? product.objectId,
    ),
    productCode: normalizeDigits(
      toStringValue(
        record.productCode ??
          record.productSku ??
          record.sepidarCode ??
          product.sku ??
          product.code,
      ),
    ),
    productName: toStringValue(
      record.productName ?? record.title ?? product.name ?? product.title,
    ),
    quantity,
    unitPrice,
    lineTotal: toNumberValue(record.lineTotal) || quantity * unitPrice,
    units: mapWarehouseItemUnitListDto(record.units),
  };
}

export function mapInternalInvoiceDto(dto: unknown): InternalInvoice {
  const wrapper = toRecord(dto);
  const nested = toRecord(wrapper.internalInvoice ?? wrapper.invoice);
  const record = Object.keys(nested).length ? nested : wrapper;
  const order = toRecord(record.order);
  const exitSlip = toRecord(record.exitSlip);
  const status = toStringValue(record.status) || "ready";

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    invoiceNumber: normalizeDigits(
      toStringValue(
        record.invoiceNumber ??
          record.internalInvoiceNumber ??
          record.invoiceCode ??
          record.code,
      ),
    ),
    orderObjectId: toStringValue(
      record.orderObjectId ?? record.orderId ?? order.objectId,
    ),
    orderNumber: normalizeDigits(
      toStringValue(
        record.orderNumber ?? record.orderCode ?? order.orderCode ?? order.code,
      ),
    ),
    exitSlipObjectId: toStringValue(
      record.exitSlipObjectId ?? record.exitSlipId ?? exitSlip.objectId,
    ),
    exitSlipNumber: normalizeDigits(
      toStringValue(
        record.exitSlipNumber ??
          record.slipCode ??
          exitSlip.slipCode ??
          exitSlip.code,
      ),
    ),
    customerName: toNullableString(record.customerName),
    stockTitle: toNullableString(
      record.stockTitle ?? record.warehouseTitle ?? record.warehouseName,
    ),
    saleTypeTitle: toNullableString(record.saleTypeTitle),
    recipientFirstName: toNullableString(record.recipientFirstName),
    recipientLastName: toNullableString(record.recipientLastName),
    recipientNationalId: toNullableString(record.recipientNationalId)
      ? normalizeDigits(toStringValue(record.recipientNationalId))
      : null,
    recipientMobile: toNullableString(record.recipientMobile)
      ? normalizePhone(toStringValue(record.recipientMobile))
      : null,
    najaOrderNumber: toNullableString(
      record.najaOrderNumber ?? record.externalOrderNumber,
    )
      ? normalizeDigits(
          toStringValue(record.najaOrderNumber ?? record.externalOrderNumber),
        )
      : null,
    grossAmount: toNumberValue(record.grossAmount ?? record.totalAmount),
    discount: toNumberValue(record.discount),
    tax: toNumberValue(record.tax),
    duty: toNumberValue(record.duty),
    addition: toNumberValue(record.addition),
    netAmount: toNumberValue(record.netAmount ?? record.payableAmount),
    status,
    statusLabel:
      toStringValue(record.statusLabel) || STATUS_LABELS[status] || status,
    manualInvoiceNumber: toNullableString(record.manualInvoiceNumber),
    accountantNote: toNullableString(record.accountantNote),
    enteredAt: toNullableString(record.enteredAt),
    pdfUrl: toNullableString(record.pdfUrl),
    items: toArray(record.items).map(mapInternalInvoiceItemDto),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapInternalInvoiceListDto(dto: unknown): InternalInvoice[] {
  const record = toRecord(dto);
  const source = Array.isArray(dto)
    ? dto
    : toArray(record.items).length
      ? record.items
      : toArray(record.results).length
        ? record.results
        : record.data;

  return toArray(source).map(mapInternalInvoiceDto);
}
