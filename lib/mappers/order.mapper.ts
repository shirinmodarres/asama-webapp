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

export function mapOrderDto(dto: unknown): Order {
  const record = toRecord(dto);

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    code: toStringValue(record.code),
    orderType: mapOrderType(record.orderType),
    createdByName: toStringValue(record.createdByName),
    customerName: toNullableString(record.customerName),
    customerNationalId: toNullableString(
      record.customerNationalId ?? record.nationalId,
    ),
    customerPhone: toNullableString(
      record.customerPhone ?? record.phoneNumber,
    ),
    orderStatus: toStringValue(record.orderStatus) || "pending",
    orderStatusLabel:
      toStringValue(record.orderStatusLabel) ||
      getOrderStatusLabel(toStringValue(record.orderStatus) || "pending"),
    warehouseStatus: toStringValue(record.warehouseStatus),
    warehouseStatusLabel:
      toStringValue(record.warehouseStatusLabel) ||
      getWarehouseStatusLabel(toStringValue(record.warehouseStatus)),
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
    productIdentifier: toNullableString(record.productIdentifier),
    trackingCode: toNullableString(record.trackingCode),
  };
}

function mapOrderType(value: unknown): OrderType {
  return value === "naja" ? "naja" : "normal";
}
