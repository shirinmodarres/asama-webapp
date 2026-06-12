import type { Product } from "@/lib/models/product.model";

export function logOrderDropdownProductSource(product: Product): void {
  const source = product as Product & { stockQuantity?: number };
  console.log("[ORDER_DROPDOWN_PRODUCT_SOURCE]", {
    productCode: product.sepidarCode || product.sku,
    productName: product.name,
    availableSalesQuantity: product.availableSalesQuantity,
    availableStock: product.availableStock,
    stockQuantity: source.stockQuantity,
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

  return formatter(product.availableSalesQuantity);
}
