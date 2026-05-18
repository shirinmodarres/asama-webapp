export interface CreateNajaOrderPayload {
  createdByName: string;
  customerName: string;
  customerNationalId: string;
  customerPhone: string;
  centerObjectId: string;
  warehouseId?: string;
  productObjectId: string;
  quantity: number;
  notes?: string;
}

export interface CompleteNajaWarehouseInfoPayload {
  productIdentifier: string;
  trackingCode: string;
  completedByName?: string;
  notes?: string;
}

export interface CreateNajaInvoicePayload {
  invoiceName?: string;
  createdByName?: string;
  notes?: string;
}
