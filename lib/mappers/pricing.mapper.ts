import {
  toArray,
  toBooleanValue,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import type {
  ExpertPriceListAssignment,
  PricingBrand,
  PriceList,
  PriceListItem,
  PricingReference,
  SepidarPriceList,
} from "@/lib/models/pricing.model";

export function mapPricingBrandDto(dto: unknown): PricingBrand {
  const record = toRecord(dto);
  return {
    brandName: toStringValue(record.brandName),
    source: toStringValue(record.source) || "Product",
    productCount: toNumberValue(record.productCount),
  };
}

export function mapSepidarPriceListDto(dto: unknown): SepidarPriceList {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId || record.id),
    id: toStringValue(record.id || record.objectId),
    brandName: toNullableString(record.brandName),
    title: toStringValue(record.title || record.saleTypeTitle),
    saleTypeTitle: toStringValue(record.saleTypeTitle || record.title),
    code: toNullableString(record.code || record.saleTypeCode),
    saleTypeCode: toNullableString(record.saleTypeCode || record.code),
    sepidarSaleTypeId:
      record.sepidarSaleTypeId === undefined || record.sepidarSaleTypeId === null
        ? null
        : toNumberValue(record.sepidarSaleTypeId),
    itemCount: toNumberValue(record.itemCount),
    lastSyncedAt: toNullableString(record.lastSyncedAt),
    status: toStringValue(record.status) || "active",
    isAvailable: record.isAvailable !== false,
  };
}

export function mapPricingReferenceDto(dto: unknown): PricingReference {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId || record.id),
    id: toStringValue(record.id || record.objectId),
    brandName: toNullableString(record.brandName),
    sepidarSaleTypeId:
      record.sepidarSaleTypeId === undefined || record.sepidarSaleTypeId === null
        ? null
        : toNumberValue(record.sepidarSaleTypeId),
    sourceSaleTypeObjectId: toNullableString(record.sourceSaleTypeObjectId),
    internalCode: toNullableString(record.internalCode),
    displayName: toNullableString(record.displayName),
    notes: toNullableString(record.notes),
    isActive: toBooleanValue(record.isActive),
    archivedAt: toNullableString(record.archivedAt),
    createdBy: toNullableString(record.createdBy),
    createdAt: toNullableString(record.createdAt),
  };
}

export function mapPriceListDto(dto: unknown): PriceList {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId || record.id),
    id: toStringValue(record.id || record.objectId),
    brandName: toNullableString(record.brandName),
    name: toStringValue(record.name || record.title),
    title: toStringValue(record.title || record.name),
    code: toNullableString(record.code),
    internalCode: toNullableString(record.internalCode || record.code),
    displayName: toStringValue(record.displayName || record.name || record.title),
    referenceInternalCode: toNullableString(record.referenceInternalCode),
    typeCode: toNullableString(record.typeCode),
    typeTitle: toNullableString(record.typeTitle),
    sourceReferenceId: toNullableString(record.sourceReferenceId),
    sourceSepidarSaleTypeId:
      record.sourceSepidarSaleTypeId === undefined || record.sourceSepidarSaleTypeId === null
        ? null
        : toNumberValue(record.sourceSepidarSaleTypeId),
    formulaMultiplier: toNumberValue(record.formulaMultiplier),
    formulaDescription: toNullableString(record.formulaDescription),
    isActive: record.isActive !== false,
    generatedAt: toNullableString(record.generatedAt),
    itemCount: toNumberValue(record.itemCount),
  };
}

export function mapPriceListItemDto(dto: unknown): PriceListItem {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId || record.id),
    id: toStringValue(record.id || record.objectId),
    priceListId: toNullableString(record.priceListId),
    productObjectId: toNullableString(record.productObjectId),
    sepidarItemId:
      record.sepidarItemId === undefined || record.sepidarItemId === null
        ? null
        : toNumberValue(record.sepidarItemId),
    productCode: toNullableString(record.productCode || record.sepidarCode),
    productName: toStringValue(record.productName || record.title),
    brandName: toNullableString(record.brandName),
    sourcePrice:
      record.sourcePrice === undefined || record.sourcePrice === null
        ? null
        : toNumberValue(record.sourcePrice),
    finalPrice:
      record.finalPrice === undefined || record.finalPrice === null
        ? null
        : toNumberValue(record.finalPrice),
    formulaMultiplier:
      record.formulaMultiplier === undefined || record.formulaMultiplier === null
        ? null
        : toNumberValue(record.formulaMultiplier),
    sourcePriceNoteItemId:
      record.sourcePriceNoteItemId === undefined || record.sourcePriceNoteItemId === null
        ? null
        : toNumberValue(record.sourcePriceNoteItemId),
  };
}

export function mapExpertPriceListAssignmentDto(dto: unknown): ExpertPriceListAssignment {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId || record.id),
    id: toStringValue(record.id || record.objectId),
    expertUserId: toNullableString(record.expertUserId),
    expertName: toNullableString(record.expertName),
    priceListIds: toArray(record.priceListIds).map(toStringValue).filter(Boolean),
    priceLists: toArray(record.priceLists).map(mapPriceListDto),
    isActive: record.isActive !== false,
    assignedBy: toNullableString(record.assignedBy),
    assignedAt: toNullableString(record.assignedAt),
  };
}

export function mapList<T>(dto: unknown, mapper: (value: unknown) => T): T[] {
  const record = toRecord(dto);
  const source = Array.isArray(dto)
    ? dto
    : Array.isArray(record.items)
      ? record.items
      : Array.isArray(record.rows)
        ? record.rows
        : Array.isArray(record.data)
          ? record.data
          : [];
  return source.map(mapper);
}
