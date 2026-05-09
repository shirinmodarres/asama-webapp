export type OrderStatusCode =
  | "pending"
  | "approved"
  | "cancelled"
  | "invoiced"
  | "returned"
  | "returnedAfterInvoice";

export type WarehouseStatusCode =
  | "reserved"
  | "reviewing"
  | "dispatchIssued"
  | "delivered"
  | "returnedToInventory"
  | "awaitingNajaDetails"
  | "najaDetailsCompleted"
  | "returnedFromWarehouse";

export type ProductStatusCode = "active" | "inactive";
export type InvoiceStatusCode = "issued" | "needs_follow_up";

export const ORDER_STATUS_LABELS: Record<OrderStatusCode, string> = {
  pending: "در انتظار تأیید",
  approved: "تأیید شده",
  cancelled: "لغو شده",
  invoiced: "فاکتور شده",
  returned: "برگشتی",
  returnedAfterInvoice: "برگشتی پس از فاکتور",
};

export const WAREHOUSE_STATUS_LABELS: Record<WarehouseStatusCode, string> = {
  reserved: "رزرو موجودی",
  reviewing: "در بررسی انبار",
  dispatchIssued: "حواله خروج صادر شد",
  delivered: "تأیید تحویل به مشتری",
  returnedToInventory: "بازگشت به موجودی",
  awaitingNajaDetails: "در انتظار تکمیل اطلاعات انبار ناجا",
  najaDetailsCompleted: "اطلاعات انبار ناجا تکمیل شد",
  returnedFromWarehouse: "برگشتی از انبار",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatusCode, string> = {
  active: "فعال",
  inactive: "غیرفعال",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatusCode, string> = {
  issued: "صادر شده",
  needs_follow_up: "نیازمند پیگیری مالی",
};

export function getOrderStatusLabel(status: string | null | undefined): string {
  if (!status) return "";
  return ORDER_STATUS_LABELS[status as OrderStatusCode] ?? status;
}

export function getWarehouseStatusLabel(
  status: string | null | undefined,
): string {
  if (!status) return "";
  return WAREHOUSE_STATUS_LABELS[status as WarehouseStatusCode] ?? status;
}

export function getProductStatusLabel(
  status: string | null | undefined,
): string {
  if (!status) return "";
  return PRODUCT_STATUS_LABELS[status as ProductStatusCode] ?? status;
}

export function getInvoiceStatusLabel(
  status: string | null | undefined,
): string {
  if (!status) return "";
  return INVOICE_STATUS_LABELS[status as InvoiceStatusCode] ?? status;
}
