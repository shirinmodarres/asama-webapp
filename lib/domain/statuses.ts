export type OrderStatusCode =
  | "pending_approval"
  | "needs_review"
  | "review_resolved"
  | "approved"
  | "cancelled"
  | "voided"
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
  pending_approval: "در انتظار تایید",
  needs_review: "نیازمند بررسی",
  review_resolved: "مشکل برطرف شد",
  approved: "تأیید شده",
  cancelled: "لغو شده",
  voided: "باطل شده",
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
  const normalizedStatus = normalizeOrderStatus(status);
  return ORDER_STATUS_LABELS[normalizedStatus as OrderStatusCode] ?? normalizedStatus;
}

export function normalizeOrderStatus(status: string | null | undefined): string {
  if (status === "pending" || status === "pending_approva") return "pending_approval";
  return status || "";
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
