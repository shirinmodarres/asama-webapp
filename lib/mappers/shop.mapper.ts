import {
  toArray,
  toBooleanValue,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import type {
  WebsiteOrder,
  WebsiteOrderItem,
  WebsiteOrderStatus,
  WebsiteOrderTimelineItem,
  WebsitePaymentStatus,
  WebsiteProduct,
  WebsiteProductDimensions,
  WebsiteBrand,
  WebsiteCategory,
} from "@/lib/models/shop.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

const ORDER_STATUS_LABELS: Record<WebsiteOrderStatus, string> = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  processing: "در حال پردازش",
  packed: "بسته‌بندی‌شده",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغوشده",
  payment_failed: "پرداخت ناموفق",
  refunded: "مستردشده",
};

const PAYMENT_STATUS_LABELS: Record<WebsitePaymentStatus, string> = {
  unpaid: "پرداخت‌نشده",
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
  refunded: "مستردشده",
};

export function mapWebsiteProductDto(dto: unknown): WebsiteProduct {
  const record = toRecord(dto);
  const dimensions = mapDimensions(record.dimensions);
  const websiteStock = toNumberValue(
    record.websiteStock ?? record.stock ?? record.quantity,
  );
  const reservedStock = toNumberValue(record.reservedStock);
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    productRef: toNullableString(record.productRef ?? record.productObjectId),
    title: toStringValue(record.title ?? record.name),
    slug: toStringValue(record.slug),
    sku: normalizeDigits(toStringValue(record.sku ?? record.code)),
    accountingItemCode: normalizeDigits(toStringValue(record.accountingItemCode)),
    sepidarCode: normalizeNullableDigits(record.sepidarCode),
    sepidarItemId:
      record.sepidarItemId === undefined || record.sepidarItemId === null
        ? null
        : toNumberValue(record.sepidarItemId),
    description: toNullableString(record.description),
    shortDescription: toNullableString(record.shortDescription),
    price: toNumberValue(record.price),
    salePrice:
      record.salePrice === undefined || record.salePrice === null
        ? null
        : toNumberValue(record.salePrice),
    images: toArray(record.images)
      .map((value) => toStringValue(value).trim())
      .filter(Boolean),
    brand: toNullableString(record.brandTitle ?? record.brand),
    category: toNullableString(record.categoryTitle ?? record.category),
    brandId: toNullableString(record.brandId),
    brandTitle: toNullableString(record.brandTitle ?? record.brand),
    categoryId: toNullableString(record.categoryId),
    categoryTitle: toNullableString(record.categoryTitle ?? record.category),
    isActive: toBooleanValue(record.isActive ?? record.active),
    isFeatured: toBooleanValue(record.isFeatured ?? record.featured),
    websiteStock,
    reservedStock,
    availableStock: Math.max(
      0,
      toNumberValue(record.availableStock ?? websiteStock - reservedStock),
    ),
    maxOrderQuantity:
      record.maxOrderQuantity === undefined || record.maxOrderQuantity === null
        ? null
        : toNumberValue(record.maxOrderQuantity),
    weight:
      record.weight === undefined || record.weight === null
        ? null
        : toNumberValue(record.weight),
    dimensions,
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapWebsiteBrandDto(dto: unknown): WebsiteBrand {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    title: toStringValue(record.title),
    slug: toStringValue(record.slug),
    description: toNullableString(record.description),
    logo: toNullableString(record.logo),
    isActive: toBooleanValue(record.isActive),
    sortOrder: toNumberValue(record.sortOrder),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapWebsiteBrandListDto(dto: unknown): WebsiteBrand[] {
  const record = toRecord(dto);
  return toArray(record.items ?? dto).map(mapWebsiteBrandDto);
}

export function mapWebsiteCategoryDto(dto: unknown): WebsiteCategory {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    title: toStringValue(record.title),
    slug: toStringValue(record.slug),
    description: toNullableString(record.description),
    image: toNullableString(record.image),
    parentCategoryId: toNullableString(record.parentCategoryId),
    parentCategoryTitle: toNullableString(record.parentCategoryTitle),
    isActive: toBooleanValue(record.isActive),
    sortOrder: toNumberValue(record.sortOrder),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapWebsiteCategoryListDto(dto: unknown): WebsiteCategory[] {
  const record = toRecord(dto);
  return toArray(record.items ?? dto).map(mapWebsiteCategoryDto);
}

export function mapWebsiteProductListDto(dto: unknown): WebsiteProduct[] {
  const record = toRecord(dto);
  return toArray(record.items ?? record.products ?? dto).map(
    mapWebsiteProductDto,
  );
}

export function mapWebsiteOrderDto(dto: unknown): WebsiteOrder {
  const record = toRecord(dto);
  const customer = toRecord(record.customer);
  const shipping = toRecord(record.shippingAddress ?? record.address);
  const paymentStatus = mapPaymentStatus(record.paymentStatus);
  const orderStatus = mapOrderStatus(record.orderStatus ?? record.status);
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    orderNumber: normalizeDigits(
      toStringValue(record.orderNumber ?? record.code ?? record.number),
    ),
    customerName: toStringValue(
      record.customerName ?? customer.fullName ?? customer.name,
    ),
    customerMobile: normalizePhone(
      toStringValue(record.customerMobile ?? customer.mobile ?? customer.phone),
    ),
    customerEmail: toNullableString(record.customerEmail ?? customer.email),
    province: toNullableString(record.province ?? shipping.province),
    city: toNullableString(record.city ?? shipping.city),
    shippingAddress: toNullableString(
      record.shippingAddressText ??
        record.fullAddress ??
        shipping.fullAddress ??
        shipping.address,
    ),
    postalCode: normalizeNullableDigits(
      record.postalCode ?? shipping.postalCode,
    ),
    productTotal: toNumberValue(record.productTotal ?? record.itemsTotal),
    shippingPrice: toNumberValue(record.shippingPrice),
    discountCode: toNullableString(record.discountCode),
    discountAmount: toNumberValue(record.discountAmount),
    finalAmount: toNumberValue(record.finalAmount ?? record.totalAmount),
    paymentStatus,
    paymentStatusLabel:
      toNullableString(record.paymentStatusLabel) ||
      getWebsitePaymentStatusLabel(paymentStatus),
    orderStatus,
    orderStatusLabel:
      toNullableString(record.orderStatusLabel) ||
      getWebsiteOrderStatusLabel(orderStatus),
    supportNote: toNullableString(record.supportNote),
    items: toArray(record.items).map(mapWebsiteOrderItemDto),
    timeline: toArray(record.timeline ?? record.statusTimeline).map(
      mapWebsiteTimelineItemDto,
    ),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapWebsiteOrderListDto(dto: unknown): WebsiteOrder[] {
  const record = toRecord(dto);
  return toArray(record.items ?? record.orders ?? dto).map(mapWebsiteOrderDto);
}

export function getWebsiteOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[mapOrderStatus(status)] ?? status;
}

export function getWebsitePaymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[mapPaymentStatus(status)] ?? status;
}

function mapWebsiteOrderItemDto(dto: unknown): WebsiteOrderItem {
  const record = toRecord(dto);
  const product = toRecord(record.product);
  const quantity = toNumberValue(record.quantity);
  const unitPrice = toNumberValue(record.unitPrice ?? record.price);
  return {
    objectId: toStringValue(record.objectId),
    productObjectId: toStringValue(
      record.productObjectId ?? record.productId ?? product.objectId,
    ),
    productTitle: toStringValue(
      record.productTitle ?? record.title ?? product.title ?? product.name,
    ),
    productSku: normalizeDigits(
      toStringValue(record.productSku ?? record.sku ?? product.sku),
    ),
    quantity,
    unitPrice,
    lineTotal: toNumberValue(record.lineTotal ?? quantity * unitPrice),
  };
}

function mapWebsiteTimelineItemDto(dto: unknown): WebsiteOrderTimelineItem {
  const record = toRecord(dto);
  const status = toStringValue(record.status);
  return {
    status,
    label: toStringValue(record.label) || getWebsiteOrderStatusLabel(status),
    note: toNullableString(record.note),
    createdAt: toStringValue(record.createdAt),
    createdByName: toNullableString(record.createdByName),
  };
}

function mapDimensions(value: unknown): WebsiteProductDimensions {
  const record = toRecord(value);
  return {
    length:
      record.length === undefined || record.length === null
        ? null
        : toNumberValue(record.length),
    width:
      record.width === undefined || record.width === null
        ? null
        : toNumberValue(record.width),
    height:
      record.height === undefined || record.height === null
        ? null
        : toNumberValue(record.height),
  };
}

function mapOrderStatus(value: unknown): WebsiteOrderStatus {
  const status = toStringValue(value);
  return isOrderStatus(status) ? status : "pending_payment";
}

function mapPaymentStatus(value: unknown): WebsitePaymentStatus {
  const status = toStringValue(value);
  return isPaymentStatus(status) ? status : "unpaid";
}

function isOrderStatus(status: string): status is WebsiteOrderStatus {
  return Object.prototype.hasOwnProperty.call(ORDER_STATUS_LABELS, status);
}

function isPaymentStatus(status: string): status is WebsitePaymentStatus {
  return Object.prototype.hasOwnProperty.call(PAYMENT_STATUS_LABELS, status);
}

function normalizeNullableDigits(value: unknown): string | null {
  const text = toNullableString(value);
  return text ? normalizeDigits(text) : null;
}
