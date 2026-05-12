import { getProductStatusLabel } from "@/lib/domain/statuses";
import type { Product, ProductStatus } from "@/lib/models/product.model";
import {
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import { normalizeDigits } from "@/lib/utils/number-format";

export function mapProductDto(dto: unknown): Product {
  const record = toRecord(dto);
  const objectId = toStringValue(record.objectId);
  const id = normalizeDigits(toStringValue(record.id) || toStringValue(record.sku));
  const sku = normalizeDigits(toStringValue(record.sku) || toStringValue(record.id));
  const salesStock = toNumberValue(record.salesStock ?? record.totalStock);
  const warehouseStock = toNumberValue(record.warehouseStock);
  const reservedStock = toNumberValue(record.reservedStock);
  const availableStock =
    record.availableStock === undefined
      ? salesStock - reservedStock
      : toNumberValue(record.availableStock);
  const warehouseAvailableStock =
    record.warehouseAvailableStock === undefined
      ? warehouseStock
      : toNumberValue(record.warehouseAvailableStock);

  return {
    objectId,
    id,
    sku,
    name: toStringValue(record.name),
    brand: toStringValue(record.brand),
    model: toNullableString(record.model),
    category: toStringValue(record.category),
    unit: toStringValue(record.unit) || "عدد",
    unitPrice: toNumberValue(record.unitPrice),
    description: toNullableString(record.description),
    status: mapProductStatus(record.status),
    statusLabel:
      getProductStatusLabel(toStringValue(record.status)) ||
      toStringValue(record.statusLabel),
    totalStock: salesStock,
    salesStock,
    warehouseStock,
    reservedStock,
    availableStock,
    warehouseAvailableStock,
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
