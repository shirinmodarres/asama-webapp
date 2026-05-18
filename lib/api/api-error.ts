export const FALLBACK_ERROR_MESSAGE = "خطایی رخ داد. لطفاً دوباره تلاش کنید.";

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "لطفاً دوباره وارد شوید.",
  INVALID_CREDENTIALS: "شماره موبایل یا رمز عبور اشتباه است.",
  DUPLICATE_PRODUCT_ID: "شناسه کالا تکراری است.",
  DUPLICATE_PHONE: "این شماره موبایل قبلاً ثبت شده است.",
  DUPLICATE_CUSTOMER_PHONE:
    "این شماره موبایل قبلاً ثبت شده است.",
  RECEIVER_INFO_REQUIRED: "اطلاعات گیرنده کامل نیست.",
  CUSTOMER_NOT_FOUND: "مشتری پیدا نشد.",
  ADDRESS_NOT_FOUND: "آدرس پیدا نشد.",
  ADDRESS_NOT_BELONG_TO_CUSTOMER: "آدرس متعلق به این مشتری نیست.",
  ORDER_ON_HOLD: "این سفارش فعلاً مجاز به خروج نیست.",
  ORDER_NOT_APPROVED: "سفارش هنوز تأیید نشده است.",
  WAREHOUSE_UNIT_NOT_FOUND: "کد اسکن‌شده در انبار پیدا نشد.",
  WAREHOUSE_UNIT_NOT_AVAILABLE: "این کالا برای خروج در دسترس نیست.",
  WAREHOUSE_UNIT_WAREHOUSE_MISMATCH:
    "کالای اسکن‌شده متعلق به انبار این سفارش نیست.",
  SCANNED_PRODUCT_NOT_IN_ORDER: "کالای اسکن‌شده در این سفارش وجود ندارد.",
  SCANNED_QUANTITY_EXCEEDED: "تعداد اسکن‌شده بیشتر از تعداد سفارش است.",
  EXIT_SLIP_QUANTITY_MISMATCH: "تعداد کالاهای اسکن‌شده با سفارش برابر نیست.",
  INVALID_DELIVERY_CODE: "کد تأیید دریافت اشتباه است.",
  DELIVERY_PHONE_MISMATCH: "شماره موبایل با اطلاعات سفارش تطابق ندارد.",
  DUPLICATE_WAREHOUSE_UNIT: "این کالا قبلاً ثبت شده است.",
  INSUFFICIENT_SALES_STOCK: "موجودی فروش کافی نیست.",
  INSUFFICIENT_WAREHOUSE_STOCK: "موجودی انبار کافی نیست.",
  WAREHOUSE_STOCK_NEGATIVE: "موجودی انبار نمی‌تواند منفی شود.",
  SALES_STOCK_BELOW_RESERVED:
    "موجودی فروش نمی‌تواند کمتر از موجودی رزروشده باشد.",
  REVIEW_REASON_REQUIRED: "لطفاً دلیل نیاز به بررسی را انتخاب کنید.",
  INVALID_REVIEW_REASON: "دلیل انتخاب‌شده معتبر نیست.",
  ORDER_CANNOT_NEED_REVIEW: "امکان ارسال این سفارش برای بررسی وجود ندارد.",
  ORDER_NOT_REVIEWABLE: "این سفارش در وضعیت بررسی نیست.",
  CANCEL_REASON_REQUIRED: "لطفاً دلیل لغو سفارش را انتخاب کنید.",
  INVALID_CANCEL_REASON: "دلیل لغو معتبر نیست.",
  ORDER_NOT_CANCELLABLE: "این سفارش قابل لغو نیست.",
  SHIPMENT_STOP_REASON_REQUIRED: "لطفاً دلیل توقف خروج را انتخاب کنید.",
  INVALID_SHIPMENT_STOP_REASON: "دلیل توقف خروج معتبر نیست.",
  ORDER_CANNOT_STOP_SHIPMENT: "امکان توقف خروج برای این سفارش وجود ندارد.",
  VALIDATION_ERROR: "اطلاعات وارد شده معتبر نیست.",
  PARSE_ERROR: "خطای ذخیره‌سازی رخ داد.",
  NETWORK_ERROR: "اتصال به سرور برقرار نشد.",
};

export class ApiError extends Error {
  code: string;
  status?: number;
  details?: unknown;

  constructor({
    code,
    message,
    status,
    details,
  }: {
    code: string;
    message: string;
    status?: number;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] ?? error.message ?? FALLBACK_ERROR_MESSAGE;
  }

  if (error instanceof TypeError) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
}
