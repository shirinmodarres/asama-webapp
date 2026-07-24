import type { Customer } from "@/lib/models/customer.model";

export type SalesQuotationStatus = "draft" | "finalized" | "cancelled";

export interface SalesQuotationItem {
  rowNumber?: number;
  productObjectId: string;
  productId?: string | null;
  productSku: string | null;
  productName: string;
  brandName: string | null;
  sepidarItemId: number | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineSubtotal: number;
  lineTotal: number;
  priceListId: string | null;
  priceListItemId: string | null;
  pricingSource: string | null;
}

export interface SalesQuotation {
  objectId: string;
  id: string;
  quotationNumber: string;
  expertObjectId: string | null;
  customerObjectId: string | null;
  priceListObjectId: string | null;
  priceListId: string | null;
  priceListTitle: string | null;
  priceListType: string | null;
  priceListBrand: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customer: Customer | null;
  expertName: string | null;
  status: SalesQuotationStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  validUntil: string | null;
  pdfUrl: string | null;
  finalizedAt: string | null;
  cancelledAt: string | null;
  cancelledByName: string | null;
  createdByName: string | null;
  createdByUserId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  items: SalesQuotationItem[];
}

export interface SalesQuotationFilters {
  search?: string;
  status?: SalesQuotationStatus | "all";
  customerObjectId?: string;
  priceListObjectId?: string;
  limit?: number;
  skip?: number;
}

export interface SalesQuotationProductOption {
  objectId: string;
  productObjectId: string;
  sepidarItemId: number | null;
  sepidarCode: string | null;
  sku: string | null;
  name: string;
  title: string;
  brandName: string | null;
  unitPrice: number;
  priceListId: string | null;
  priceListItemId: string | null;
  pricingSource: string | null;
  availableForSale: number;
  availableSalesQuantity: number;
  availableStocks: Array<{
    stockObjectId: string;
    sepidarStockId: number | null;
    stockTitle: string;
    realQuantity: number;
    salesQuantity: number;
    reservedQuantity: number;
    useFullRealQuantityForSales: boolean;
    availableForSale: number;
    availableSalesQuantity: number;
  }>;
}

export interface CreateSalesQuotationPayload {
  customerObjectId: string;
  priceListObjectId: string;
  notes?: string;
  validUntil?: string | null;
  discount?: number;
  tax?: number;
  status?: SalesQuotationStatus;
  items: Array<{
    productObjectId: string;
    quantity: number;
    discount?: number;
    tax?: number;
  }>;
}

export type UpdateSalesQuotationPayload = Partial<CreateSalesQuotationPayload>;
