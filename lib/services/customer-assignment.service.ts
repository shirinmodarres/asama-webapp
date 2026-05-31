import { httpClient } from "@/lib/api/http-client";
import { mapAuthUserDto } from "@/lib/mappers/auth.mapper";
import {
  mapExpertCustomerAssignmentDto,
  mapExpertCustomerAssignmentListDto,
  mapSepidarSaleTypeListDto,
  mapSepidarCustomerSyncSummaryDto,
} from "@/lib/mappers/customer-assignment.mapper";
import { mapCustomerListDto } from "@/lib/mappers/customer.mapper";
import { toRecord } from "@/lib/mappers/mapper-utils";
import type { AuthUser } from "@/lib/models/auth.model";
import type {
  CreateExpertCustomerAssignmentPayload,
  ExpertCustomerAssignment,
  SepidarSaleType,
  SepidarCustomerSyncSummary,
} from "@/lib/models/customer-assignment.model";
import type { Customer } from "@/lib/models/customer.model";

export async function listSupportExperts(): Promise<AuthUser[]> {
  const data = await httpClient.get<unknown>("/api/support/experts");
  const record = toRecord(data);
  const source = Array.isArray(data)
    ? data
    : Array.isArray(record.items)
      ? record.items
      : [];
  return source.map(mapAuthUserDto);
}

export async function listSepidarCustomers(): Promise<Customer[]> {
  const data = await httpClient.get<unknown>(
    "/api/integrations/sepidar/customers",
  );
  const record = toRecord(data);
  return mapCustomerListDto(
    Array.isArray(data) ? data : record.items ?? record.customers ?? [],
  );
}

export async function listExpertCustomerAssignments(): Promise<
  ExpertCustomerAssignment[]
> {
  const data = await httpClient.get<unknown>(
    "/api/support/expert-customer-assignments",
  );
  return mapExpertCustomerAssignmentListDto(data);
}

export async function createExpertCustomerAssignment(
  payload: CreateExpertCustomerAssignmentPayload,
): Promise<ExpertCustomerAssignment> {
  const data = await httpClient.post<unknown>(
    "/api/support/expert-customer-assignments",
    payload,
  );
  return mapExpertCustomerAssignmentDto(data);
}

export async function deactivateExpertCustomerAssignment(
  objectId: string,
): Promise<ExpertCustomerAssignment> {
  const data = await httpClient.patch<unknown>(
    `/api/support/expert-customer-assignments/${objectId}/deactivate`,
  );
  return mapExpertCustomerAssignmentDto(data);
}

export async function listSepidarSaleTypes(): Promise<SepidarSaleType[]> {
  const data = await httpClient.get<unknown>(
    "/api/integrations/sepidar/sale-types",
  );
  return mapSepidarSaleTypeListDto(data);
}

export async function syncSaleTypesFromSepidar(): Promise<SepidarCustomerSyncSummary> {
  const data = await httpClient.post<unknown>(
    "/api/integrations/sepidar/sync/sale-types",
  );
  return mapSepidarCustomerSyncSummaryDto(data);
}

export async function syncCustomersFromSepidar(): Promise<SepidarCustomerSyncSummary> {
  const data = await httpClient.post<unknown>(
    "/api/integrations/sepidar/sync/customers",
  );
  return mapSepidarCustomerSyncSummaryDto(data);
}

export async function listAssignedCustomersForExpert(
  expertUserId?: string,
): Promise<Customer[]> {
  const params = expertUserId
    ? `?${new URLSearchParams({ expertUserId }).toString()}`
    : "";
  const data = await httpClient.get<unknown>(
    `/api/expert/assigned-customers${params}`,
  );
  const record = toRecord(data);
  return mapCustomerListDto(
    Array.isArray(data) ? data : record.items ?? record.customers ?? [],
  );
}
