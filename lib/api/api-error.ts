export const FALLBACK_ERROR_MESSAGE = "خطایی رخ داد. لطفاً دوباره تلاش کنید.";

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "لطفاً دوباره وارد شوید.",
  INVALID_CREDENTIALS: "شماره موبایل یا رمز عبور اشتباه است.",
  DUPLICATE_PRODUCT_ID: "شناسه کالا تکراری است.",
  DUPLICATE_PHONE: "این شماره موبایل قبلاً ثبت شده است.",
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
