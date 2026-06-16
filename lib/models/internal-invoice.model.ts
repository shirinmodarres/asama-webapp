import type { WarehouseItemUnit } from "@/lib/models/warehouse.model";

export type InternalInvoiceStatus =
  | "ready_for_accounting"
  | "entered_manually"
  | "cancelled"
  | string;

export interface InternalInvoiceItem {
  objectId: string;
  rowNumber: number;
  productObjectId: string;
  productCode: string;
  sepidarCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  serialNumbers: string[];
  trackingCodes: string[];
  productIdentifiers: string[];
  units: WarehouseItemUnit[];
}

export interface InternalInvoice {
  objectId: string;
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  orderObjectId: string;
  orderNumber: string;
  exitSlipObjectId: string;
  exitSlipNumber: string;
  customerName: string | null;
  customerCode: string | null;
  sepidarCustomerCode: string | null;
  customerMobile: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
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
