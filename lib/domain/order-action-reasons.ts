export interface OrderActionReason {
  code: string;
  label: string;
}

export const REVIEW_REASONS: OrderActionReason[] = [
  {
    code: "credit_limit_not_allowed",
    label: "سقف اعتباری مشتری مجاز نیست",
  },
  {
    code: "returned_check",
    label: "مشتری دارای چک برگشتی است",
  },
  {
    code: "unsettled_previous_invoices",
    label: "فاکتورهای قبلی مشتری تسویه نشده است",
  },
  {
    code: "check_not_registered",
    label: "چک مشتری در سامانه ثبت نشده است",
  },
  {
    code: "product_not_registered",
    label: "کالا در سامانه ثبت نشده است",
  },
];

export const CANCEL_REASONS = REVIEW_REASONS;

export const SHIPMENT_STOP_REASONS: OrderActionReason[] = [
  {
    code: "management_order",
    label: "توقف به دستور مدیریت",
  },
  {
    code: "customer_warehouse_no_space",
    label: "انبار مشتری ظرفیت دریافت کالا را ندارد",
  },
  {
    code: "customer_warehouse_closed",
    label: "انبار مشتری تعطیل است",
  },
  {
    code: "customer_request",
    label: "توقف به درخواست مشتری",
  },
];

export type FinancialCorrectionStage =
  | "sales_accountant"
  | "treasurer"
  | "systems_expert"
  | "sales_manager"
  | "systems_transfer";

export const FINANCIAL_CORRECTION_REASONS: Record<
  FinancialCorrectionStage,
  OrderActionReason[]
> = {
  sales_accountant: [
    { code: "PRICE_MISMATCH", label: "مغایرت قیمت" },
    { code: "DISCOUNT_MISMATCH", label: "مغایرت تخفیف" },
    { code: "PAYMENT_TERMS", label: "شرایط پرداخت" },
    { code: "CUSTOMER_FINANCIAL_INFO", label: "اطلاعات مالی مشتری" },
    { code: "OTHER", label: "سایر" },
  ],
  treasurer: [
    { code: "CUSTOMER_CREDIT", label: "مشکل اعتبار/مانده مشتری" },
    { code: "PAYMENT_TERMS", label: "مشکل شرایط پرداخت" },
    { code: "GUARANTEE_ISSUE", label: "مشکل چک/تضمین" },
    { code: "OTHER", label: "سایر" },
  ],
  systems_expert: [
    { code: "CUSTOMER_NOT_DEFINED", label: "مشتری در سامانه تعریف نشده" },
    { code: "CUSTOMER_INFO_MISMATCH", label: "مغایرت اطلاعات مشتری" },
    { code: "CUSTOMER_SYSTEM_INVALID", label: "سامانه مشتری غیرفعال/نامعتبر است" },
    { code: "OTHER", label: "سایر" },
  ],
  sales_manager: [
    { code: "PRICE_OR_DISCOUNT", label: "قیمت/تخفیف نیازمند اصلاح" },
    { code: "ITEMS_OR_QUANTITY", label: "تعداد/اقلام نیازمند اصلاح" },
    { code: "SALES_TERMS", label: "شرایط فروش نیازمند اصلاح" },
    { code: "OTHER", label: "سایر" },
  ],
  systems_transfer: [
    { code: "CUSTOMER_CAPACITY_FULL", label: "ظرفیت سامانه مشتری تکمیل است" },
    { code: "TRANSFER_NOT_POSSIBLE", label: "انتقال بار امکان‌پذیر نیست" },
    { code: "SYSTEM_INFO_MISMATCH", label: "مغایرت اطلاعات سامانه" },
    { code: "OTHER", label: "سایر" },
  ],
};

export function getFinancialCorrectionReasons(
  stage: string | null | undefined,
): OrderActionReason[] {
  return FINANCIAL_CORRECTION_REASONS[
    stage as FinancialCorrectionStage
  ] ?? [];
}

export function getFinancialCorrectionReasonLabel(
  stage: string | null | undefined,
  code: string | null | undefined,
): string {
  if (!code) return "";
  return getFinancialCorrectionReasons(stage).find(
    (reason) => reason.code === code,
  )?.label ?? "";
}

export function getCancelReasonLabel(code?: string | null): string {
  if (!code) return "";
  return CANCEL_REASONS.find((reason) => reason.code === code)?.label ?? "";
}

export function getReviewReasonLabel(code?: string | null): string {
  if (!code) return "";
  return REVIEW_REASONS.find((reason) => reason.code === code)?.label ?? "";
}

export function getShipmentStopReasonLabel(code?: string | null): string {
  if (!code) return "";
  return (
    SHIPMENT_STOP_REASONS.find((reason) => reason.code === code)?.label ?? ""
  );
}
