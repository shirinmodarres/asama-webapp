import {
  getOrderStatusLabel,
  getWarehouseStatusLabel,
  normalizeOrderStatus as normalizeOrderStatusCode,
} from "@/lib/domain/statuses";
import {
  getCancelReasonLabel,
  getReviewReasonLabel,
  getShipmentStopReasonLabel,
} from "@/lib/domain/order-action-reasons";
import {
  mapCustomerAddressDto,
  mapCustomerDto,
} from "@/lib/mappers/customer.mapper";
import {
  toArray,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import { mapNajaCenterSummaryDto } from "@/lib/mappers/naja-center.mapper";
import type {
  FulfillmentStatus,
  Order,
  OrderItem,
  OrderType,
  QuotationStatus,
} from "@/lib/models/order.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

export function mapOrderDto(dto: unknown): Order {
  const record = toRecord(dto);
  const customerRecord = toRecord(record.customer);
  const customer = isObjectRecord(record.customer)
    ? mapCustomerDto(record.customer)
    : null;
  const addressRecord = toRecord(
    record.deliveryAddress ?? record.customerAddress ?? record.address,
  );
  const deliveryAddressSource =
    record.deliveryAddress ?? record.customerAddress ?? record.address;
  const deliveryAddress = isObjectRecord(deliveryAddressSource)
    ? mapCustomerAddressDto(deliveryAddressSource, record.customer)
    : null;

  const shipmentStopReasonCode = toNullableString(
    record.shipmentStopReasonCode,
  );
  const reviewReasonCode = toNullableString(record.reviewReasonCode);
  const cancelReasonCode = toNullableString(record.cancelReasonCode);
  const holdReason = toNullableString(record.holdReason);
  const cancelReason = toNullableString(record.cancelReason);
  const orderStatus = normalizeOrderStatus(toStringValue(record.orderStatus));
  const saleTypeRecord = toRecord(record.saleType);

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    code: toStringValue(record.code),
    orderType: mapOrderType(record.orderType),
    createdByName: toNullableString(record.createdByName),
    customerName: toNullableString(
      record.customerName ?? customerRecord.fullName,
    ),
    customer,
    customerObjectId: toNullableString(
      record.customerObjectId ?? customerRecord.objectId,
    ),
    sepidarCustomerId:
      record.sepidarCustomerId === undefined || record.sepidarCustomerId === null
        ? null
        : toStringValue(record.sepidarCustomerId),
    sepidarCustomerCode: toNullableString(record.sepidarCustomerCode),
    customerAddressObjectId: toNullableString(
      record.customerAddressObjectId ?? addressRecord.objectId,
    ),
    saleTypeObjectId: toNullableString(
      record.saleTypeObjectId ?? saleTypeRecord.objectId,
    ),
    sepidarSaleTypeId:
      record.sepidarSaleTypeId === undefined || record.sepidarSaleTypeId === null
        ? null
        : toNumberValue(record.sepidarSaleTypeId),
    saleTypeTitle: toNullableString(record.saleTypeTitle ?? saleTypeRecord.title),
    saleType:
      record.saleType || record.sepidarSaleTypeId !== undefined || record.saleTypeTitle
        ? {
            objectId: toNullableString(
              record.saleTypeObjectId ?? saleTypeRecord.objectId,
            ),
            sepidarSaleTypeId:
              record.sepidarSaleTypeId === undefined ||
              record.sepidarSaleTypeId === null
                ? null
                : toNumberValue(record.sepidarSaleTypeId),
            title: toNullableString(record.saleTypeTitle ?? saleTypeRecord.title),
          }
        : null,
    warehouseId: toNullableString(
      record.warehouseId ??
        record.warehouseObjectId ??
        toRecord(record.warehouse).objectId,
    ),
    warehouseName: toNullableString(
      record.warehouseName ?? toRecord(record.warehouse).name,
    ),
    warehouseType: toNullableString(
      record.warehouseType ?? toRecord(record.warehouse).type,
    ),
    stockObjectId: toNullableString(
      record.stockObjectId ?? toRecord(record.stock).objectId,
    ),
    sepidarStockId:
      record.sepidarStockId === undefined || record.sepidarStockId === null
        ? null
        : toNumberValue(record.sepidarStockId),
    stockTitle: toNullableString(
      record.stockTitle ?? toRecord(record.stock).title,
    ),
    recipientFirstName: toNullableString(record.recipientFirstName),
    recipientLastName: toNullableString(record.recipientLastName),
    recipientNationalId: normalizeNullableDigits(record.recipientNationalId),
    recipientMobile: normalizeNullablePhone(record.recipientMobile),
    externalOrderNumber: normalizeNullableDigits(record.externalOrderNumber),
    najaOrderNumber: normalizeNullableDigits(
      record.najaOrderNumber ?? record.externalOrderNumber,
    ),
    customerNationalId: normalizeNullableDigits(
      record.customerNationalId ??
        record.nationalId ??
        customerRecord.nationalId,
    ),
    customerPhone: normalizeNullablePhone(
      record.customerPhone ??
        record.customerMobile ??
        record.phoneNumber ??
        customerRecord.phone ??
        customerRecord.mobile,
    ),
    deliveryAddressTitle: toNullableString(
      record.deliveryAddressTitle ?? addressRecord.title,
    ),
    deliveryProvince: toNullableString(
      record.deliveryProvince ?? addressRecord.province,
    ),
    deliveryCity: toNullableString(record.deliveryCity ?? addressRecord.city),
    deliveryCounty: toNullableString(
      record.deliveryCounty ?? addressRecord.county,
    ),
    deliveryFullAddress: toNullableString(
      record.deliveryFullAddress ??
        record.customerAddressSnapshot ??
        (typeof record.customerAddress === "string"
          ? record.customerAddress
          : undefined) ??
        record.fullAddress ??
        addressRecord.fullAddress,
    ),
    deliveryPostalCode: normalizeNullableDigits(
      record.deliveryPostalCode ?? addressRecord.postalCode,
    ),
    deliveryPlaque: normalizeNullableDigits(
      record.deliveryPlaque ?? addressRecord.plaque,
    ),
    deliveryUnit: normalizeNullableDigits(
      record.deliveryUnit ?? addressRecord.unit,
    ),
    receiverFullName: toNullableString(
      record.receiverFullName ??
        record.receiverName ??
        addressRecord.receiverFullName ??
        addressRecord.receiverName,
    ),
    receiverPhone: normalizeNullablePhone(
      record.receiverPhone ?? addressRecord.receiverPhone,
    ),
    deliveryAddress,
    orderStatus,
    orderStatusLabel: getOrderStatusLabel(orderStatus),
    warehouseStatus: toStringValue(record.warehouseStatus),
    warehouseStatusLabel: getWarehouseStatusLabel(
      toStringValue(record.warehouseStatus),
    ),
    fulfillmentStatus: mapFulfillmentStatus(record.fulfillmentStatus),
    fulfillmentStatusLabel: getFulfillmentStatusLabel(
      mapFulfillmentStatus(record.fulfillmentStatus),
    ),
    holdReason,
    heldByName: toNullableString(record.heldByName),
    heldAt: toNullableString(record.heldAt),
    shipmentStopReasonCode,
    shipmentStopReasonLabel:
      toNullableString(record.shipmentStopReasonLabel) ||
      getShipmentStopReasonLabel(shipmentStopReasonCode) ||
      holdReason,
    shipmentStoppedByName: toNullableString(
      record.shipmentStoppedByName ?? record.heldByName,
    ),
    shipmentStoppedAt: toNullableString(
      record.shipmentStoppedAt ?? record.heldAt,
    ),
    reviewReasonCode,
    reviewReasonLabel:
      toNullableString(record.reviewReasonLabel) ||
      getReviewReasonLabel(reviewReasonCode) ||
      (orderStatus === "needs_review"
        ? toNullableString(record.cancelReasonLabel) || cancelReason
        : null),
    reviewRequestedByName: toNullableString(record.reviewRequestedByName),
    reviewRequestedAt: toNullableString(record.reviewRequestedAt),
    reviewResolvedByName: toNullableString(record.reviewResolvedByName),
    reviewResolvedAt: toNullableString(record.reviewResolvedAt),
    reviewExpiresAt: toNullableString(record.reviewExpiresAt),
    reviewRemainingMs:
      record.reviewRemainingMs === null ||
      record.reviewRemainingMs === undefined
        ? null
        : toNumberValue(record.reviewRemainingMs),
    sourceLabel: toNullableString(record.sourceLabel),
    notes: toNullableString(record.notes),
    cancelReasonCode,
    cancelReasonLabel:
      toNullableString(record.cancelReasonLabel) ||
      getCancelReasonLabel(cancelReasonCode) ||
      cancelReason,
    cancelledByName: toNullableString(record.cancelledByName),
    cancelledAt: toNullableString(record.cancelledAt),
    cancelReason,
    voidedBySystem: Boolean(record.voidedBySystem),
    voidedAt: toNullableString(record.voidedAt),
    voidReason: toNullableString(record.voidReason),
    returnReason: toNullableString(record.returnReason),
    sepidarQuotationId:
      record.sepidarQuotationId === undefined || record.sepidarQuotationId === null
        ? null
        : toNumberValue(record.sepidarQuotationId),
    sepidarQuotationNumber:
      record.sepidarQuotationNumber === undefined ||
      record.sepidarQuotationNumber === null
        ? null
        : toStringValue(record.sepidarQuotationNumber),
    quotationStatus: mapQuotationStatus(
      record.quotationStatus,
      record.sepidarIntegrationStatus,
      record.sepidarQuotationId,
    ),
    sepidarIntegrationStatus: toNullableString(record.sepidarIntegrationStatus),
    sepidarLastError: toNullableString(record.sepidarLastError),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
    najaCenter: mapNajaCenterSummaryDto(
      record.najaCenter ??
        record.center ??
        record.centerInfo ??
        record.najaCenterInfo,
      record,
    ),
    items: toArray(record.items).map(mapOrderItemDto),
  };
}

export function mapOrderListDto(dto: unknown): Order[] {
  return Array.isArray(dto) ? dto.map(mapOrderDto) : [];
}

function mapOrderItemDto(dto: unknown): OrderItem {
  const record = toRecord(dto);
  const productRecord = toRecord(record.product);

  return {
    objectId: toStringValue(record.objectId),
    productId: toStringValue(
      record.productObjectId ?? record.productId ?? productRecord.objectId,
    ),
    productSku: toStringValue(record.productSku ?? productRecord.sku),
    productName: toStringValue(record.productName ?? productRecord.name),
    brand: toStringValue(record.brand ?? productRecord.brand),
    quantity: toNumberValue(record.quantity),
    unitPrice: toNumberValue(record.unitPrice),
    productIdentifier: normalizeNullableDigits(record.productIdentifier),
    trackingCode: normalizeNullableDigits(record.trackingCode),
  };
}

function mapOrderType(value: unknown): OrderType {
  return value === "naja" ? "naja" : "normal";
}

function normalizeOrderStatus(value: string): string {
  return normalizeOrderStatusCode(value) || "pending_approval";
}

function mapFulfillmentStatus(value: unknown): FulfillmentStatus {
  return value === "onHold" ? "onHold" : "normal";
}

function mapQuotationStatus(
  value: unknown,
  integrationStatus: unknown,
  quotationId: unknown,
): QuotationStatus {
  const explicit = toStringValue(value);
  if (explicit === "success" || explicit === "failed" || explicit === "pending") {
    return explicit;
  }

  const integration = toStringValue(integrationStatus);
  if (integration === "quotation_failed" || integration === "failed") {
    return "failed";
  }
  if (
    quotationId !== undefined &&
    quotationId !== null &&
    quotationId !== ""
  ) {
    return "success";
  }
  if (
    integration === "quotation_created" ||
    integration === "success"
  ) {
    return "success";
  }
  return "pending";
}

function getFulfillmentStatusLabel(status: FulfillmentStatus): string {
  return status === "onHold" ? "خروج متوقف شده" : "مجاز به خروج";
}

function normalizeNullableDigits(value: unknown): string | null {
  const text = toNullableString(value);
  return text ? normalizeDigits(text) : null;
}

function normalizeNullablePhone(value: unknown): string | null {
  const text = toNullableString(value);
  return text ? normalizePhone(text) : null;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}
