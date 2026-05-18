import type { ExpertOrder, OrderItem, Product } from "@/lib/expert/types";
import {
  formatFaCurrency,
  formatFaNumber,
} from "@/lib/utils/number-format";

const textCollator = (() => {
  try {
    return new Intl.Collator("fa", { sensitivity: "base", numeric: true });
  } catch {
    try {
      return new Intl.Collator(undefined, {
        sensitivity: "base",
        numeric: true,
      });
    } catch {
      return null;
    }
  }
})();

export function formatNumber(value?: number | string | null): string {
  return formatFaNumber(value);
}

export function formatCurrency(value?: number | string | null): string {
  return formatFaCurrency(value);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fa-IR");
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isOrderEditable(order: ExpertOrder): boolean {
  return order.status === "pending" || order.status === "needs_review";
}

export function getAvailableStock(product: Product): number {
  return Math.max(
    product.availableStock ??
      (product.salesStock ?? product.totalStock) - product.reservedStock,
    0,
  );
}

export function getNajaAvailableStock(product: Product): number {
  return Math.max(product.najaInventoryQty, 0);
}

export function getOrderItemCount(items: OrderItem[]): number {
  return items.length;
}

export function getOrderTotalQuantity(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getOrderLineTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function getOrderTotalAmount(
  items: OrderItem[],
  productsById: Record<string, Product | undefined>,
): number {
  return items.reduce((sum, item) => {
    const product = productsById[item.productId];
    return sum + getOrderLineTotal(item.quantity, product?.unitPrice ?? 0);
  }, 0);
}

export function mergeOrderItems(items: OrderItem[]): OrderItem[] {
  const map = new Map<string, number>();

  for (const item of items) {
    map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
  }

  return Array.from(map.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export function compareText(a: string, b: string): number {
  if (textCollator) return textCollator.compare(a, b);

  try {
    return a.localeCompare(b);
  } catch {
    if (a === b) return 0;
    return a > b ? 1 : -1;
  }
}
