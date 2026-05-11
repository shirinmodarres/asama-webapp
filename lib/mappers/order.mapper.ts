import {
  getOrderStatusLabel,
  getWarehouseStatusLabel,
} from "@/lib/domain/statuses";
import {
  toArray,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import { mapNajaCenterSummaryDto } from "@/lib/mappers/naja-center.mapper";
import type { Order, OrderItem, OrderType } from "@/lib/models/order.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

export function mapOrderDto(dto: unknown): Order {
  const record = toRecord(dto);
  const customerRecord = toRecord(record.customer);
  const addressRecord = toRecord(
    record.deliveryAddress ?? record.customerAddress ?? record.address,
  );

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    code: toStringValue(record.code),
    orderType: mapOrderType(record.orderType),
    createdByName: toStringValue(record.createdByName),
    customerName: toNullableString(
      record.customerName ?? customerRecord.fullName,
    ),
    customerObjectId: toNullableString(
      record.customerObjectId ?? customerRecord.objectId,
    ),
    customerAddressObjectId: toNullableString(
      record.customerAddressObjectId ?? addressRecord.objectId,
    ),
    customerNationalId: normalizeNullableDigits(
      record.customerNationalId ?? record.nationalId ?? customerRecord.nationalId,
    ),
    customerPhone: normalizeNullablePhone(
      record.customerPhone ?? record.phoneNumber ?? customerRecord.phone,
    ),
    deliveryAddressTitle: toNullableString(
      record.deliveryAddressTitle ?? addressRecord.title,
    ),
    deliveryProvince: toNullableString(
      record.deliveryProvince ?? addressRecord.province,
    ),
    deliveryCity: toNullableString(record.deliveryCity ?? addressRecord.city),
    deliveryCounty: toNullableString(
      record.deliveryCounty ?? addressRecord.county,
    ),
    deliveryFullAddress: toNullableString(
      record.deliveryFullAddress ??
        record.fullAddress ??
        addressRecord.fullAddress,
    ),
    deliveryPostalCode: normalizeNullableDigits(
      record.deliveryPostalCode ?? addressRecord.postalCode,
    ),
    deliveryPlaque: normalizeNullableDigits(
      record.deliveryPlaque ?? addressRecord.plaque,
    ),
    deliveryUnit: normalizeNullableDigits(record.deliveryUnit ?? addressRecord.unit),
    receiverFullName: toNullableString(
      record.receiverFullName ??
        record.receiverName ??
        addressRecord.receiverFullName ??
        addressRecord.receiverName,
    ),
    receiverPhone: normalizeNullablePhone(
      record.receiverPhone ?? addressRecord.receiverPhone,
    ),
    orderStatus: toStringValue(record.orderStatus) || "pending",
    orderStatusLabel: getOrderStatusLabel(
      toStringValue(record.orderStatus) || "pending",
    ),
    warehouseStatus: toStringValue(record.warehouseStatus),
    warehouseStatusLabel: getWarehouseStatusLabel(
      toStringValue(record.warehouseStatus),
    ),
    sourceLabel: toNullableString(record.sourceLabel),
    notes: toNullableString(record.notes),
    cancelReason: toNullableString(record.cancelReason),
    returnReason: toNullableString(record.returnReason),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
    najaCenter: mapNajaCenterSummaryDto(
      record.najaCenter ??
        record.center ??
        record.centerInfo ??
        record.najaCenterInfo,
      record,
    ),
    items: toArray(record.items).map(mapOrderItemDto),
  };
}

export function mapOrderListDto(dto: unknown): Order[] {
  return Array.isArray(dto) ? dto.map(mapOrderDto) : [];
}

function mapOrderItemDto(dto: unknown): OrderItem {
  const record = toRecord(dto);

  return {
    objectId: toStringValue(record.objectId),
    productId: toStringValue(record.productId),
    productSku: toStringValue(record.productSku),
    productName: toStringValue(record.productName),
    brand: toStringValue(record.brand),
    quantity: toNumberValue(record.quantity),
    unitPrice: toNumberValue(record.unitPrice),
    productIdentifier: normalizeNullableDigits(record.productIdentifier),
    trackingCode: normalizeNullableDigits(record.trackingCode),
  };
}

function mapOrderType(value: unknown): OrderType {
  return value === "naja" ? "naja" : "normal";
}

function normalizeNullableDigits(value: unknown): string | null {
  const text = toNullableString(value);
  return text ? normalizeDigits(text) : null;
}

function normalizeNullablePhone(value: unknown): string | null {
  const text = toNullableString(value);
  return text ? normalizePhone(text) : null;
}
