export type InvoiceType = "normal" | "naja";
export type InvoiceStatus = "issued" | "needs_follow_up";

export interface InvoiceLine {
  objectId: string;
  productId: string;
  productSku: string;
  productName: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface Invoice {
  objectId: string;
  id: string;
  invoiceCode: string;
  orderId: string;
  orderCode: string;
  invoiceType: InvoiceType;
  invoiceName: string;
  createdByName?: string;
  totalAmount: number;
  status: InvoiceStatus;
  statusLabel: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
}

export interface CreateInvoicePayload {
  invoiceName?: string;
  createdByName?: string;
  notes?: string;
}
