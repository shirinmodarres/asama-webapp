import { httpClient } from "@/lib/api/http-client";
import { mapOrderDto, mapOrderListDto } from "@/lib/mappers/order.mapper";
import type {
  CreateOrderPayload,
  Order,
  OrderFilters,
  UpdatePendingOrderPayload,
} from "@/lib/models/order.model";
import { toNumber } from "@/lib/utils/number-format";

export async function listOrders(filters?: OrderFilters): Promise<Order[]> {
  const data = await httpClient.get<unknown>(buildOrdersPath(filters));
  return mapOrderListDto(data);
}

export async function getOrder(objectId: string): Promise<Order> {
  const data = await httpClient.get<unknown>(`/api/orders/${objectId}`);
  return mapOrderDto(data);
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const data = await httpClient.post<unknown>(
    "/api/orders",
    normalizeOrderPayload(payload),
  );
  return mapOrderDto(data);
}

export async function updatePendingOrder(
  objectId: string,
  payload: UpdatePendingOrderPayload,
): Promise<Order> {
  const data = await httpClient.patch<unknown>(
    `/api/orders/${objectId}`,
    normalizeOrderPayload(payload),
  );
  return mapOrderDto(data);
}

function normalizeOrderPayload(
  payload: UpdatePendingOrderPayload,
): Record<string, unknown> {
  return {
    ...payload,
    items: payload.items?.map((item) => ({
      ...item,
      quantity: toNumber(item.quantity),
    })),
  };
}

export async function approveOrder(objectId: string): Promise<Order> {
  const data = await httpClient.post<unknown>(`/api/orders/${objectId}/approve`);
  return mapOrderDto(data);
}

export async function cancelOrder(
  objectId: string,
  reason?: string,
): Promise<Order> {
  const data = await httpClient.post<unknown>(`/api/orders/${objectId}/cancel`, {
    reason,
  });
  return mapOrderDto(data);
}

function buildOrdersPath(filters?: OrderFilters): string {
  if (!filters) return "/api/orders";

  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.orderType) params.set("orderType", filters.orderType);

  const query = params.toString();
  return query ? `/api/orders?${query}` : "/api/orders";
}
