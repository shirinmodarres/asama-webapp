export interface CreateNajaOrderPayload {
  createdByName?: string;
  expertUserId?: string;
  orderType?: "naja";
  customerObjectId: string;
  saleTypeObjectId?: string | null;
  sepidarSaleTypeId?: number | null;
  priceListId?: string | null;
  recipientFirstName: string;
  recipientLastName: string;
  recipientNationalId: string;
  recipientMobile?: string | null;
  najaOrderNumber: string;
  najaPurchaseDate?: string | null;
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

export interface NajaRialReportFilters {
  dateFrom?: string;
  dateTo?: string;
  customerObjectId?: string;
  orderStatus?: string;
  saleTypeObjectId?: string;
  sepidarSaleTypeId?: number;
  stockObjectId?: string;
}

export interface NajaRialReportRow {
  id: string;
  orderObjectId: string;
  orderCode: string;
  createdAt: string | null;
  najaPurchaseDate: string | null;
  customerObjectId: string | null;
  customerName: string | null;
  sepidarCustomerCode: string | null;
  expertUserId: string | null;
  expertName: string | null;
  recipientFirstName: string | null;
  recipientLastName: string | null;
  recipientFullName: string | null;
  recipientNationalId: string | null;
  recipientMobile: string | null;
  najaOrderNumber: string | null;
  productObjectId: string | null;
  productSku: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  orderTotal: number;
  orderStatus: string;
  orderStatusLabel: string;
  stockObjectId: string | null;
  sepidarStockId: number | null;
  stockTitle: string | null;
  saleTypeObjectId: string | null;
  sepidarSaleTypeId: number | null;
  saleTypeTitle: string | null;
}

export interface NajaRialReportTotals {
  totalOrders: number;
  totalQuantity: number;
  totalRialAmount: number;
}

export interface NajaRialReport {
  rows: NajaRialReportRow[];
  totals: NajaRialReportTotals;
}
