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
