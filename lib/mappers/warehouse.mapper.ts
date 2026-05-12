import {
  toArray,
  toBooleanValue,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import type {
  ExitSlip,
  ExitSlipPdfData,
  WarehouseInboundReceipt,
  WarehouseItemUnit,
  WarehouseUnitStatus,
} from "@/lib/models/warehouse.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

const UNIT_STATUS_LABELS: Record<WarehouseUnitStatus, string> = {
  in_stock: "موجود در انبار",
  reserved_for_order: "رزرو شده برای سفارش",
  dispatched: "خارج شده از انبار",
  delivered: "تحویل شده",
  returned: "برگشتی",
};

export function mapWarehouseItemUnitDto(dto: unknown): WarehouseItemUnit {
  const wrapper = toRecord(dto);
  const nestedUnit = toRecord(wrapper.unit);
  const record = Object.keys(nestedUnit).length ? nestedUnit : wrapper;
  const status = toStringValue(record.status) || "in_stock";

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    productObjectId: toStringValue(record.productObjectId),
    productSku: normalizeDigits(toStringValue(record.productSku)),
    productName: toStringValue(record.productName),
    productBrand: toStringValue(record.productBrand ?? record.brand),
    productModel: toNullableString(record.productModel ?? record.model),
    productIdentifier: normalizeDigits(toStringValue(record.productIdentifier)),
    serialNumber: normalizeDigits(toStringValue(record.serialNumber)),
    trackingCode: normalizeDigits(toStringValue(record.trackingCode)),
    quantity: toNumberValue(record.quantity) || 1,
    status,
    statusLabel:
      UNIT_STATUS_LABELS[status as WarehouseUnitStatus] ||
      toStringValue(record.statusLabel) ||
      status,
    inboundReceiptId: toNullableString(record.inboundReceiptId),
    exitSlipId: toNullableString(record.exitSlipId),
    orderId: toNullableString(record.orderId),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapWarehouseItemUnitListDto(dto: unknown): WarehouseItemUnit[] {
  return toArray(dto).map(mapWarehouseItemUnitDto);
}

export function mapWarehouseInboundReceiptDto(
  dto: unknown,
): WarehouseInboundReceipt {
  const record = toRecord(dto);

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    receiptCode: normalizeDigits(toStringValue(record.receiptCode)),
    productObjectId: toStringValue(record.productObjectId),
    productSku: normalizeDigits(toStringValue(record.productSku)),
    productName: toStringValue(record.productName),
    quantity: toNumberValue(record.quantity),
    createdByName: toNullableString(record.createdByName),
    notes: toNullableString(record.notes),
    units: mapWarehouseItemUnitListDto(record.units),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapWarehouseInboundReceiptListDto(
  dto: unknown,
): WarehouseInboundReceipt[] {
  return toArray(dto).map(mapWarehouseInboundReceiptDto);
}

export function mapExitSlipDto(dto: unknown): ExitSlip {
  const record = toRecord(dto);
  const nestedSlip = toRecord(record.exitSlip);
  const source = Object.keys(nestedSlip).length ? nestedSlip : record;
  const deliveryAddress = toRecord(source.deliveryAddress);
  const fullAddress = toNullableString(
    source.deliveryFullAddress ??
      deliveryAddress.formatted ??
      deliveryAddress.fullAddress,
  );

  return {
    objectId: toStringValue(source.objectId),
    id: toStringValue(source.id) || toStringValue(source.objectId),
    slipCode: normalizeDigits(
      toStringValue(source.slipCode) || toStringValue(source.slipNumber),
    ),
    orderId: toStringValue(source.orderId),
    orderCode: normalizeDigits(toStringValue(source.orderCode)),
    issuedByName: toStringValue(source.issuedByName),
    exitDate: toStringValue(source.exitDate),
    deliveryToken: toNullableString(source.deliveryToken),
    deliveryLink: toNullableString(source.deliveryLink),
    pdfUrl: toNullableString(source.pdfUrl),
    deliveryCode: source.deliveryCode
      ? normalizeDigits(toStringValue(source.deliveryCode))
      : null,
    deliveryConfirmed: toBooleanValue(source.deliveryConfirmed),
    deliveryConfirmedAt: toNullableString(source.deliveryConfirmedAt),
    deliveryConfirmedByPhone: source.deliveryConfirmedByPhone
      ? normalizePhone(toStringValue(source.deliveryConfirmedByPhone))
      : null,
    customerName: toNullableString(source.customerName),
    customerPhone: source.customerPhone
      ? normalizePhone(toStringValue(source.customerPhone))
      : null,
    receiverFullName: toNullableString(
      source.receiverFullName ?? source.receiverName,
    ),
    receiverPhone: source.receiverPhone
      ? normalizePhone(toStringValue(source.receiverPhone))
      : source.receiverPhoneMasked
        ? toStringValue(source.receiverPhoneMasked)
      : null,
    deliveryFullAddress: fullAddress,
    deliveryProvince: toNullableString(
      source.deliveryProvince ?? deliveryAddress.province,
    ),
    deliveryCity: toNullableString(source.deliveryCity ?? deliveryAddress.city),
    deliveryCounty: toNullableString(
      source.deliveryCounty ?? deliveryAddress.county,
    ),
    deliveryAddress: fullAddress,
    notes: toNullableString(source.notes),
    units: mapWarehouseItemUnitListDto(source.units ?? source.items),
    createdAt: toStringValue(source.createdAt),
    updatedAt: toStringValue(source.updatedAt),
  };
}

export function mapExitSlipListDto(dto: unknown): ExitSlip[] {
  return toArray(dto).map(mapExitSlipDto);
}

export function mapExitSlipPdfDataDto(dto: unknown): ExitSlipPdfData {
  const record = toRecord(dto);
  const customer = toRecord(record.customer);
  const receiver = toRecord(record.receiver);
  const deliveryAddress = toRecord(record.deliveryAddress);

  return {
    companyName: toStringValue(record.companyName) || "آساما",
    slipCode: normalizeDigits(toStringValue(record.slipCode)),
    orderCode: normalizeDigits(toStringValue(record.orderCode)),
    issueDate: toNullableString(record.issueDate),
    customer: {
      name: toNullableString(customer.name),
      phone: customer.phone ? normalizePhone(toStringValue(customer.phone)) : null,
    },
    receiver: {
      fullName: toNullableString(receiver.fullName),
      phone: receiver.phone ? normalizePhone(toStringValue(receiver.phone)) : null,
    },
    deliveryAddress: {
      province: toNullableString(deliveryAddress.province),
      city: toNullableString(deliveryAddress.city),
      county: toNullableString(deliveryAddress.county),
      fullAddress: toNullableString(deliveryAddress.fullAddress),
      formatted: toNullableString(deliveryAddress.formatted),
    },
    items: mapWarehouseItemUnitListDto(record.items),
    deliveryCode: record.deliveryCode
      ? normalizeDigits(toStringValue(record.deliveryCode))
      : null,
    notes: toNullableString(record.notes),
  };
}
