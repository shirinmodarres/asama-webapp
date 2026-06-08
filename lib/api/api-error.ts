export const FALLBACK_ERROR_MESSAGE = "خطایی رخ داد. لطفاً دوباره تلاش کنید.";

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "لطفاً دوباره وارد شوید.",
  INVALID_CREDENTIALS: "شماره موبایل یا رمز عبور اشتباه است.",
  DUPLICATE_PRODUCT_ID: "شناسه کالا تکراری است.",
  PRODUCT_MASTER_DATA_READ_ONLY:
    "اطلاعات اصلی کالا از سپیدار خوانده می‌شود و قابل ویرایش نیست.",
  PRODUCT_CREATION_DISABLED: "تعریف کالا فقط از طریق سپیدار انجام می‌شود.",
  CUSTOMER_NOT_ASSIGNED_TO_EXPERT: "این مشتری به شما اختصاص داده نشده است.",
  ASSIGNMENT_NOT_FOUND: "برای این مشتری تنظیمات فروش تعریف نشده است.",
  CUSTOMER_ALREADY_ASSIGNED:
    "این مشتری قبلاً به یک کارشناس اختصاص داده شده است.",
  CUSTOMER_MUST_BE_FROM_SEPIDAR: "مشتری باید از سپیدار خوانده شده باشد.",
  PRODUCT_MUST_BE_FROM_SEPIDAR: "کالا باید از سپیدار خوانده شده باشد.",
  SEPIDAR_PRODUCT_REQUIRED: "کالا باید از سپیدار خوانده شده باشد.",
  PRODUCT_NOT_SELLABLE: "کالا قابل فروش نیست.",
  PRODUCT_PRICE_MISSING: "قیمت کالا برای این نوع فروش ثبت نشده است.",
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
  DUPLICATE_SERIAL_NUMBER: "سریال کالا قبلاً ثبت شده است.",
  DUPLICATE_TRACKING_CODE: "کد رهگیری قبلاً ثبت شده است.",
  INSUFFICIENT_SALES_STOCK: "موجودی فروش کافی نیست.",
  INSUFFICIENT_WAREHOUSE_STOCK: "موجودی انبار کافی نیست.",
  WAREHOUSE_STOCK_NEGATIVE: "موجودی انبار نمی‌تواند منفی شود.",
  SALES_STOCK_BELOW_RESERVED:
    "موجودی فروش نمی‌تواند کمتر از موجودی رزروشده باشد.",
  ZAGROS_STOCK_NOT_CONFIGURED: "انبار زاگرس در تنظیمات موجودی پیدا نشد.",
  INBOUND_ONLY_ZAGROS_ALLOWED: "ورود و انتقال کالا فقط از انبار زاگرس انجام می‌شود.",
  STOCK_TRANSFER_INSUFFICIENT_QUANTITY:
    "موجودی انبار زاگرس برای این انتقال کافی نیست.",
  INVALID_TRANSFER_STATE: "وضعیت این درخواست انتقال قابل تغییر نیست.",
  INVENTORY_NOT_FOUND: "موجودی کالا و انبار پیدا نشد.",
  WAREHOUSE_REQUIRED: "انبار خروج برای این سفارش مشخص نشده است.",
  ORDER_WAREHOUSE_REQUIRED: "برای این سفارش انبار خروج مشخص نشده است.",
  WAREHOUSE_SELECTION_REQUIRED:
    "چند انبار مجاز موجودی کافی دارند؛ لطفاً انبار خروج را انتخاب کنید.",
  ORDER_STOCK_NOT_AVAILABLE:
    "موجودی فروش در انبارهای مجاز این کارشناس کافی نیست.",
  OUTBOUND_STOCK_MISMATCH:
    "این کالا متعلق به انبار خروج این سفارش نیست.",
  WAREHOUSE_UNIT_ALREADY_DISPATCHED:
    "این کالا قبلاً از انبار خارج شده است.",
  INVENTORY_REAL_QUANTITY_INSUFFICIENT:
    "موجودی واقعی انبار کافی نیست.",
  INTERNAL_INVOICE_CREATE_FAILED:
    "حواله خروج صادر شد اما فاکتور داخلی ایجاد نشد.",
  ASSIGNMENT_STOCK_REQUIRED:
    "برای این کارشناس در این مسیر فروش انبار مجاز تعریف نشده است.",
  RECIPIENT_FIRST_NAME_REQUIRED: "نام الزامی است.",
  RECIPIENT_LAST_NAME_REQUIRED: "نام خانوادگی الزامی است.",
  RECIPIENT_NATIONAL_ID_REQUIRED: "کد ملی الزامی است.",
  RECIPIENT_MOBILE_REQUIRED: "شماره موبایل الزامی است.",
  NAJA_ORDER_NUMBER_REQUIRED: "شماره سفارش الزامی است.",
  SEPIDAR_SETTINGS_ENV_ONLY:
    "تنظیمات سپیدار فعلاً از فایل محیطی خوانده می‌شود.",
  SEPIDAR_DNS_FAILED:
    "دامنه سپیدار پیدا نشد. تنظیم DNS یا آدرس Base URL را بررسی کنید.",
  SEPIDAR_TIMEOUT: "اتصال به سپیدار بیش از حد طول کشید.",
  SEPIDAR_UNAUTHORIZED: "ورود یا توکن سپیدار معتبر نیست.",
  SEPIDAR_QUOTATION_CREATE_FAILED:
    "ثبت پیش‌فاکتور سپیدار ناموفق بود؛ سفارش تأیید نشد.",
  SEPIDAR_QUOTATION_BAD_RESPONSE:
    "پاسخ سپیدار برای پیش‌فاکتور معتبر نبود.",
  SEPIDAR_BAD_RESPONSE: "سپیدار درخواست را نپذیرفت.",
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
