import { httpClient } from "@/lib/api/http-client";
import { ApiError } from "@/lib/api/api-error";
import {
  mapProductDto,
  mapProductListDto,
} from "@/lib/mappers/product.mapper";
import type {
  CreateProductPayload,
  Product,
  UpdateProductPayload,
  UpdateProductStockPayload,
} from "@/lib/models/product.model";
import {
  normalizeDigits,
  toNumber,
} from "@/lib/utils/number-format";

export async function listProducts(): Promise<Product[]> {
  const data = await httpClient.get<unknown>("/api/products");
  return mapProductListDto(data);
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

function normalizeProductPayload(
  payload: Partial<CreateProductPayload>,
): Record<string, unknown> {
  return {
    ...payload,
    id: payload.id ? normalizeDigits(payload.id) : payload.id,
    unitPrice:
      payload.unitPrice !== undefined ? toNumber(payload.unitPrice) : undefined,
    totalStock:
      payload.totalStock !== undefined ? toNumber(payload.totalStock) : undefined,
  };
}

function normalizeStockPayload(
  payload: UpdateProductStockPayload,
): Record<string, unknown> {
  return {
    ...payload,
    amount: payload.amount !== undefined ? toNumber(payload.amount) : undefined,
    totalStock:
      payload.totalStock !== undefined ? toNumber(payload.totalStock) : undefined,
  };
}

export async function deactivateProduct(objectId: string): Promise<Product> {
  const data = await httpClient.delete<unknown>(`/api/products/${objectId}`);
  return mapProductDto(data);
}
