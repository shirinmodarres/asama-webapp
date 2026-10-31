import { httpClient } from "@/lib/api/http-client";
import { mapCustomerListDto } from "@/lib/mappers/customer.mapper";
import { toArray, toRecord } from "@/lib/mappers/mapper-utils";
import type { Customer } from "@/lib/models/customer.model";

export type StoreCustomerAddressPayload = {
  title?: string;
  address: string;
  postalCode?: string;
  province?: string;
  city?: string;
  isMain: boolean;
};

export type StoreCustomerRegistrationPayload = {
  operationKey: string;
  customerType: "individual" | "legal";
  groupingRef: number;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  nationalId?: string;
  nationalIdentifier?: string;
  economicCode?: string;
  birthDate?: string;
  phone?: string;
  addresses: StoreCustomerAddressPayload[];
};

export type StoreCustomerRegistrationResult = {
  operationKey: string;
  status: "submitting" | "completed" | "pending_verification" | "failed";
  customerId: string | null;
  sepidarCustomerId: number | null;
  errorMessage: string | null;
  canReconcile: boolean;
};

export async function registerStoreCustomer(payload: StoreCustomerRegistrationPayload) {
  return httpClient.post<StoreCustomerRegistrationResult>("/api/store-expert/customers", payload);
}

export async function reconcileStoreCustomerRegistration(operationKey: string) {
  return httpClient.post<StoreCustomerRegistrationResult>(
    `/api/store-expert/customers/operations/${encodeURIComponent(operationKey)}/reconcile`,
  );
}

export async function listStoreExpertCustomers(filters: {
  search?: string;
  status?: string;
  limit: number;
  offset: number;
}, signal?: AbortSignal): Promise<{ items: Customer[]; total: number }> {
  const params = new URLSearchParams({ limit: String(filters.limit), offset: String(filters.offset) });
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  const data = await httpClient.get<unknown>(`/api/store-expert/customers?${params.toString()}`, { signal });
  const record = toRecord(data);
  const items = mapCustomerListDto(toArray(record.items));
  return { items, total: Number(record.total ?? items.length) };
}
