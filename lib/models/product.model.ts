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
  totalStock: number;
  salesStock: number;
  warehouseStock: number;
  reservedStock: number;
  availableStock: number;
  availableSalesQuantity: number;
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
  warehouseAvailableStock: number;
  najaInventoryQty: number;
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
