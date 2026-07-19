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
  if (!product.hasAvailableSalesQuantity) {
    if (process.env.NODE_ENV === "development") {
      return "نامشخص";
    }
    return formatter(0);
  }

  return formatter(product.availableForSale);
}
