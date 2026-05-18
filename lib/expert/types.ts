export type OrderStatus =
  | "pending"
  | "needs_review"
  | "review_resolved"
  | "approved"
  | "cancelled"
  | "voided"
  | "invoiced"
  | "returned"
  | "returnedAfterInvoice";
export type OrderSource = "normal" | "naja";

export type WarehouseStatus =
  | "reserved"
  | "reviewing"
  | "returned"
  | "processing"
  | "dispatchIssued"
  | "delivered"
  | "completed"
  | "awaitingNajaDetails"
  | "najaDetailsCompleted"
  | "returnedToInventory"
  | "returnedFromWarehouse";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  unitPrice: number;
  description?: string;
  status: "active" | "inactive";
  totalStock: number;
  salesStock?: number;
  warehouseStock?: number;
  reservedStock: number;
  availableStock?: number;
  warehouseAvailableStock?: number;
  najaInventoryQty: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface ExpertOrder {
  id: string;
  code: string;
  orderSource: OrderSource;
  createdBy: string;
  najaExpertName?: string;
  customerName: string;
  nationalId?: string;
  phoneNumber?: string;
  trackingCode?: string;
  productIdentifier?: string;
  returnReason?: string;
  returnedAt?: string;
  returnedBy?: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  warehouseStatus: WarehouseStatus;
  items: OrderItem[];
}

export interface CreateOrderInput {
  customerName: string;
  items: OrderItem[];
}

export interface CreateNajaOrderInput {
  productId: string;
  quantity: number;
  customerName: string;
  nationalId: string;
  phoneNumber: string;
  najaExpertName: string;
}

export interface UpdateOrderInput {
  id: string;
  customerName: string;
  items: OrderItem[];
}

export interface CompleteNajaWarehouseInput {
  orderId: string;
  productIdentifier: string;
  trackingCode: string;
  createdBy: string;
}

export interface ReturnNajaOrderInput {
  orderId: string;
  reason: string;
  createdBy: string;
}

export interface ExitSlip {
  id: string;
  slipNumber: string;
  orderId: string;
  createdBy: string;
  exitDate: string;
  notes: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface CreateExitSlipInput {
  orderId: string;
  slipNumber: string;
  exitDate: string;
  createdBy: string;
  notes: string;
}

export interface WarehouseHistoryEntry {
  id: string;
  orderId: string;
  status: WarehouseStatus;
  changedAt: string;
  changedBy: string;
  note: string;
}

export type InvoiceStatus = "issued";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  exitSlipId?: string;
  createdBy: string;
  issuedAt: string;
  status: InvoiceStatus;
  invoiceName?: string;
  items: OrderItem[];
  attachmentRecords?: InvoiceAttachmentRecord[];
}

export interface InvoiceAttachmentRecord {
  customerName: string;
  nationalId: string;
  phoneNumber: string;
  productName: string;
  productIdentifier: string;
  trackingCode: string;
}

export interface CreateInvoiceInput {
  orderId: string;
  createdBy: string;
}

export interface CreateProductInput {
  name: string;
  brand: string;
  category: string;
  unit: string;
  unitPrice: number;
  initialStock: number;
  description?: string;
}

export interface UpdateProductInput {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  unitPrice: number;
  description?: string;
  status: "active" | "inactive";
}

export interface InventoryHistoryEntry {
  id: string;
  productId: string;
  inventoryScope: "normal" | "naja";
  changeType: "increase" | "decrease";
  amount: number;
  note: string;
  createdAt: string;
  createdBy: string;
}

export interface UpdateInventoryInput {
  productId: string;
  inventoryScope?: "normal" | "naja";
  changeType: "increase" | "decrease";
  amount: number;
  note: string;
  createdBy: string;
}
