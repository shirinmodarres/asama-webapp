import { getProductStatusLabel } from "@/lib/domain/statuses";
import type { Product, ProductStatus } from "@/lib/models/product.model";
import {
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";

export function mapProductDto(dto: unknown): Product {
  const record = toRecord(dto);
  const objectId = toStringValue(record.objectId);
  const id = toStringValue(record.id) || toStringValue(record.sku);
  const sku = toStringValue(record.sku) || toStringValue(record.id);
  const totalStock = toNumberValue(record.totalStock);
  const reservedStock = toNumberValue(record.reservedStock);
  const availableStock =
    record.availableStock === undefined
      ? totalStock - reservedStock
      : toNumberValue(record.availableStock);

  return {
    objectId,
    id,
    sku,
    name: toStringValue(record.name),
    brand: toStringValue(record.brand),
    category: toStringValue(record.category),
    unit: toStringValue(record.unit) || "عدد",
    unitPrice: toNumberValue(record.unitPrice),
    description: toNullableString(record.description),
    status: mapProductStatus(record.status),
    statusLabel:
      getProductStatusLabel(toStringValue(record.status)) ||
      toStringValue(record.statusLabel),
    totalStock,
    reservedStock,
    availableStock,
    najaInventoryQty: toNumberValue(record.najaInventoryQty),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapProductListDto(dto: unknown): Product[] {
  return Array.isArray(dto) ? dto.map(mapProductDto) : [];
}

function mapProductStatus(value: unknown): ProductStatus {
  return value === "inactive" ? "inactive" : "active";
}
