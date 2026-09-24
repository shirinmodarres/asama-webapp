import type { Product } from "@/lib/models/product.model";

export const RETURNED_PRODUCT_SALE_GROUP_REF = 2130;

export function isProductIdentifierRequired(
  product?: Pick<Product, "saleGroupRef"> | null,
): boolean {
  return Number(product?.saleGroupRef) !== RETURNED_PRODUCT_SALE_GROUP_REF;
}
