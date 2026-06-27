export type WebsiteProductStatus = "active" | "inactive";
export type WebsiteOrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "payment_failed"
  | "refunded";
export type WebsitePaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export interface WebsiteProductDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}

export interface WebsiteProductSpecification {
  title: string;
  value: string;
  unit: string | null;
  sortOrder: number;
}

export interface WebsiteProduct {
  objectId: string;
  id: string;
  productRef: string | null;
  title: string;
  slug: string;
  sku: string;
  accountingItemCode: string;
  sepidarCode: string | null;
  sepidarItemId: number | null;
  description: string | null;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  images: string[];
  brand: string | null;
  category: string | null;
  brandId: string | null;
  brandTitle: string | null;
  brandSlug: string | null;
  categoryId: string | null;
  categoryTitle: string | null;
  categorySlug: string | null;
  isActive: boolean;
  isFeatured: boolean;
  websiteStock: number;
  reservedStock: number;
  availableStock: number;
  maxOrderQuantity: number | null;
  weight: number | null;
  dimensions: WebsiteProductDimensions;
  specifications: WebsiteProductSpecification[];
  keyFeaturesForSite: string[];
  technicalSpecsNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteProductPayload {
  productRef?: string | null;
  title: string;
  slug: string;
  sku: string;
  accountingItemCode: string;
  sepidarCode?: string | null;
  sepidarItemId?: number | null;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  salePrice?: number | null;
  images?: string[];
  brandId: string;
  categoryId: string;
  specifications?: WebsiteProductSpecification[];
  keyFeaturesForSite?: string[];
  technicalSpecsNote?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  websiteStock: number;
  reservedStock?: number;
  maxOrderQuantity?: number | null;
  weight?: number | null;
  dimensions?: WebsiteProductDimensions;
}

export interface WebsiteBrand {
  objectId: string;
  id: string;
  title: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteCategory {
  objectId: string;
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentCategoryId: string | null;
  parentCategoryTitle: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteBrandPayload {
  title: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface WebsiteCategoryPayload {
  title: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentCategoryId?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface WebsiteProductFilters {
  search?: string;
  category?: string;
  status?: "all" | "active" | "inactive";
  featured?: "all" | "featured" | "normal";
  stockStatus?: "all" | "in_stock" | "low_stock" | "out_of_stock";
}

export interface WebsiteStockUpdatePayload {
  websiteStock: number;
  note?: string | null;
}

export interface WebsiteOrderItem {
  objectId: string;
  productObjectId: string;
  productTitle: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface WebsiteOrderTimelineItem {
  status: string;
  label: string;
  note: string | null;
  createdAt: string;
  createdByName: string | null;
}

export interface WebsitePaymentInfo {
  gateway: string;
  gatewayLabel: string;
  paymentToken: string | null;
  transactionId: string | null;
  referenceId: string | null;
  status: string;
  paidAt: string | null;
  failedReason: string | null;
}

export interface WebsiteOrder {
  objectId: string;
  id: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string | null;
  recipientFirstName: string | null;
  recipientLastName: string | null;
  recipientMobile: string | null;
  province: string | null;
  city: string | null;
  shippingAddress: string | null;
  postalCode: string | null;
  productTotal: number;
  shippingPrice: number;
  discountCode: string | null;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: WebsitePaymentStatus;
  paymentStatusLabel: string;
  payment: WebsitePaymentInfo | null;
  orderStatus: WebsiteOrderStatus;
  orderStatusLabel: string;
  orderNote: string | null;
  supportNote: string | null;
  items: WebsiteOrderItem[];
  timeline: WebsiteOrderTimelineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteOrderFilters {
  search?: string;
  orderStatus?: string;
  paymentStatus?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}
