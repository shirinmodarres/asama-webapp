import type { NajaCenter } from "@/lib/models/naja-center.model";
import type { Customer, CustomerAddress } from "@/lib/models/customer.model";

export type OrderType = "normal" | "naja";
export type FulfillmentStatus = "normal" | "onHold";

export interface OrderItem {
  objectId: string;
  productId: string;
  productSku: string;
  productName: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  productIdentifier: string | null;
  trackingCode: string | null;
}

export interface Order {
  objectId: string;
  id: string;
  code: string;
  orderType: OrderType;
  createdByName: string;
  customerName: string | null;
  customer: Customer | null;
  customerObjectId: string | null;
  customerAddressObjectId: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  warehouseType: string | null;
  customerNationalId: string | null;
  customerPhone: string | null;
  deliveryAddressTitle: string | null;
  deliveryProvince: string | null;
  deliveryCity: string | null;
  deliveryCounty: string | null;
  deliveryFullAddress: string | null;
  deliveryPostalCode: string | null;
  deliveryPlaque: string | null;
  deliveryUnit: string | null;
  receiverFullName: string | null;
  receiverPhone: string | null;
  deliveryAddress: CustomerAddress | null;
  orderStatus: string;
  orderStatusLabel: string;
  warehouseStatus: string;
  warehouseStatusLabel: string;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentStatusLabel: string;
  holdReason: string | null;
  heldByName: string | null;
  heldAt: string | null;
  shipmentStopReasonCode: string | null;
  shipmentStopReasonLabel: string | null;
  shipmentStoppedByName: string | null;
  shipmentStoppedAt: string | null;
  reviewReasonCode: string | null;
  reviewReasonLabel: string | null;
  reviewRequestedByName: string | null;
  reviewRequestedAt: string | null;
  reviewResolvedByName: string | null;
  reviewResolvedAt: string | null;
  reviewExpiresAt: string | null;
  reviewRemainingMs: number | null;
  sourceLabel: string | null;
  notes: string | null;
  cancelReasonCode: string | null;
  cancelReasonLabel: string | null;
  cancelledByName: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  voidedBySystem: boolean;
  voidedAt: string | null;
  voidReason: string | null;
  returnReason: string | null;
  createdAt: string;
  updatedAt: string;
  najaCenter: NajaCenter | null;
  items: OrderItem[];
}

export interface OrderFilters {
  status?: string;
  orderType?: OrderType;
}

export interface CreateOrderPayload {
  customerName?: string;
  createdByName: string;
  customerObjectId?: string;
  customerAddressObjectId?: string;
  notes?: string;
  items: Array<{
    productObjectId?: string;
    productId?: string;
    quantity: number;
  }>;
}

export type UpdatePendingOrderPayload = Partial<CreateOrderPayload>;

export interface LockShipmentPayload {
  reasonCode: string;
  stoppedByName: string;
  heldByName?: string;
}

export interface UnlockShipmentPayload {
  releasedByName: string;
}

export interface CancelOrderPayload {
  cancelledByName?: string;
}

export interface MarkOrderNeedsReviewPayload {
  reasonCode: string;
  requestedByName: string;
}

export interface ResolveOrderReviewPayload {
  resolvedByName: string;
}

export type StopShipmentPayload = LockShipmentPayload;

export type ReleaseShipmentPayload = UnlockShipmentPayload;
