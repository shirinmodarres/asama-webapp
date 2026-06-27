import { httpClient } from "@/lib/api/http-client";
import {
  mapWebsiteOrderDto,
  mapWebsiteOrderListDto,
  mapWebsiteProductDto,
  mapWebsiteProductListDto,
  mapWebsiteBrandDto,
  mapWebsiteBrandListDto,
  mapWebsiteCategoryDto,
  mapWebsiteCategoryListDto,
} from "@/lib/mappers/shop.mapper";
import type {
  WebsiteOrder,
  WebsiteOrderFilters,
  WebsiteOrderStatus,
  WebsiteProduct,
  WebsiteProductFilters,
  WebsiteProductPayload,
  WebsiteStockUpdatePayload,
  WebsiteBrand,
  WebsiteBrandPayload,
  WebsiteCategory,
  WebsiteCategoryPayload,
} from "@/lib/models/shop.model";
import { normalizeDigits, toNumber } from "@/lib/utils/number-format";

export async function listWebsiteProducts(
  filters?: WebsiteProductFilters,
): Promise<WebsiteProduct[]> {
  const data = await httpClient.get<unknown>(
    `/api/admin/shop/products${buildProductQuery(filters)}`,
  );
  return mapWebsiteProductListDto(data);
}

export async function getWebsiteProduct(
  objectId: string,
): Promise<WebsiteProduct> {
  const data = await httpClient.get<unknown>(
    `/api/admin/shop/products/${objectId}`,
  );
  return mapWebsiteProductDto(data);
}

export async function createWebsiteProduct(
  payload: WebsiteProductPayload,
): Promise<WebsiteProduct> {
  const data = await httpClient.post<unknown>(
    "/api/admin/shop/products",
    normalizeProductPayload(payload),
  );
  return mapWebsiteProductDto(data);
}

export async function updateWebsiteProduct(
  objectId: string,
  payload: WebsiteProductPayload,
): Promise<WebsiteProduct> {
  const data = await httpClient.patch<unknown>(
    `/api/admin/shop/products/${objectId}`,
    normalizeProductPayload(payload),
  );
  return mapWebsiteProductDto(data);
}

export async function updateWebsiteProductStock(
  objectId: string,
  payload: WebsiteStockUpdatePayload,
): Promise<WebsiteProduct> {
  const data = await httpClient.patch<unknown>(
    `/api/admin/shop/products/${objectId}/stock`,
    {
      websiteStock: toNumber(payload.websiteStock),
      note: payload.note?.trim() || undefined,
    },
  );
  return mapWebsiteProductDto(data);
}

export async function listWebsiteOrders(
  filters?: WebsiteOrderFilters,
): Promise<WebsiteOrder[]> {
  const data = await httpClient.get<unknown>(
    `/api/admin/shop/orders${buildOrderQuery(filters)}`,
  );
  return mapWebsiteOrderListDto(data);
}

export async function getWebsiteOrder(objectId: string): Promise<WebsiteOrder> {
  const data = await httpClient.get<unknown>(
    `/api/admin/shop/orders/${objectId}`,
  );
  return mapWebsiteOrderDto(data);
}

export async function updateWebsiteOrderStatus(
  objectId: string,
  status: WebsiteOrderStatus,
): Promise<WebsiteOrder> {
  const data = await httpClient.patch<unknown>(
    `/api/admin/shop/orders/${objectId}/status`,
    { status },
  );
  return mapWebsiteOrderDto(data);
}

export async function updateWebsiteOrderSupportNote(
  objectId: string,
  supportNote: string,
): Promise<WebsiteOrder> {
  const data = await httpClient.patch<unknown>(
    `/api/admin/shop/orders/${objectId}/support-note`,
    { supportNote },
  );
  return mapWebsiteOrderDto(data);
}

function normalizeProductPayload(
  payload: WebsiteProductPayload,
): Record<string, unknown> {
  return {
    ...payload,
    productRef: payload.productRef?.trim() || undefined,
    title: payload.title.trim(),
    slug: normalizeSlug(payload.slug || payload.title),
    sku: normalizeDigits(payload.sku.trim()),
    accountingItemCode: normalizeDigits(payload.accountingItemCode.trim()),
    sepidarCode: payload.sepidarCode
      ? normalizeDigits(payload.sepidarCode.trim())
      : null,
    sepidarItemId:
      payload.sepidarItemId === null || payload.sepidarItemId === undefined
        ? null
        : toNumber(payload.sepidarItemId),
    description: payload.description?.trim() || null,
    shortDescription: payload.shortDescription?.trim() || null,
    price: toNumber(payload.price),
    salePrice:
      payload.salePrice === null || payload.salePrice === undefined
        ? null
        : toNumber(payload.salePrice),
    images: payload.images?.map((image) => image.trim()).filter(Boolean) ?? [],
    brandId: payload.brandId,
    categoryId: payload.categoryId,
    specifications: payload.specifications
      ? payload.specifications
          .map((item, index) => ({
            title: item.title.trim(),
            value: item.value.trim(),
            unit: item.unit?.trim() || null,
            sortOrder: toNumber(item.sortOrder || index + 1),
          }))
          .filter((item) => item.title && item.value)
      : undefined,
    keyFeaturesForSite:
      payload.keyFeaturesForSite?.map((feature) => feature.trim()).filter(Boolean) ??
      undefined,
    technicalSpecsNote:
      payload.technicalSpecsNote === undefined
        ? undefined
        : payload.technicalSpecsNote?.trim() || null,
    isActive: payload.isActive,
    isFeatured: payload.isFeatured,
    websiteStock: toNumber(payload.websiteStock),
    reservedStock:
      payload.reservedStock === undefined
        ? undefined
        : toNumber(payload.reservedStock),
    maxOrderQuantity:
      payload.maxOrderQuantity === null ||
      payload.maxOrderQuantity === undefined
        ? null
        : toNumber(payload.maxOrderQuantity),
    weight:
      payload.weight === null || payload.weight === undefined
        ? null
        : toNumber(payload.weight),
    dimensions: {
      length:
        payload.dimensions?.length === null ||
        payload.dimensions?.length === undefined
          ? null
          : toNumber(payload.dimensions.length),
      width:
        payload.dimensions?.width === null ||
        payload.dimensions?.width === undefined
          ? null
          : toNumber(payload.dimensions.width),
      height:
        payload.dimensions?.height === null ||
        payload.dimensions?.height === undefined
          ? null
          : toNumber(payload.dimensions.height),
    },
  };
}

export async function listWebsiteBrands(activeOnly = false): Promise<WebsiteBrand[]> {
  const data = await httpClient.get<unknown>(
    `/api/admin/shop/brands${activeOnly ? "?active=true" : ""}`,
  );
  return mapWebsiteBrandListDto(data);
}

export async function getWebsiteBrand(id: string): Promise<WebsiteBrand> {
  return mapWebsiteBrandDto(await httpClient.get<unknown>(`/api/admin/shop/brands/${id}`));
}

export async function createWebsiteBrand(payload: WebsiteBrandPayload): Promise<WebsiteBrand> {
  return mapWebsiteBrandDto(await httpClient.post<unknown>("/api/admin/shop/brands", normalizeEntityPayload(payload)));
}

export async function updateWebsiteBrand(id: string, payload: WebsiteBrandPayload): Promise<WebsiteBrand> {
  return mapWebsiteBrandDto(await httpClient.patch<unknown>(`/api/admin/shop/brands/${id}`, normalizeEntityPayload(payload)));
}

export async function deactivateWebsiteBrand(id: string): Promise<WebsiteBrand> {
  return mapWebsiteBrandDto(await httpClient.delete<unknown>(`/api/admin/shop/brands/${id}`));
}

export async function listWebsiteCategories(activeOnly = false): Promise<WebsiteCategory[]> {
  const data = await httpClient.get<unknown>(
    `/api/admin/shop/categories${activeOnly ? "?active=true" : ""}`,
  );
  return mapWebsiteCategoryListDto(data);
}

export async function getWebsiteCategory(id: string): Promise<WebsiteCategory> {
  return mapWebsiteCategoryDto(await httpClient.get<unknown>(`/api/admin/shop/categories/${id}`));
}

export async function createWebsiteCategory(payload: WebsiteCategoryPayload): Promise<WebsiteCategory> {
  return mapWebsiteCategoryDto(await httpClient.post<unknown>("/api/admin/shop/categories", normalizeEntityPayload(payload)));
}

export async function updateWebsiteCategory(id: string, payload: WebsiteCategoryPayload): Promise<WebsiteCategory> {
  return mapWebsiteCategoryDto(await httpClient.patch<unknown>(`/api/admin/shop/categories/${id}`, normalizeEntityPayload(payload)));
}

export async function deactivateWebsiteCategory(id: string): Promise<WebsiteCategory> {
  return mapWebsiteCategoryDto(await httpClient.delete<unknown>(`/api/admin/shop/categories/${id}`));
}

function normalizeEntityPayload<T extends WebsiteBrandPayload | WebsiteCategoryPayload>(payload: T) {
  return {
    ...payload,
    title: payload.title.trim(),
    slug: normalizeSlug(payload.slug || payload.title),
    description: payload.description?.trim() || null,
    sortOrder: toNumber(payload.sortOrder),
    ...("logo" in payload ? { logo: payload.logo?.trim() || null } : {}),
    ...("image" in payload ? { image: payload.image?.trim() || null } : {}),
  };
}

function buildProductQuery(filters?: WebsiteProductFilters): string {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set("search", filters.search.trim());
  if (filters?.category && filters.category !== "all") {
    params.set("category", filters.category);
  }
  if (filters?.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters?.featured && filters.featured !== "all") {
    params.set("featured", filters.featured);
  }
  if (filters?.stockStatus && filters.stockStatus !== "all") {
    params.set("stockStatus", filters.stockStatus);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildOrderQuery(filters?: WebsiteOrderFilters): string {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set("search", filters.search.trim());
  if (filters?.orderStatus && filters.orderStatus !== "all") {
    params.set("orderStatus", filters.orderStatus);
  }
  if (filters?.paymentStatus && filters.paymentStatus !== "all") {
    params.set("paymentStatus", filters.paymentStatus);
  }
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function normalizeSlug(value: string): string {
  return normalizeDigits(value)
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
