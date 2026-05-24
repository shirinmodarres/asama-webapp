import {
  normalizeDigits,
  normalizePhone,
  toNumber,
} from "@/lib/utils/number-format";

export const REQUIRED_MESSAGE = "این فیلد الزامی است.";
export const SELECT_REQUIRED_MESSAGE = "لطفاً یک گزینه انتخاب کنید.";
export const PHONE_MESSAGE = "شماره موبایل معتبر نیست.";
export const NUMBER_MESSAGE = "عدد واردشده معتبر نیست.";
export const POSITIVE_NUMBER_MESSAGE = "تعداد باید بیشتر از صفر باشد.";
export const NON_NEGATIVE_NUMBER_MESSAGE = "عدد واردشده نمی‌تواند منفی باشد.";

export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function normalizeFormDigits(value: string): string {
  return normalizeDigits(value);
}

export function isValidPhone(value: string): boolean {
  const normalized = normalizePhone(value);
  return /^09\d{9}$/.test(normalized);
}

export function isValidNationalId(value: string): boolean {
  const normalized = normalizeDigits(value).trim();
  if (!normalized) return true;
  return /^\d{10}$/.test(normalized);
}

export function isPositiveNumber(value: string | number): boolean {
  const numberValue = typeof value === "number" ? value : toNumber(value);
  return Number.isFinite(numberValue) && numberValue > 0;
}

export function isNonNegativeNumber(value: string | number): boolean {
  const numberValue = typeof value === "number" ? value : toNumber(value);
  return Number.isFinite(numberValue) && numberValue >= 0;
}

export function getRequiredError(value: unknown): string {
  return isRequired(value) ? "" : REQUIRED_MESSAGE;
}
