import { httpClient } from "@/lib/api/http-client";
import { ApiError } from "@/lib/api/api-error";
import { getShipmentStopReasonLabel } from "@/lib/domain/order-action-reasons";
import { mapOrderDto, mapOrderListDto } from "@/lib/mappers/order.mapper";
import type {
  CancelOrderPayload,
  CreateOrderPayload,
  LockShipmentPayload,
  Order,
  OrderFilters,
  ReleaseShipmentPayload,
  StopShipmentPayload,
  UpdatePendingOrderPayload,
  UnlockShipmentPayload,
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

export async function lockShipment(
  objectId: string,
  payload: LockShipmentPayload,
): Promise<Order> {
  return stopShipment(objectId, payload);
}

export async function unlockShipment(
  objectId: string,
  payload: UnlockShipmentPayload,
): Promise<Order> {
  return releaseShipment(objectId, payload);
}

export async function stopShipment(
  objectId: string,
  payload: StopShipmentPayload,
): Promise<Order> {
  try {
    const data = await httpClient.post<unknown>(
      `/api/orders/${objectId}/stop-shipment`,
      payload,
    );
    return mapOrderDto(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const reasonLabel = getShipmentStopReasonLabel(payload.reasonCode);
      const data = await httpClient.post<unknown>(`/api/orders/${objectId}/hold`, {
        reasonCode: payload.reasonCode,
        reason: reasonLabel,
        stoppedByName: payload.stoppedByName,
        heldByName: payload.heldByName ?? payload.stoppedByName,
      });
      return mapOrderDto(data);
    }
    throw error;
  }
}

export async function releaseShipment(
  objectId: string,
  payload: ReleaseShipmentPayload,
): Promise<Order> {
  try {
    const data = await httpClient.post<unknown>(
      `/api/orders/${objectId}/release-shipment`,
      payload,
    );
    return mapOrderDto(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const data = await httpClient.post<unknown>(
        `/api/orders/${objectId}/unhold`,
        payload,
      );
      return mapOrderDto(data);
    }
    throw error;
  }
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
  payload: CancelOrderPayload,
): Promise<Order> {
  const data = await httpClient.post<unknown>(
    `/api/orders/${objectId}/cancel`,
    payload,
  );
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
