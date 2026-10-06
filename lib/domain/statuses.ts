export type OrderStatusCode =
  | "pending_approval"
  | "pending_financial_approval"
  | "pending_manager_approval"
  | "needs_review"
  | "review_resolved"
  | "approved"
  | "cancelled"
  | "voided"
  | "invoiced"
  | "completed"
  | "returned"
  | "returnedAfterInvoice";

export type WarehouseStatusCode =
  | "reserved"
  | "awaitingSystemsTransfer"
  | "reviewing"
  | "dispatchIssued"
  | "completed"
  | "delivered"
  | "returnedToInventory"
  | "awaitingNajaDetails"
  | "najaDetailsCompleted"
  | "returnedFromWarehouse";

export type ProductStatusCode = "active" | "inactive";
export type InvoiceStatusCode = "issued" | "needs_follow_up";
export type FinancialApprovalStatusCode = "pending" | "approved" | "needs_correction";
export type FinancialApprovalStageCode =
  | "sales_accountant"
  | "treasurer"
  | "systems_expert"
  | "sales_manager"
  | "systems_transfer";

export const ORDER_STATUS_LABELS: Record<OrderStatusCode, string> = {
  pending_approval: "در انتظار تایید",
  pending_financial_approval: "در انتظار تأیید مالی",
  pending_manager_approval: "در انتظار تأیید مدیر",
  needs_review: "نیازمند بررسی",
  review_resolved: "مشکل برطرف شد",
  approved: "تأیید شده",
  cancelled: "لغو شده",
  voided: "باطل شده",
  invoiced: "فاکتور شده",
  completed: "تکمیل شده",
  returned: "برگشتی",
  returnedAfterInvoice: "برگشتی پس از فاکتور",
};

export const WAREHOUSE_STATUS_LABELS: Record<WarehouseStatusCode, string> = {
  reserved: "رزرو موجودی",
  awaitingSystemsTransfer: "در انتظار ثبت انتقال در سامانه مشتری",
  reviewing: "در بررسی انبار",
  dispatchIssued: "حواله خروج صادر شد",
  completed: "تکمیل شده",
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

export const FINANCIAL_APPROVAL_STATUS_LABELS: Record<FinancialApprovalStatusCode, string> = {
  pending: "در انتظار تأیید مالی",
  approved: "تأیید مالی شد",
  needs_correction: "نیازمند اصلاح مالی",
};

export const FINANCIAL_APPROVAL_STAGE_LABELS: Record<FinancialApprovalStageCode, string> = {
  sales_accountant: "حسابدار فروش",
  treasurer: "خزانه‌دار",
  systems_expert: "کارشناس سامانه‌ها (بررسی اولیه)",
  sales_manager: "مدیر فروش",
  systems_transfer: "کارشناس سامانه‌ها (انتقال بار)",
};

export function getOrderStatusLabel(status: string | null | undefined): string {
  if (!status) return "";
  const normalizedStatus = normalizeOrderStatus(status);
  return ORDER_STATUS_LABELS[normalizedStatus as OrderStatusCode] ?? normalizedStatus;
}

export function getDisplayOrderStatusLabel(
  status: string | null | undefined,
  warehouseStatus?: string | null,
): string {
  const normalizedStatus = normalizeOrderStatus(status);
  if (normalizedStatus === "approved" && warehouseStatus === "delivered") {
    return "تحویل شده";
  }
  return getOrderStatusLabel(normalizedStatus);
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

export function getFinancialApprovalStatusLabel(
  status: string | null | undefined,
): string {
  if (!status) return "";
  return (
    FINANCIAL_APPROVAL_STATUS_LABELS[status as FinancialApprovalStatusCode] ??
    status
  );
}

export function getFinancialApprovalStageLabel(
  stage: string | null | undefined,
): string {
  if (!stage) return "";
  return FINANCIAL_APPROVAL_STAGE_LABELS[stage as FinancialApprovalStageCode] ?? stage;
}
