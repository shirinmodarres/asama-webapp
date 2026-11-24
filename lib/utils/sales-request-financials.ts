export const SALES_REQUEST_TAX_PERCENTAGE = 10;

export function calculateSalesRequestFinancials(
  subtotal: number,
  discountPercentage = 0,
) {
  const grossAmount = Math.max(0, Number(subtotal) || 0);
  const normalizedDiscountPercentage = Math.min(
    100,
    Math.max(0, Number(discountPercentage) || 0),
  );
  const discountAmount = grossAmount * (normalizedDiscountPercentage / 100);
  const amountAfterDiscount = Math.max(0, grossAmount - discountAmount);
  const taxAmount = amountAfterDiscount * (SALES_REQUEST_TAX_PERCENTAGE / 100);

  return {
    discountPercentage: normalizedDiscountPercentage,
    discountAmount,
    taxPercentage: SALES_REQUEST_TAX_PERCENTAGE,
    taxAmount,
    total: amountAfterDiscount + taxAmount,
  };
}
