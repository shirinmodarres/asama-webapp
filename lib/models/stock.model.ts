export interface SepidarStock {
  objectId: string;
  id: string;
  sepidarStockId: number | null;
  code: string | null;
  title: string;
  isActive: boolean;
  isZagros: boolean;
  lastSepidarSyncAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductStockInventory {
  objectId: string;
  id: string;
  productObjectId: string | null;
  sepidarItemId: number | null;
  productSku: string;
  productName: string;
  stockObjectId: string | null;
  sepidarStockId: number | null;
  stockTitle: string;
  stock: SepidarStock | null;
  realQuantity: number;
  salesQuantity: number;
  useFullRealQuantityForSales: boolean;
  reservedQuantity: number;
  availableSalesQuantity: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type StockTransferStatus = "pending" | "approved" | "rejected" | string;

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
  requestedByName: string | null;
  approvedByName: string | null;
  rejectedByName: string | null;
  status: StockTransferStatus;
  statusLabel: string;
  requestedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  note: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateStockTransferPayload {
  productObjectId: string;
  destinationStockObjectId: string;
  quantity: number;
  note?: string;
  requestedByName?: string;
}

export interface UpdateProductStockInventoryPayload {
  salesQuantity?: number;
  useFullRealQuantityForSales?: boolean;
}
