const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);

    const arabicIndex = ARABIC_DIGITS.indexOf(digit);
    return arabicIndex >= 0 ? String(arabicIndex) : digit;
  });
}

export function normalizePhone(value: string): string {
  return normalizeDigits(value).replace(/[\s\-–—]/g, "");
}

export function normalizeNumericString(value: string): string {
  return normalizeDigits(value).replace(/[,\u066C٬\s]/g, "");
}

export function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const parsed = Number(normalizeNumericString(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatFaNumber(
  value: string | number | null | undefined,
): string {
  return toNumber(value).toLocaleString("fa-IR");
}

export function formatFaDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return normalizeDigits(String(value)).replace(/[0-9]/g, (digit) =>
    PERSIAN_DIGITS[Number(digit)],
  );
}

export function formatFaCurrency(
  value: string | number | null | undefined,
): string {
  return `${formatFaNumber(value)} ریال`;
}
