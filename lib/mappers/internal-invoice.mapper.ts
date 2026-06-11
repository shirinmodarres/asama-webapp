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
  ready_for_accounting: "آماده ثبت در حسابداری",
  ready_for_accountin: "آماده ثبت در حسابداری",
  entered_manually: "ثبت‌شده در حسابداری",
  cancelled: "لغوشده",
};

export function getInternalInvoiceStatusLabel(
  status: string,
  statusLabel?: unknown,
): string {
  const providedLabel = toStringValue(statusLabel);
  if (
    providedLabel &&
    !Object.prototype.hasOwnProperty.call(STATUS_LABELS, providedLabel)
  ) {
    return providedLabel;
  }
  return STATUS_LABELS[status] || STATUS_LABELS[providedLabel] || status;
}

export function mapInternalInvoiceItemDto(dto: unknown): InternalInvoiceItem {
  const record = toRecord(dto);
  const product = toRecord(record.product);
  const quantity = toNumberValue(record.quantity);
  const unitPrice = toNumberValue(record.unitPrice ?? record.price);

  return {
    objectId: toStringValue(record.objectId),
    rowNumber: toNumberValue(record.rowNumber),
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
    sepidarCode: normalizeDigits(
      toStringValue(record.sepidarCode ?? record.productCode),
    ),
    productName: toStringValue(
      record.productName ?? record.title ?? product.name ?? product.title,
    ),
    quantity,
    unitPrice,
    lineTotal: toNumberValue(record.lineTotal) || quantity * unitPrice,
    serialNumbers: toArray(record.serialNumbers).map((value) =>
      normalizeDigits(toStringValue(value)),
    ),
    trackingCodes: toArray(record.trackingCodes).map((value) =>
      normalizeDigits(toStringValue(value)),
    ),
    productIdentifiers: toArray(record.productIdentifiers).map((value) =>
      normalizeDigits(toStringValue(value)),
    ),
    units: mapWarehouseItemUnitListDto(record.units),
  };
}

export function mapInternalInvoiceDto(dto: unknown): InternalInvoice {
  const wrapper = toRecord(dto);
  const nested = toRecord(wrapper.internalInvoice ?? wrapper.invoice);
  const record = Object.keys(nested).length ? nested : wrapper;
  const order = toRecord(record.order);
  const exitSlip = toRecord(record.exitSlip);
  const rawStatus = toStringValue(record.status) || "ready_for_accounting";
  const status =
    rawStatus === "ready_for_accountin"
      ? "ready_for_accounting"
      : rawStatus;

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
    invoiceDate: toStringValue(record.invoiceDate ?? record.createdAt),
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
    customerName: toNullableString(
      record.customerName ?? order.customerName,
    ),
    customerCode: toNullableString(
      record.customerCode ?? record.sepidarCustomerCode,
    ),
    sepidarCustomerCode: toNullableString(
      record.sepidarCustomerCode ?? record.customerCode,
    ),
    customerMobile: toNullableString(
      record.customerMobile ?? order.customerMobile ?? order.customerPhone,
    )
      ? normalizePhone(
          toStringValue(
            record.customerMobile ?? order.customerMobile ?? order.customerPhone,
          ),
        )
      : null,
    customerPhone: toNullableString(
      record.customerPhone ?? order.customerPhone ?? order.customerMobile,
    )
      ? normalizePhone(
          toStringValue(
            record.customerPhone ?? order.customerPhone ?? order.customerMobile,
          ),
        )
      : null,
    customerAddress: toNullableString(
      record.customerAddress ??
        order.customerAddressSnapshot ??
        order.deliveryFullAddress,
    ),
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
    discount: toNumberValue(record.discountAmount ?? record.discount),
    tax: toNumberValue(record.taxAmount ?? record.tax),
    duty: toNumberValue(record.dutyAmount ?? record.duty),
    addition: toNumberValue(record.additionAmount ?? record.addition),
    netAmount: toNumberValue(record.netAmount ?? record.payableAmount),
    status,
    statusLabel: getInternalInvoiceStatusLabel(status, record.statusLabel),
    manualInvoiceNumber: toNullableString(record.manualInvoiceNumber),
    accountantNote: toNullableString(record.accountantNote),
    enteredAt: toNullableString(
      record.enteredManuallyAt ?? record.enteredAt,
    ),
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
