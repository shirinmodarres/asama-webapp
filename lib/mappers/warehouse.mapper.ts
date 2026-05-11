import {
  toBooleanValue,
  toNullableString,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import type { ExitSlip } from "@/lib/models/warehouse.model";

export function mapExitSlipDto(dto: unknown): ExitSlip {
  const record = toRecord(dto);

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    slipCode: toStringValue(record.slipCode) || toStringValue(record.slipNumber),
    orderId: toStringValue(record.orderId),
    orderCode: toStringValue(record.orderCode),
    issuedByName: toStringValue(record.issuedByName),
    exitDate: toStringValue(record.exitDate),
    notes: toNullableString(record.notes),
    customerName: toNullableString(record.customerName),
    customerPhone: toNullableString(record.customerPhone),
    deliveryFullAddress: toNullableString(record.deliveryFullAddress),
    receiverFullName: toNullableString(
      record.receiverFullName ?? record.receiverName,
    ),
    receiverPhone: toNullableString(record.receiverPhone),
    deliveryConfirmed: toBooleanValue(record.deliveryConfirmed),
    deliveryConfirmedAt: toNullableString(record.deliveryConfirmedAt),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapExitSlipListDto(dto: unknown): ExitSlip[] {
  return Array.isArray(dto) ? dto.map(mapExitSlipDto) : [];
}
