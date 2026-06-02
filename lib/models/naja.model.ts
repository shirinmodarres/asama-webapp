export interface CreateNajaOrderPayload {
  createdByName?: string;
  expertUserId?: string;
  orderType?: "naja";
  customerObjectId: string;
  saleTypeObjectId?: string | null;
  sepidarSaleTypeId?: number | null;
  warehouseId?: string;
  productObjectId?: string;
  quantity?: number;
  items?: Array<{
    productObjectId: string;
    quantity: number;
    unitPrice?: number;
    priceNoteItemId?: number | null;
  }>;
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
