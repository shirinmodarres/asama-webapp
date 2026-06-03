import { mapAuthUserDto } from "@/lib/mappers/auth.mapper";
import { mapCustomerDto } from "@/lib/mappers/customer.mapper";
import { mapSepidarStockDto } from "@/lib/mappers/stock.mapper";
import {
  toArray,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import type {
  ExpertCustomerAssignment,
  SepidarSaleType,
  SepidarCustomerSyncSummary,
} from "@/lib/models/customer-assignment.model";
import { normalizePhone } from "@/lib/utils/number-format";

export function mapExpertCustomerAssignmentDto(
  dto: unknown,
): ExpertCustomerAssignment {
  const record = toRecord(dto);
  const expertRecord = toRecord(record.expert ?? record.user);
  const customerRecord = toRecord(record.customer);
  const saleTypeRecord = toRecord(record.saleType);
  const expert = Object.keys(expertRecord).length
    ? mapAuthUserDto(expertRecord)
    : null;
  const customer = Object.keys(customerRecord).length
    ? mapCustomerDto(customerRecord)
    : null;
  const saleType = Object.keys(saleTypeRecord).length
    ? mapSepidarSaleTypeDto(saleTypeRecord)
    : null;
  const status = record.status === "inactive" ? "inactive" : "active";

  return {
    objectId: toStringValue(record.objectId),
    expertObjectId: toStringValue(
      record.expertUserId ??
        record.expertObjectId ??
        record.expertId ??
        expert?.objectId,
    ),
    customerObjectId: toStringValue(
      record.customerObjectId ?? record.customerId ?? customer?.objectId,
    ),
    saleTypeObjectId: toStringValue(record.saleTypeObjectId ?? saleType?.objectId) || null,
    expert,
    customer,
    saleType,
    expertName: toStringValue(record.expertName) || expert?.fullName || "",
    customerName:
      toStringValue(record.customerName) || customer?.fullName || "",
    customerPhone: normalizePhone(
      toStringValue(record.customerPhone) || customer?.phone || "",
    ),
    sepidarCustomerCode:
      toStringValue(record.sepidarCustomerCode) ||
      customer?.sepidarCustomerCode ||
      null,
    saleTypeTitle:
      toStringValue(record.saleTypeTitle) || saleType?.title || null,
    sepidarSaleTypeId:
      record.sepidarSaleTypeId === undefined || record.sepidarSaleTypeId === null
        ? saleType?.sepidarSaleTypeId ?? null
        : toNumberValue(record.sepidarSaleTypeId),
    allowedStockObjectIds: toArray(record.allowedStockObjectIds)
      .map(toStringValue)
      .filter(Boolean),
    allowedSepidarStockIds: toArray(record.allowedSepidarStockIds)
      .map(toNumberValue)
      .filter((value) => Number.isFinite(value)),
    allowedStocks: toArray(record.allowedStocks).map(mapSepidarStockDto),
    assignedAt: toStringValue(record.assignedAt ?? record.createdAt),
    status,
    statusLabel:
      toStringValue(record.statusLabel) ||
      (status === "active" ? "فعال" : "غیرفعال"),
  };
}

export function mapSepidarSaleTypeDto(dto: unknown): SepidarSaleType {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    sepidarSaleTypeId:
      record.sepidarSaleTypeId === undefined || record.sepidarSaleTypeId === null
        ? null
        : toNumberValue(record.sepidarSaleTypeId),
    title: toStringValue(record.title),
    market: toStringValue(record.market) || null,
    isAvailable: record.isAvailable !== false,
    lastSepidarSyncAt: toStringValue(record.lastSepidarSyncAt) || null,
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapSepidarSaleTypeListDto(dto: unknown): SepidarSaleType[] {
  const record = toRecord(dto);
  const source = Array.isArray(dto)
    ? dto
    : Array.isArray(record.items)
      ? record.items
      : Array.isArray(record.saleTypes)
        ? record.saleTypes
        : [];
  return source.map(mapSepidarSaleTypeDto);
}

export function mapExpertCustomerAssignmentListDto(
  dto: unknown,
): ExpertCustomerAssignment[] {
  const record = toRecord(dto);
  const source = Array.isArray(dto)
    ? dto
    : Array.isArray(record.items)
      ? record.items
      : Array.isArray(record.assignments)
        ? record.assignments
        : [];
  return source.map(mapExpertCustomerAssignmentDto);
}

export function mapSepidarCustomerSyncSummaryDto(
  dto: unknown,
): SepidarCustomerSyncSummary {
  const response = toRecord(dto);
  const record = toRecord(response.summary ?? response);
  return {
    total: toNumberValue(
      record.total ?? record.totalCount ?? record.totalFromSepidar,
    ),
    processed: toNumberValue(record.processed ?? record.processedCount),
    created: toNumberValue(record.created ?? record.createdCount),
    updated: toNumberValue(record.updated ?? record.updatedCount),
    rejected: toNumberValue(
      record.rejected ?? record.rejectedCount ?? record.skippedCount,
    ),
    failed: toNumberValue(record.failed ?? record.failedCount ?? record.errorCount),
  };
}
