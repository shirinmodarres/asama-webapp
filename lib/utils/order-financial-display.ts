const SALES_REQUEST_DISCOUNT_NOTE_PREFIX = "تخفیف درخواست فروش:";

/**
 * Sales requests keep their discount summary in the order note. Read that
 * persisted line without interpreting other, user-written note content.
 */
export function getSalesRequestDiscountNote(notes?: string | null): string | null {
  if (!notes) return null;

  const line = notes
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.startsWith(SALES_REQUEST_DISCOUNT_NOTE_PREFIX));

  if (!line) return null;

  const value = line.slice(SALES_REQUEST_DISCOUNT_NOTE_PREFIX.length).trim();
  return value || null;
}

export function getSalesRequestDiscountPercentage(
  notes?: string | null,
): number | null {
  const value = getSalesRequestDiscountNote(notes);
  if (!value) return null;

  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632));
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*[%٪](?:\s*\|.*)?$/);
  if (!match) return null;

  const percentage = Number(match[1]);
  return Number.isFinite(percentage) && percentage >= 0 && percentage <= 100
    ? percentage
    : null;
}

export function getOrderDisplayDiscountAmount({
  totalAmount,
  storedDiscountAmount,
  notes,
}: {
  totalAmount: number;
  storedDiscountAmount?: number | null;
  notes?: string | null;
}): number {
  const stored = Number(storedDiscountAmount || 0);
  if (stored > 0) return stored;

  const percentage = getSalesRequestDiscountPercentage(notes);
  return percentage === null ? 0 : Math.max(0, totalAmount) * (percentage / 100);
}
