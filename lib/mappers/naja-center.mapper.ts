import { getProductStatusLabel } from "@/lib/domain/statuses";
import {
  toArray,
  toNullableString,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import type {
  NajaCenter,
  NajaCenterStatus,
} from "@/lib/models/naja-center.model";

function mapStatus(value: unknown): NajaCenterStatus {
  return value === "inactive" ? "inactive" : "active";
}

function mapCenterRecord(record: Record<string, unknown>): NajaCenter {
  return {
    objectId:
      toStringValue(record.objectId) ||
      toStringValue(record.centerObjectId) ||
      toStringValue(record.najaCenterObjectId),
    id: toStringValue(record.id) || toStringValue(record.centerId),
    name: toStringValue(record.name) || toStringValue(record.centerName),
    responsibleName:
      toStringValue(record.responsibleName) ||
      toStringValue(record.centerResponsibleName) ||
      toStringValue(record.responsible),
    phone: toStringValue(record.phone) || toStringValue(record.phoneNumber),
    province: toStringValue(record.province),
    city: toStringValue(record.city),
    county: toStringValue(record.county),
    centerCode:
      toStringValue(record.centerCode) || toStringValue(record.code),
    fullAddress:
      toStringValue(record.fullAddress) ||
      toStringValue(record.address) ||
      toStringValue(record.centerAddress),
    status: mapStatus(record.status),
    statusLabel:
      toStringValue(record.statusLabel) ||
      getProductStatusLabel(toStringValue(record.status)),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapNajaCenterDto(dto: unknown): NajaCenter {
  return mapCenterRecord(toRecord(dto));
}

export function mapNajaCenterSummaryDto(
  dto: unknown,
  fallback?: Record<string, unknown>,
): NajaCenter | null {
  const dtoRecord = toRecord(dto);
  const merged = {
    ...(fallback ?? {}),
    ...dtoRecord,
  };

  const hasCenterData = Boolean(
    toNullableString(merged.objectId) ??
      toNullableString(merged.centerObjectId) ??
      toNullableString(merged.najaCenterObjectId) ??
      toNullableString(merged.name) ??
      toNullableString(merged.centerName) ??
      toNullableString(merged.centerCode) ??
      toNullableString(merged.code),
  );

  if (!hasCenterData) return null;
  return mapCenterRecord(merged);
}

export function mapNajaCenterListDto(dto: unknown): NajaCenter[] {
  if (Array.isArray(dto)) {
    return dto.map(mapNajaCenterDto);
  }

  const record = toRecord(dto);
  const candidates = [record.items, record.data, record.results];
  for (const candidate of candidates) {
    const values = toArray(candidate);
    if (values.length > 0) {
      return values.map(mapNajaCenterDto);
    }
  }

  return [];
}
