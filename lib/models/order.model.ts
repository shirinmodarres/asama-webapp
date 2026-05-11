import type { NajaCenter } from "@/lib/models/naja-center.model";

export type OrderType = "normal" | "naja";

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
  customerObjectId: string | null;
  customerAddressObjectId: string | null;
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
  orderStatus: string;
  orderStatusLabel: string;
  warehouseStatus: string;
  warehouseStatusLabel: string;
  sourceLabel: string | null;
  notes: string | null;
  cancelReason: string | null;
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
