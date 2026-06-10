import { httpClient } from "@/lib/api/http-client";
import { ApiError } from "@/lib/api/api-error";
import {
  mapProductDto,
  mapProductListDto,
  mapProductOrderOptionListDto,
  mapSepidarProductSyncSummaryDto,
} from "@/lib/mappers/product.mapper";
import { toRecord } from "@/lib/mappers/mapper-utils";
import type {
  CreateProductPayload,
  Product,
  SepidarProductSyncSummary,
  UpdateProductPayload,
  UpdateProductStockPayload,
} from "@/lib/models/product.model";
import {
  normalizeDigits,
  toNumber,
} from "@/lib/utils/number-format";

export async function listProducts(viewerRole?: string): Promise<Product[]> {
  const data = await httpClient.get<unknown>(buildProductsPath(viewerRole));
  return mapProductListDto(data);
}

export async function listSepidarOrderProducts(): Promise<Product[]> {
  const params = new URLSearchParams({
    source: "sepidar",
    status: "active",
    sellable: "true",
  });
  const data = await httpClient.get<unknown>(`/api/products?${params.toString()}`);
  const record = toRecord(data);
  return mapProductListDto(
    Array.isArray(data) ? data : record.items ?? record.products ?? [],
  ).filter(
    (product) =>
      product.isSyncedFromSepidar &&
      product.sepidarItemId !== null &&
      product.status === "active" &&
      product.isActive !== false &&
      product.isSellable !== false,
  );
}

export async function listOrderProductsBySaleType(
  saleTypeId: number,
  context?: {
    customerObjectId?: string;
    expertUserId?: string;
  },
): Promise<Product[]> {
  const params = new URLSearchParams({ saleTypeId: String(saleTypeId) });
  if (context?.customerObjectId) {
    params.set("customerObjectId", context.customerObjectId);
  }
  if (context?.expertUserId) {
    params.set("expertUserId", context.expertUserId);
  }
  const data = await httpClient.get<unknown>(
    `/api/products/order-options?${params.toString()}`,
  );
  const record = toRecord(data);
  const products = mapProductOrderOptionListDto(
    Array.isArray(data) ? data : record.items ?? record.products ?? [],
  );
  console.log(
    "[FRONTEND_ORDER_OPTIONS]",
    products.map((product) => ({
      code: product.sepidarCode || product.sku,
      name: product.name,
      availableSalesQuantity: product.availableSalesQuantity,
    })),
  );
  return products;
}

export async function syncPricesFromSepidar(): Promise<SepidarProductSyncSummary> {
  const data = await httpClient.post<unknown>(
    "/api/integrations/sepidar/sync/prices",
  );
  return mapSepidarProductSyncSummaryDto(data);
}

export async function getProduct(objectId: string): Promise<Product> {
  try {
    const data = await httpClient.get<unknown>(`/api/products/${objectId}`);
    return mapProductDto(data);
  } catch (error) {
    // TODO: Remove this fallback when GET /api/products/:objectId is guaranteed.
    if (error instanceof ApiError && error.status && error.status !== 404) {
      throw error;
    }

    const products = await listProducts();
    const product = products.find((entry) => entry.objectId === objectId);
    if (product) return product;

    throw error;
  }
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<Product> {
  const data = await httpClient.post<unknown>(
    "/api/products",
    normalizeProductPayload(payload),
  );
  return mapProductDto(data);
}

export async function updateProduct(
  objectId: string,
  payload: UpdateProductPayload,
): Promise<Product> {
  const data = await httpClient.put<unknown>(
    `/api/products/${objectId}`,
    normalizeProductPayload(payload),
  );
  return mapProductDto(data);
}

export async function updateProductStock(
  objectId: string,
  payload: UpdateProductStockPayload,
): Promise<Product> {
  const data = await httpClient.patch<unknown>(
    `/api/products/${objectId}/stock`,
    normalizeStockPayload(payload),
  );
  return mapProductDto(data);
}

export async function updateProductNajaStock(
  objectId: string,
  payload: UpdateProductStockPayload,
): Promise<Product> {
  const data = await httpClient.patch<unknown>(
    `/api/products/${objectId}/naja-stock`,
    normalizeStockPayload(payload),
  );
  return mapProductDto(data);
}

export async function syncProductsFromSepidar(): Promise<SepidarProductSyncSummary> {
  const data = await httpClient.post<unknown>(
    "/api/integrations/sepidar/sync/items",
  );
  return mapSepidarProductSyncSummaryDto(data);
}

function normalizeProductPayload(
  payload: Partial<CreateProductPayload>,
): Record<string, unknown> {
  const totalStock =
    payload.totalStock !== undefined ? toNumber(payload.totalStock) : undefined;
  const salesStock =
    payload.salesStock !== undefined ? toNumber(payload.salesStock) : totalStock;

  return {
    ...payload,
    id: payload.id ? normalizeDigits(payload.id) : payload.id,
    unitPrice:
      payload.unitPrice !== undefined ? toNumber(payload.unitPrice) : undefined,
    totalStock,
    salesStock,
  };
}

function normalizeStockPayload(
  payload: UpdateProductStockPayload,
): Record<string, unknown> {
  const totalStock =
    payload.totalStock !== undefined ? toNumber(payload.totalStock) : undefined;
  const salesStock =
    payload.salesStock !== undefined ? toNumber(payload.salesStock) : totalStock;

  return {
    ...payload,
    amount: payload.amount !== undefined ? toNumber(payload.amount) : undefined,
    totalStock,
    salesStock,
  };
}

function buildProductsPath(viewerRole?: string): string {
  if (!viewerRole) return "/api/products";
  const params = new URLSearchParams({ viewerRole });
  return `/api/products?${params.toString()}`;
}

export async function deactivateProduct(objectId: string): Promise<Product> {
  const data = await httpClient.delete<unknown>(`/api/products/${objectId}`);
  return mapProductDto(data);
}
