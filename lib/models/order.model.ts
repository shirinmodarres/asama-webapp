import type { NajaCenter } from "@/lib/models/naja-center.model";
import type { Customer, CustomerAddress } from "@/lib/models/customer.model";
import type { Product } from "@/lib/models/product.model";

export type OrderType = "normal" | "naja";
export type FulfillmentStatus = "normal" | "onHold";
export type QuotationStatus = "success" | "failed" | "pending";

export interface OrderItem {
  objectId: string;
  productId: string;
  sepidarItemId: number | null;
  productSku: string;
  productName: string;
  brand: string;
  brandName: string | null;
  quantity: number;
  unitPrice: number;
  priceListId?: string | null;
  priceListItemId?: string | null;
  pricingSource?: string | null;
  productIdentifier: string | null;
  trackingCode: string | null;
}

export interface Order {
  objectId: string;
  id: string;
  code: string;
  orderType: OrderType;
  createdByName?: string | null;
  expertUserId?: string | null;
  salesTypeObjectId: string | null;
  salesTypeTitle: string | null;
  salesTypeInternalCode: number | null;
  salesTypeSepidarCode: number | null;
  salesType: {
    objectId: string | null;
    title: string | null;
    internalCode: number | null;
    sepidarCode: number | null;
  } | null;
  customerName: string | null;
  customer: Customer | null;
  customerObjectId: string | null;
  sepidarCustomerId: number | string | null;
  sepidarCustomerCode: string | null;
  customerAddressObjectId: string | null;
  customerAddressId: number | null;
  selectedCustomerAddressId: number | null;
  customerAddressTitle: string | null;
  customerAddressText: string | null;
  customerAddressZipCode: string | null;
  customerAddressCityRef: number | null;
  customerAddressPathRef: number | null;
  customerAddressIsMain: boolean | null;
  selectedCustomerAddressText: string | null;
  saleTypeObjectId: string | null;
  sepidarSaleTypeId: number | null;
  saleTypeTitle: string | null;
  saleType: {
    objectId: string | null;
    sepidarSaleTypeId: number | null;
    title: string | null;
  } | null;
  priceListId: string | null;
  priceListTitle: string | null;
  priceListType: string | null;
  priceListBrand: string | null;
  priceList?: {
    objectId: string | null;
    id?: string | null;
    title: string | null;
    name?: string | null;
    typeCode: string | null;
    brandName: string | null;
  } | null;
  warehouseId: string | null;
  warehouseName: string | null;
  warehouseType: string | null;
  stockObjectId: string | null;
  selectedStockObjectIds?: string[];
  sepidarStockId: number | null;
  stockTitle: string | null;
  selectedStockTitles: string[];
  recipientFirstName: string | null;
  recipientLastName: string | null;
  recipientNationalId: string | null;
  recipientMobile: string | null;
  externalOrderNumber: string | null;
  najaOrderNumber: string | null;
  najaPurchaseDate: string | null;
  sepidarQuotationDate: string | null;
  customerNationalId: string | null;
  customerMobile: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
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
  financialApprovalStatus: "pending" | "approved" | "needs_correction" | null;
  financialApprovalStatusLabel: string | null;
  financialApprovedAt: string | null;
  financialApprovedBy: string | null;
  financialCorrectionReason: string | null;
  financialReturnedAt: string | null;
  financialReturnedBy: string | null;
  sourceLabel: string | null;
  notes: string | null;
  editedByUserId: string | null;
  editedByName: string | null;
  editedAt: string | null;
  changedFields: string[];
  cancelReasonCode: string | null;
  cancelReasonLabel: string | null;
  cancelledByName: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  voidedBySystem: boolean;
  voidedAt: string | null;
  voidReason: string | null;
  returnReason: string | null;
  sepidarQuotationId: number | null;
  sepidarQuotationNumber: number | string | null;
  quotationStatus: QuotationStatus;
  sepidarIntegrationStatus: string | null;
  quotationSyncError: string | null;
  sepidarLastError: string | null;
  canEdit: boolean;
  canCancel?: boolean;
  editBlockedReason: string | null;
  createdAt: string;
  updatedAt: string;
  najaCenter: NajaCenter | null;
  items: OrderItem[];
}

export interface OrderFilters {
  status?: string;
  orderType?: OrderType;
  financialApprovalStatus?: "pending" | "approved" | "needs_correction";
}

export interface CreateOrderPayload {
  customerName?: string;
  createdByName?: string;
  expertUserId?: string;
  salesTypeObjectId?: string;
  salesTypeTitle?: string | null;
  salesTypeInternalCode?: number | null;
  salesTypeSepidarCode?: number | null;
  customerObjectId?: string;
  customerAddressObjectId?: string;
  saleTypeObjectId?: string;
  sepidarSaleTypeId?: number;
  priceListId?: string;
  stockObjectId?: string;
  selectedStockObjectIds?: string[];
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientNationalId?: string;
  recipientMobile?: string;
  najaOrderNumber?: string;
  najaPurchaseDate?: string | null;
  sepidarQuotationDate?: string | null;
  notes?: string;
  items: Array<{
    productObjectId?: string;
    productId?: string;
    quantity: number;
    unitPrice?: number;
    priceNoteItemId?: number | null;
  }>;
}

export type UpdatePendingOrderPayload = Partial<CreateOrderPayload>;

export interface OrderEditData {
  order: Order;
  canEdit: boolean;
  editBlockedReason: string | null;
  products: Product[];
  customers: Customer[];
}

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

export interface OrderApprovalResult {
  order: Order | null;
  quotationStatus: QuotationStatus;
  warning: string | null;
}

export type StopShipmentPayload = LockShipmentPayload;

export type ReleaseShipmentPayload = UnlockShipmentPayload;
