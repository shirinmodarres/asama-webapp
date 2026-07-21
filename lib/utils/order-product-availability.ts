import type { Product } from "@/lib/models/product.model";

export function logOrderDropdownProductSource(product: Product): void {
  console.log("[ORDER_DROPDOWN_PRODUCT_SOURCE]", {
    productCode: product.sepidarCode || product.sku,
    productName: product.name,
    availableForSale: product.availableForSale,
    rawProduct: product,
  });
}

export function formatOrderAvailableQuantity(
  product: Product,
  formatter: (value: number) => string,
): string {
  return formatter(product.availableForSale ?? 0);
}
