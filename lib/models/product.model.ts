import type { ProductWarehouseInventory } from "@/lib/models/warehouse.model";

export type ProductStatus = "active" | "inactive";

export interface Product {
  objectId: string;
  id: string;
  sku: string;
  barcode: string | null;
  sepidarItemId: number | null;
  sepidarCode: string | null;
  name: string;
  brand: string;
  brandName?: string | null;
  saleGroupRef?: string | number | null;
  model: string | null;
  category: string;
  unit: string;
  unitPrice: number;
  priceNoteItemId: number | null;
  description: string | null;
  isSyncedFromSepidar: boolean;
  isActive: boolean | null;
  isSellable: boolean | null;
  status: ProductStatus;
  statusLabel: string;
  /**
   * @deprecated Product must not own inventory. Keep only for legacy pages.
   * Use ProductStockInventory for stock pages and availableSalesQuantity from
   * /api/products/order-options for order create/edit.
   */
  totalStock: number;
  /**
   * @deprecated Product must not own inventory. Use ProductStockInventory.
   */
  salesStock: number;
  /**
   * @deprecated Product must not own inventory. Use ProductStockInventory.
   */
  warehouseStock: number;
  /**
   * @deprecated Product must not own inventory. Use ProductStockInventory.
   */
  reservedStock: number;
  /**
   * @deprecated Product must not own inventory. Do not use in Sepidar order
   * forms. Use availableSalesQuantity from order-options instead.
   */
  availableStock: number;
  availableSalesQuantity: number;
  hasAvailableSalesQuantity: boolean;
  inventorySource?: "order_options" | "order_snapshot" | string;
  availableStocks: Array<{
    stockObjectId: string;
    sepidarStockId: number | null;
    stockTitle: string;
    realQuantity: number;
    salesQuantity: number;
    reservedQuantity: number;
    useFullRealQuantityForSales: boolean;
    availableSalesQuantity: number;
  }>;
  /**
   * @deprecated Product must not own inventory. Use ProductStockInventory.
   */
  warehouseAvailableStock: number;
  /**
   * @deprecated Separate NAJA inventory is removed. Use assignment stock
   * inventory via ProductStockInventory.
   */
  najaInventoryQty: number;
  /**
   * @deprecated Inventory should be read from ProductStockInventory endpoints.
   * Kept for legacy inventory summary displays only.
   */
  inventories: ProductWarehouseInventory[];
  createdAt: string;
  updatedAt: string;
}

export interface SepidarProductSyncSummary {
  total: number;
  processed: number;
  created: number;
  updated: number;
  rejected: number;
  failed: number;
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
