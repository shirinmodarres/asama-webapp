import type { WarehouseItemUnit } from "@/lib/models/warehouse.model";

export type InternalInvoiceStatus =
  | "ready"
  | "pending_entry"
  | "entered"
  | string;

export interface InternalInvoiceItem {
  objectId: string;
  productObjectId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  units: WarehouseItemUnit[];
}

export interface InternalInvoice {
  objectId: string;
  id: string;
  invoiceNumber: string;
  orderObjectId: string;
  orderNumber: string;
  exitSlipObjectId: string;
  exitSlipNumber: string;
  customerName: string | null;
  stockTitle: string | null;
  saleTypeTitle: string | null;
  recipientFirstName: string | null;
  recipientLastName: string | null;
  recipientNationalId: string | null;
  recipientMobile: string | null;
  najaOrderNumber: string | null;
  grossAmount: number;
  discount: number;
  tax: number;
  duty: number;
  addition: number;
  netAmount: number;
  status: InternalInvoiceStatus;
  statusLabel: string;
  manualInvoiceNumber: string | null;
  accountantNote: string | null;
  enteredAt: string | null;
  pdfUrl: string | null;
  items: InternalInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MarkInternalInvoiceEnteredPayload {
  manualInvoiceNumber: string;
  accountantNote?: string;
}
