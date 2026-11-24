import type { Order } from "@/lib/models/order.model";

export function showOrderFulfillment(
  order: Pick<Order, "orderStatus" | "warehouseStatus" | "approvedBy" | "exitSlipObjectId">,
): boolean;
