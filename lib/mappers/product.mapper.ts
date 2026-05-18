import { getProductStatusLabel } from "@/lib/domain/statuses";
import type { Product, ProductStatus } from "@/lib/models/product.model";
import {
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import { normalizeDigits } from "@/lib/utils/number-format";
import { mapProductWarehouseInventoryListDto } from "@/lib/mappers/warehouse.mapper";

export function mapProductDto(dto: unknown): Product {
  const record = toRecord(dto);
  const objectId = toStringValue(record.objectId);
  const id = normalizeDigits(toStringValue(record.id) || toStringValue(record.sku));
  const sku = normalizeDigits(toStringValue(record.sku) || toStringValue(record.id));
  const inventories = mapProductWarehouseInventoryListDto(
    record.inventories ?? record.warehouseInventories ?? record.inventorySummary,
  );
  const generalInventories = inventories.filter((inventory) =>
    isGeneralWarehouseType(inventory.warehouseType),
  );
  const najaInventories = inventories.filter(
    (inventory) => inventory.warehouseType === "naja",
  );
  const inventorySalesStock = sumInventory(generalInventories, "stock");
  const inventoryReservedStock = sumInventory(generalInventories, "reservedStock");
  const inventoryAvailableStock = sumInventory(generalInventories, "availableStock");
  const inventoryWarehouseStock = sumInventory(inventories, "stock");
  const inventoryWarehouseAvailableStock = sumInventory(inventories, "availableStock");
  const inventoryNajaStock = sumInventory(najaInventories, "stock");

  const salesStock = inventories.length
    ? inventorySalesStock
    : toNumberValue(record.salesStock ?? record.totalStock);
  const warehouseStock = inventories.length
    ? inventoryWarehouseStock
    : toNumberValue(record.warehouseStock);
  const reservedStock = inventories.length
    ? inventoryReservedStock
    : toNumberValue(record.reservedStock);
  const availableStock =
    inventories.length
      ? inventoryAvailableStock
      : record.availableStock === undefined
      ? salesStock - reservedStock
      : toNumberValue(record.availableStock);
  const warehouseAvailableStock =
    inventories.length
      ? inventoryWarehouseAvailableStock
      : record.warehouseAvailableStock === undefined
      ? warehouseStock
      : toNumberValue(record.warehouseAvailableStock);
  const najaInventoryQty = inventories.length
    ? inventoryNajaStock
    : toNumberValue(record.najaInventoryQty);

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
    najaInventoryQty,
    inventories,
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

function isGeneralWarehouseType(type: string): boolean {
  return type === "general" || type === "normal" || !type;
}

function sumInventory(
  inventories: Array<{ stock: number; reservedStock: number; availableStock: number }>,
  field: "stock" | "reservedStock" | "availableStock",
): number {
  return inventories.reduce((sum, inventory) => sum + inventory[field], 0);
}
