import { httpClient } from "@/lib/api/http-client";
import {
  mapExpertPriceListAssignmentDto,
  mapList,
  mapPriceListDto,
  mapPriceListItemDto,
  mapPricingBrandDto,
  mapPricingReferenceDto,
  mapSepidarPriceListDto,
} from "@/lib/mappers/pricing.mapper";
import type {
  ExpertPriceListAssignment,
  PriceList,
  PriceListItem,
  PricingBrand,
  PricingReference,
  SepidarPriceList,
} from "@/lib/models/pricing.model";

export async function listSepidarPricingLists(): Promise<SepidarPriceList[]> {
  const data = await httpClient.get<unknown>("/api/pricing/sepidar-price-lists");
  return mapList(data, mapSepidarPriceListDto);
}

export async function listSepidarSaleTypeCandidates(): Promise<SepidarPriceList[]> {
  const data = await httpClient.get<unknown>("/api/pricing/sepidar-sale-types");
  return mapList(data, mapSepidarPriceListDto);
}

export async function listPricingBrands(): Promise<PricingBrand[]> {
  const data = await httpClient.get<unknown>("/api/pricing/brands");
  return mapList(data, mapPricingBrandDto);
}

export async function listPricingReferences(): Promise<PricingReference[]> {
  const data = await httpClient.get<unknown>("/api/pricing/references");
  return mapList(data, mapPricingReferenceDto);
}

export async function createPricingReference(payload: {
  brandName: string;
  sourceSaleTypeObjectId: string;
  internalCode: string;
  displayName: string;
  notes?: string;
}): Promise<PricingReference> {
  const data = await httpClient.post<unknown>("/api/pricing/references", payload);
  return mapPricingReferenceDto(data);
}

export async function deactivatePricingReference(referenceId: string): Promise<PricingReference> {
  const data = await httpClient.post<unknown>(
    `/api/pricing/references/${referenceId}/deactivate`,
  );
  return mapPricingReferenceDto(data);
}

export async function generatePriceLists(referenceId: string): Promise<PriceList[]> {
  const data = await httpClient.post<unknown>(
    `/api/pricing/references/${referenceId}/generate`,
  );
  return mapList(data, mapPriceListDto);
}

export async function listGeneratedPriceLists(params?: {
  activeOnly?: boolean;
}): Promise<PriceList[]> {
  const path = params?.activeOnly
    ? "/api/pricing/generated-price-lists/active"
    : "/api/pricing/generated-price-lists";
  const data = await httpClient.get<unknown>(path);
  return mapList(data, mapPriceListDto);
}

export async function getGeneratedPriceList(objectId: string): Promise<PriceList> {
  const data = await httpClient.get<unknown>(
    `/api/pricing/generated-price-lists/${objectId}`,
  );
  return mapPriceListDto(data);
}

export async function listGeneratedPriceListItems(
  objectId: string,
): Promise<PriceListItem[]> {
  const data = await httpClient.get<unknown>(
    `/api/pricing/generated-price-lists/${objectId}/items?limit=10000`,
  );
  return mapList(data, mapPriceListItemDto);
}

export async function listExpertPriceAssignments(): Promise<ExpertPriceListAssignment[]> {
  const data = await httpClient.get<unknown>("/api/pricing/expert-assignments");
  return mapList(data, mapExpertPriceListAssignmentDto);
}

export async function saveExpertPriceAssignment(payload: {
  expertUserId: string;
  priceListIds: string[];
}): Promise<ExpertPriceListAssignment> {
  const data = await httpClient.post<unknown>(
    "/api/pricing/expert-assignments",
    payload,
  );
  return mapExpertPriceListAssignmentDto(data);
}
