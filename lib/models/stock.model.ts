export interface SepidarStock {
  objectId: string;
  id: string;
  sepidarStockId: number | null;
  code: string | null;
  title: string;
  isActive: boolean;
  isZagros: boolean;
  realInventoryCount: number;
  salesInventoryCount: number;
  reservedInventoryCount: number;
  availableSalesInventoryCount: number;
  lastSepidarSyncAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SepidarStockInventory {
  stock: SepidarStock;
  products: ProductStockInventory[];
}

export interface ProductStockInventory {
  objectId: string;
  id: string;
  productObjectId: string | null;
  sepidarItemId: number | null;
  productCode?: string | null;
  productTitle?: string | null;
  productSku: string;
  productName: string;
  brandObjectId?: string | null;
  brandName?: string | null;
  brandTitle?: string | null;
  stockObjectId: string | null;
  sepidarStockId: number | null;
  stockTitle: string;
  stock: SepidarStock | null;
  realQuantity: number;
  salesQuantity: number;
  salesCapacity: number;
  useFullRealQuantityForSales: boolean;
  reservedQuantity: number;
  unreservedQuantity?: number;
  availableForSale: number;
  availableSalesQuantity: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type StockTransferStatus =
  | "pending"
  | "pending_manager_approval"
  | "approved_waiting_warehouse_scan"
  | "approved_waiting_tracking_codes"
  | "completed"
  | "approved"
  | "rejected"
  | string;

export interface StockTransferItem {
  productObjectId: string;
  sepidarItemId: number | null;
  productName: string | null;
  productNameSnapshot: string | null;
  quantity: number;
  scannedUnitIds: string[];
  scannedUnitObjectIds: string[];
}

export interface StockTransferRequest {
  objectId: string;
  id: string;
  sourceStockObjectId: string | null;
  sourceSepidarStockId: number | null;
  sourceStockTitle: string | null;
  destinationStockObjectId: string | null;
  destinationSepidarStockId: number | null;
  destinationStockTitle: string | null;
  productObjectId: string | null;
  sepidarItemId: number | null;
  productName: string | null;
  quantity: number;
  items: StockTransferItem[];
  requestedByName: string | null;
  approvedByName: string | null;
  rejectedByName: string | null;
  status: StockTransferStatus;
  statusLabel: string;
  scannedUnitObjectIds: string[];
  movedUnitCount: number;
  transferSlipId: string | null;
  requestedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  note: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateStockTransferPayload {
  sourceStockObjectId: string;
  destinationStockObjectId: string;
  productObjectId?: string;
  quantity?: number;
  items?: Array<{
    productObjectId: string;
    sepidarItemId?: number | null;
    productNameSnapshot?: string;
    quantity: number;
  }>;
  note?: string;
  requestedByName?: string;
}

export interface UpdateProductStockInventoryPayload {
  salesQuantity?: number;
  useFullRealQuantityForSales?: boolean;
}

export interface BulkUpdateProductStockInventoryItem
  extends UpdateProductStockInventoryPayload {
  objectId: string;
}

export interface BulkUpdateProductStockInventoryFailure {
  objectId: string | null;
  code: string;
  message: string;
  status?: number;
}

export interface BulkUpdateProductStockInventoryResult {
  updated: ProductStockInventory[];
  failed: BulkUpdateProductStockInventoryFailure[];
  summary: {
    requested: number;
    updated: number;
    failed: number;
  };
}
