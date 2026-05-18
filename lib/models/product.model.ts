import type { ProductWarehouseInventory } from "@/lib/models/warehouse.model";

export type ProductStatus = "active" | "inactive";

export interface Product {
  objectId: string;
  id: string;
  sku: string;
  name: string;
  brand: string;
  model: string | null;
  category: string;
  unit: string;
  unitPrice: number;
  description: string | null;
  status: ProductStatus;
  statusLabel: string;
  totalStock: number;
  salesStock: number;
  warehouseStock: number;
  reservedStock: number;
  availableStock: number;
  warehouseAvailableStock: number;
  najaInventoryQty: number;
  inventories: ProductWarehouseInventory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  unitPrice: number;
  description?: string;
  status: ProductStatus;
  totalStock: number;
  salesStock?: number;
}

export type UpdateProductPayload = Partial<
  Omit<CreateProductPayload, "id" | "totalStock">
>;

export interface UpdateProductStockPayload {
  inventoryScope?: "normal" | "naja";
  changeType?: "increase" | "decrease";
  amount?: number;
  totalStock?: number;
  salesStock?: number;
  notes?: string;
}
