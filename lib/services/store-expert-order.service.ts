import { httpClient } from "@/lib/api/http-client";
import type { Customer } from "@/lib/models/customer.model";
import type { PriceList } from "@/lib/models/pricing.model";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { mapExitSlipDto } from "@/lib/mappers/warehouse.mapper";

export type StoreStock = { objectId: string; id: string; sepidarStockId: number | null; code: number | null; title: string };
export type StoreProductOption = {
  objectId: string;
  productObjectId: string;
  productCode: string | null;
  productName: string;
  brandName: string | null;
  priceListId: string;
  priceListItemId: string;
  unitPrice: number;
  availableForSale: number;
  stockObjectId: string;
};
export type StoreBrandOption = { brandName: string; priceList: PriceList };
export type StoreOrderOptions = {
  customerObjectId: string;
  stocks: StoreStock[];
  brands: StoreBrandOption[];
  selectedPriceList: PriceList | null;
  products: StoreProductOption[];
};
export type StorePriceListAssignment = { objectId: string; brandName: string; priceList: PriceList; assignedAt: string | null; assignedBy: string | null };

export async function getStoreOrderOptions(filters: {
  customerObjectId: string;
  stockObjectId?: string;
  brandName?: string;
  search?: string;
}): Promise<StoreOrderOptions> {
  const params = new URLSearchParams({ customerObjectId: filters.customerObjectId });
  if (filters.stockObjectId) params.set("stockObjectId", filters.stockObjectId);
  if (filters.brandName) params.set("brandName", filters.brandName);
  if (filters.search) params.set("search", filters.search);
  return httpClient.get<StoreOrderOptions>(`/api/store-expert/order-options?${params.toString()}`);
}

export async function previewStoreOrder(payload: {
  customerObjectId: string;
  stockObjectId: string;
  brandName: string;
  paymentMethod: "cash" | "credit";
  paymentTerms?: string;
  items: Array<{ productObjectId: string; quantity: number; unitPrice?: number }>;
}) {
  return httpClient.post("/api/store-expert/order-preview", payload);
}

export type StoreOrderSubmission = {
  operationKey: string;
  status: "completed" | "pending_verification" | "invoice_pending" | "failed" | string;
  orderObjectId: string | null;
  internalInvoiceObjectId: string | null;
  errorMessage: string | null;
  canReconcile: boolean;
};

export async function createStoreOrder(payload: {
  operationKey: string;
  customerObjectId: string;
  stockObjectId: string;
  brandName: string;
  paymentMethod: "cash" | "credit";
  paymentTerms?: string;
  items: Array<{ productObjectId: string; quantity: number }>;
}): Promise<StoreOrderSubmission> {
  return httpClient.post("/api/store-expert/orders", payload);
}

export async function getStorePriceListConfiguration(): Promise<{ assignments: StorePriceListAssignment[]; availablePriceLists: PriceList[] }> {
  return httpClient.get("/api/store-expert/price-list-assignments");
}

export async function saveStorePriceListAssignment(brandName: string, priceListId: string): Promise<StorePriceListAssignment> {
  return httpClient.put(`/api/store-expert/price-list-assignments/${encodeURIComponent(brandName)}`, { priceListId });
}

export async function listStoreIssuedExitSlips(page = 1, pageSize = 25): Promise<{
  items: ExitSlip[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const data = await httpClient.get<{ items?: unknown[]; pagination?: { page?: number; pageSize?: number; total?: number; totalPages?: number } }>(
    `/api/store-expert/issued-exit-slips?page=${page}&pageSize=${pageSize}`,
  );
  return {
    items: (data.items || []).map(mapExitSlipDto),
    pagination: {
      page: Number(data.pagination?.page) || page,
      pageSize: Number(data.pagination?.pageSize) || pageSize,
      total: Number(data.pagination?.total) || 0,
      totalPages: Number(data.pagination?.totalPages) || 1,
    },
  };
}

export function customerOptions(customers: Customer[]) {
  return customers.map((customer) => ({
    value: customer.objectId,
    label: [customer.sepidarCustomerCode || customer.id, customer.fullName].filter(Boolean).join(" - "),
    searchText: [customer.fullName, customer.phone, customer.sepidarCustomerCode].filter(Boolean).join(" "),
  }));
}

