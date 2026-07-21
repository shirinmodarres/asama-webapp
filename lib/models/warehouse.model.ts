import type { Order } from "@/lib/models/order.model";

export type WarehouseUnitStatus =
  | "available"
  | "in_stock"
  | "reserved_for_order"
  | "dispatched"
  | "delivered"
  | "returned";

export type WarehouseType = "general" | "naja" | "other" | string;

export interface ProductWarehouseInventory {
  warehouseId: string;
  warehouseName: string;
  warehouseType: WarehouseType;
  stock: number;
  reservedStock: number;
  availableStock: number;
}

export interface WarehouseItemUnit {
  objectId: string;
  id: string;
  productObjectId: string;
  sepidarItemId: number | null;
  stockObjectId: string | null;
  sepidarStockId: number | null;
  stockTitle: string | null;
  productSku: string;
  productName: string;
  productBrand: string;
  productModel: string | null;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
  quantity: number;
  status: WarehouseUnitStatus | string;
  statusLabel: string;
  inboundReceiptId: string | null;
  exitSlipId: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseInboundReceipt {
  objectId: string;
  id: string;
  receiptCode: string;
  productObjectId: string;
  sepidarItemId: number | null;
  canEditProduct: boolean;
  productEditDisabledReason: string | null;
  stockObjectId: string | null;
  sepidarStockId: number | null;
  stockTitle: string | null;
  productSku: string;
  productName: string;
  quantity: number;
  createdByName: string | null;
  supplierName: string | null;
  receiptDate: string | null;
  notes: string | null;
  items: WarehouseInboundReceiptItemGroup[];
  units: WarehouseItemUnit[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseInboundReceiptItemUnit {
  productObjectId?: string;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
}

export interface WarehouseInboundReceiptItemGroup {
  productObjectId: string;
  sepidarItemId: number | null;
  productSku: string;
  productName: string;
  quantity: number;
  units: WarehouseInboundReceiptItemUnit[];
}

export interface WarehouseInventoryUnitRow {
  objectId: string;
  id: string;
  productObjectId: string | null;
  sepidarItemId: number | null;
  productSku: string;
  productName: string;
  stockObjectId: string | null;
  sepidarStockId: number | null;
  stockTitle: string;
  realQuantity: number;
  salesQuantity: number;
  salesCapacity?: number;
  reservedQuantity: number;
  availableForSale: number;
  availableSalesQuantity: number;
  units: WarehouseItemUnit[];
}

export interface WarehouseStockUnitSummary {
  objectId: string;
  id: string;
  sepidarStockId: number | null;
  code: string | null;
  title: string;
  isActive: boolean;
  totalProductCount: number;
  totalUnitCount: number;
  lastSepidarSyncAt: string | null;
}

export interface WarehouseStockProductUnit {
  objectId: string;
  id: string;
  trackingCode: string;
  serialNumber: string;
  productIdentifier: string;
  status: string;
  statusLabel: string;
  inboundReceiptId: string | null;
  inboundReceiptCode: string | null;
  createdAt: string | null;
}

export interface WarehouseStockProductGroup {
  productObjectId: string;
  sepidarItemId: number | null;
  sepidarCode: string;
  productName: string;
  inStockUnitCount: number;
  realQuantity: number;
  units: WarehouseStockProductUnit[];
}

export interface WarehouseStockUnitDetail {
  stock: {
    objectId: string;
    id: string;
    sepidarStockId: number | null;
    code: string | null;
    title: string;
  };
  groups: WarehouseStockProductGroup[];
}

export interface ExitSlipItemUnit {
  unitObjectId: string;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
  status: WarehouseUnitStatus | string;
}

export interface ExitSlipItemGroup {
  productObjectId: string;
  productSku: string;
  productName: string;
  productBrand: string;
  productModel: string | null;
  quantity: number;
  units: ExitSlipItemUnit[];
}

export interface ExitSlip {
  objectId: string;
  id: string;
  slipCode: string;
  orderId: string;
  orderCode: string;
  issuedByName: string;
  exitDate: string;
  deliveryToken: string | null;
  deliveryLink: string | null;
  pdfUrl: string | null;
  deliveryCode: string | null;
  deliveryConfirmed: boolean;
  deliveryConfirmedAt: string | null;
  deliveryConfirmedByPhone: string | null;
  customerName: string | null;
  sepidarCustomerCode: string | null;
  customerMobile: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  recipientFirstName: string | null;
  recipientLastName: string | null;
  recipientNationalId: string | null;
  recipientMobile: string | null;
  najaOrderNumber: string | null;
  receiverFullName: string | null;
  receiverPhone: string | null;
  deliveryFullAddress: string | null;
  deliveryProvince: string | null;
  deliveryCity: string | null;
  deliveryCounty: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  internalInvoiceObjectId: string | null;
  internalInvoiceNumber: string | null;
  order: Order | null;
  items: ExitSlipItemGroup[];
  units: WarehouseItemUnit[];
  createdAt: string;
  updatedAt: string;
}

export interface ExitSlipPdfData {
  companyName: string;
  slipCode: string;
  orderCode: string;
  issueDate: string | null;
  customer: {
    name: string | null;
    sepidarCustomerCode: string | null;
    mobile: string | null;
    phone: string | null;
    address: string | null;
    sepidarAddress?: {
      Address?: string | null;
      address?: string | null;
      ZipCode?: string | null;
      zipCode?: string | null;
    } | null;
  };
  recipient: {
    firstName: string | null;
    lastName: string | null;
    nationalId: string | null;
    mobile: string | null;
    najaOrderNumber: string | null;
  };
  receiver: {
    fullName: string | null;
    phone: string | null;
  };
  deliveryAddress: {
    province: string | null;
    city: string | null;
    county: string | null;
    fullAddress: string | null;
    formatted: string | null;
  };
  items: ExitSlipItemGroup[];
  units: WarehouseItemUnit[];
  deliveryCode: string | null;
  notes: string | null;
  order: Order | null;
}

export interface CreateInboundReceiptPayload {
  productObjectId?: string;
  stockObjectId?: string;
  units?: Array<{
    productObjectId?: string;
    productIdentifier: string;
    serialNumber: string;
    trackingCode: string;
  }>;
  items?: Array<{
    productObjectId: string;
    units: Array<{
      productObjectId?: string;
      productIdentifier: string;
      serialNumber: string;
      trackingCode: string;
    }>;
  }>;
  notes?: string;
  createdByName?: string;
}

export interface UpdateInboundReceiptPayload {
  productObjectId?: string;
  sepidarItemId?: number | null;
  supplierName?: string | null;
  receiptDate?: string | null;
  notes?: string | null;
  units: Array<{
    objectId?: string;
    productObjectId?: string;
    productIdentifier: string;
    serialNumber: string;
    trackingCode: string;
    quantity: number;
  }>;
}

export interface ValidateExitSlipScanPayload {
  scannedCode: string;
  currentScannedUnitIds: string[];
}

export interface CreateExitSlipPayload {
  issuedByName?: string;
  notes?: string;
  unitObjectIds: string[];
}

export interface ConfirmDeliveryPayload {
  phone: string;
  deliveryCode: string;
}
