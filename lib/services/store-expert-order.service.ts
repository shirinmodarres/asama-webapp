import { httpClient } from "@/lib/api/http-client";
import type { Customer } from "@/lib/models/customer.model";
import type { PriceList } from "@/lib/models/pricing.model";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import type { Order } from "@/lib/models/order.model";
import { mapExitSlipDto } from "@/lib/mappers/warehouse.mapper";
import { mapOrderDto, mapOrderListDto } from "@/lib/mappers/order.mapper";
import { mapInternalInvoiceDto } from "@/lib/mappers/internal-invoice.mapper";
import type { InternalInvoice } from "@/lib/models/internal-invoice.model";
import { toArray, toRecord } from "@/lib/mappers/mapper-utils";

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
  paymentMethod: "cash" | "credit";
  paymentTerms?: string;
  discountPercentage?: number;
  items: Array<{ productObjectId: string; stockObjectId: string; quantity: number; unitPrice?: number }>;
}) {
  return httpClient.post("/api/store-expert/order-preview", payload);
}

export type StoreOrderSubmission = {
  operationKey: string;
  status: "completed" | "pending_verification" | "invoice_pending" | "failed" | string;
  orderObjectId: string | null;
  orderCode?: string | null;
  internalInvoiceObjectId: string | null;
  modCenterInvoiceObjectId?: string | null;
  errorMessage: string | null;
  canReconcile: boolean;
  dryRun?: boolean;
  sepidarPayloadPreview?: Record<string, unknown> | null;
  order?: { inventoryReservationStatus?: string | null } | null;
};

export function getStoreOrderOperation(operationKey: string): Promise<StoreOrderSubmission> {
  return httpClient.get(`/api/store-expert/orders/operations/${encodeURIComponent(operationKey)}`);
}

export type StoreOrderListResult = {
  items: Order[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export async function listStoreOrders(filters: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}, signal?: AbortSignal): Promise<StoreOrderListResult> {
  const params = new URLSearchParams({
    page: String(filters.page || 1),
    pageSize: String(filters.pageSize || 20),
  });
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  const data = await httpClient.get<unknown>(`/api/store-expert/orders?${params.toString()}`, { signal });
  const record = toRecord(data);
  const pagination = toRecord(record.pagination);
  const items = mapOrderListDto(toArray(record.items));
  return {
    items,
    pagination: {
      page: Number(pagination.page) || 1,
      pageSize: Number(pagination.pageSize) || 20,
      total: Number(pagination.total) || 0,
      totalPages: Number(pagination.totalPages) || 1,
    },
  };
}

export type StoreExpertDashboardStats = {
  orderCount: number;
  pendingExitCount: number;
  partialExitCount: number;
  completedExitCount: number;
};

function readDashboardCount(value: unknown): number {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") {
    throw new Error("آمار داشبورد فروشگاه ناقص است.");
  }
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) throw new Error("آمار داشبورد فروشگاه نامعتبر است.");
  return count;
}

export async function getStoreExpertDashboard(): Promise<StoreExpertDashboardStats> {
  const data = await httpClient.get<unknown>("/api/store-expert/dashboard");
  const record = toRecord(data);
  return {
    orderCount: readDashboardCount(record.orderCount),
    pendingExitCount: readDashboardCount(record.pendingExitCount),
    partialExitCount: readDashboardCount(record.partialExitCount),
    completedExitCount: readDashboardCount(record.completedExitCount),
  };
}

export async function getStoreOrder(orderObjectId: string): Promise<Order> {
  return mapOrderDto(await httpClient.get<unknown>(`/api/store-expert/orders/${orderObjectId}`));
}

export async function retryStoreQuotation(orderObjectId: string): Promise<StoreOrderSubmission> {
  return httpClient.post(`/api/store-expert/orders/${orderObjectId}/retry-quotation`);
}

export async function getModCenterInvoice(invoiceObjectId: string): Promise<InternalInvoice> {
  return mapInternalInvoiceDto(
    await httpClient.get<unknown>(`/api/store-expert/mod-center-invoices/${invoiceObjectId}`),
  );
}

export async function createStoreOrder(payload: {
  operationKey: string;
  customerObjectId: string;
  paymentMethod: "cash" | "credit";
  paymentTerms?: string;
  discountPercentage?: number;
  items: Array<{ productObjectId: string; stockObjectId: string; quantity: number }>;
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
