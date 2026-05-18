import {
  getOrderStatusLabel,
  getWarehouseStatusLabel,
} from "@/lib/domain/statuses";
import {
  getCancelReasonLabel,
  getShipmentStopReasonLabel,
} from "@/lib/domain/order-action-reasons";
import {
  mapCustomerAddressDto,
  mapCustomerDto,
} from "@/lib/mappers/customer.mapper";
import {
  toArray,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import { mapNajaCenterSummaryDto } from "@/lib/mappers/naja-center.mapper";
import type {
  FulfillmentStatus,
  Order,
  OrderItem,
  OrderType,
} from "@/lib/models/order.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

export function mapOrderDto(dto: unknown): Order {
  const record = toRecord(dto);
  const customerRecord = toRecord(record.customer);
  const customer = isObjectRecord(record.customer)
    ? mapCustomerDto(record.customer)
    : null;
  const addressRecord = toRecord(
    record.deliveryAddress ?? record.customerAddress ?? record.address,
  );
  const deliveryAddressSource =
    record.deliveryAddress ?? record.customerAddress ?? record.address;
  const deliveryAddress = isObjectRecord(deliveryAddressSource)
    ? mapCustomerAddressDto(deliveryAddressSource, record.customer)
    : null;

  const shipmentStopReasonCode = toNullableString(
    record.shipmentStopReasonCode,
  );
  const cancelReasonCode = toNullableString(record.cancelReasonCode);
  const holdReason = toNullableString(record.holdReason);
  const cancelReason = toNullableString(record.cancelReason);

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    code: toStringValue(record.code),
    orderType: mapOrderType(record.orderType),
    createdByName: toStringValue(record.createdByName),
    customerName: toNullableString(
      record.customerName ?? customerRecord.fullName,
    ),
    customer,
    customerObjectId: toNullableString(
      record.customerObjectId ?? customerRecord.objectId,
    ),
    customerAddressObjectId: toNullableString(
      record.customerAddressObjectId ?? addressRecord.objectId,
    ),
    warehouseId: toNullableString(
      record.warehouseId ?? record.warehouseObjectId ?? toRecord(record.warehouse).objectId,
    ),
    warehouseName: toNullableString(
      record.warehouseName ?? toRecord(record.warehouse).name,
    ),
    warehouseType: toNullableString(
      record.warehouseType ?? toRecord(record.warehouse).type,
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
    deliveryAddress,
    orderStatus: toStringValue(record.orderStatus) || "pending",
    orderStatusLabel: getOrderStatusLabel(
      toStringValue(record.orderStatus) || "pending",
    ),
    warehouseStatus: toStringValue(record.warehouseStatus),
    warehouseStatusLabel: getWarehouseStatusLabel(
      toStringValue(record.warehouseStatus),
    ),
    fulfillmentStatus: mapFulfillmentStatus(record.fulfillmentStatus),
    fulfillmentStatusLabel: getFulfillmentStatusLabel(
      mapFulfillmentStatus(record.fulfillmentStatus),
    ),
    holdReason,
    heldByName: toNullableString(record.heldByName),
    heldAt: toNullableString(record.heldAt),
    shipmentStopReasonCode,
    shipmentStopReasonLabel:
      toNullableString(record.shipmentStopReasonLabel) ||
      getShipmentStopReasonLabel(shipmentStopReasonCode) ||
      holdReason,
    shipmentStoppedByName: toNullableString(
      record.shipmentStoppedByName ?? record.heldByName,
    ),
    shipmentStoppedAt: toNullableString(
      record.shipmentStoppedAt ?? record.heldAt,
    ),
    sourceLabel: toNullableString(record.sourceLabel),
    notes: toNullableString(record.notes),
    cancelReasonCode,
    cancelReasonLabel:
      toNullableString(record.cancelReasonLabel) ||
      getCancelReasonLabel(cancelReasonCode) ||
      cancelReason,
    cancelledByName: toNullableString(record.cancelledByName),
    cancelledAt: toNullableString(record.cancelledAt),
    cancelReason,
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
  const productRecord = toRecord(record.product);

  return {
    objectId: toStringValue(record.objectId),
    productId: toStringValue(
      record.productObjectId ?? record.productId ?? productRecord.objectId,
    ),
    productSku: toStringValue(record.productSku ?? productRecord.sku),
    productName: toStringValue(record.productName ?? productRecord.name),
    brand: toStringValue(record.brand ?? productRecord.brand),
    quantity: toNumberValue(record.quantity),
    unitPrice: toNumberValue(record.unitPrice),
    productIdentifier: normalizeNullableDigits(record.productIdentifier),
    trackingCode: normalizeNullableDigits(record.trackingCode),
  };
}

function mapOrderType(value: unknown): OrderType {
  return value === "naja" ? "naja" : "normal";
}

function mapFulfillmentStatus(value: unknown): FulfillmentStatus {
  return value === "onHold" ? "onHold" : "normal";
}

function getFulfillmentStatusLabel(status: FulfillmentStatus): string {
  return status === "onHold" ? "خروج متوقف شده" : "مجاز به خروج";
}

function normalizeNullableDigits(value: unknown): string | null {
  const text = toNullableString(value);
  return text ? normalizeDigits(text) : null;
}

function normalizeNullablePhone(value: unknown): string | null {
  const text = toNullableString(value);
  return text ? normalizePhone(text) : null;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}
