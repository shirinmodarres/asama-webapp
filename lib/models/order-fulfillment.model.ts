export interface FulfillmentProduct {
  key: string;
  productName: string | null;
  productSku: string | null;
  orderedQuantity: number;
  fulfilledQuantity: number;
  dispatchedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
}

export interface FulfillmentInvoice {
  id: string;
  source: "Invoice" | "InternalInvoice" | "ModCenterInvoice" | "Sepidar";
  number: string | number | null;
  sepidarNumber?: string | number | null;
  date: string | null;
  statusLabel: string | null;
  amount: number | null;
}

export interface OrderFulfillment {
  orderTotal: number | null;
  invoicedTotal: number | null;
  remainingUninvoicedAmount: number | null;
  fulfillmentPercentage: number;
  remainingQuantity: number;
  orderClosed: boolean;
  orderStatusLabel: string | null;
  products: FulfillmentProduct[];
  invoices: FulfillmentInvoice[];
}
