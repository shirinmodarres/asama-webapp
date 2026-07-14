import { httpClient } from "@/lib/api/http-client";
import {
  mapCustomerAddressDto,
  mapCustomerAddressListDto,
  mapCustomerDto,
  mapCustomerListDto,
} from "@/lib/mappers/customer.mapper";
import type {
  Customer,
  CustomerAddress,
  CustomerAddressPayload,
  CustomerFilters,
  CustomerPayload,
} from "@/lib/models/customer.model";
import {
  normalizeDigits,
  normalizePhone,
} from "@/lib/utils/number-format";

export async function listCustomers(
  filters?: CustomerFilters,
): Promise<Customer[]> {
  const data = await httpClient.get<unknown>(buildCustomersPath(filters));
  const record = isRecord(data) ? data : null;
  const items = Array.isArray(data)
    ? data
    : Array.isArray(record?.items)
      ? record?.items
      : Array.isArray(record?.customers)
        ? record?.customers
        : [];
  return mapCustomerListDto(items);
}

export async function getCustomer(objectId: string): Promise<Customer> {
  const data = await httpClient.get<unknown>(`/api/customers/${objectId}`);
  return mapCustomerDto(data);
}

export async function createCustomer(
  payload: CustomerPayload,
): Promise<Customer> {
  const data = await httpClient.post<unknown>(
    "/api/customers",
    normalizeCustomerPayload(payload),
  );
  return mapCustomerDto(data);
}

export async function updateCustomer(
  objectId: string,
  payload: Partial<CustomerPayload>,
): Promise<Customer> {
  const data = await httpClient.put<unknown>(
    `/api/customers/${objectId}`,
    normalizeCustomerPayload(payload),
  );
  return mapCustomerDto(data);
}

export async function deactivateCustomer(objectId: string): Promise<Customer> {
  const data = await httpClient.delete<unknown>(`/api/customers/${objectId}`);
  return mapCustomerDto(data);
}

export async function listCustomerAddresses(
  customerId: string,
): Promise<CustomerAddress[]> {
  const data = await httpClient.get<unknown>(
    `/api/customers/${customerId}/addresses`,
  );
  return mapCustomerAddressListDto(data);
}

export async function createCustomerAddress(
  customerId: string,
  payload: CustomerAddressPayload,
): Promise<CustomerAddress> {
  const data = await httpClient.post<unknown>(
    `/api/customers/${customerId}/addresses`,
    normalizeAddressPayload(payload),
  );
  return mapCustomerAddressDto(data);
}

export async function updateCustomerAddress(
  addressId: string,
  payload: Partial<CustomerAddressPayload>,
): Promise<CustomerAddress> {
  const data = await httpClient.put<unknown>(
    `/api/customer-addresses/${addressId}`,
    normalizeAddressPayload(payload),
  );
  return mapCustomerAddressDto(data);
}

export async function deleteCustomerAddress(
  addressId: string,
): Promise<CustomerAddress> {
  const data = await httpClient.delete<unknown>(
    `/api/customer-addresses/${addressId}`,
  );
  return mapCustomerAddressDto(data);
}

function buildCustomersPath(filters?: CustomerFilters): string {
  if (!filters) return "/api/customers";

  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (typeof filters.limit === "number") params.set("limit", String(filters.limit));
  if (typeof filters.offset === "number") params.set("offset", String(filters.offset));

  const query = params.toString();
  return query ? `/api/customers?${query}` : "/api/customers";
}

function normalizeCustomerPayload(
  payload: Partial<CustomerPayload>,
): Record<string, unknown> {
  return {
    fullName: payload.fullName,
    phone: payload.phone ? normalizePhone(payload.phone) : payload.phone,
    nationalId: payload.nationalId
      ? normalizeDigits(payload.nationalId)
      : payload.nationalId,
    status: payload.status,
    defaultAddress: payload.defaultAddress
      ? normalizeAddressPayload(payload.defaultAddress)
      : payload.defaultAddress,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeAddressPayload(
  payload: Partial<CustomerAddressPayload>,
): Record<string, unknown> {
  return {
    title: payload.title,
    receiverType: payload.receiverType,
    receiverFullName: payload.receiverFullName,
    receiverPhone: payload.receiverPhone
      ? normalizePhone(payload.receiverPhone)
      : payload.receiverPhone,
    province: payload.province,
    city: payload.city,
    county: payload.county,
    fullAddress: payload.fullAddress,
    postalCode: payload.postalCode
      ? normalizeDigits(payload.postalCode)
      : payload.postalCode,
    plaque: payload.plaque,
    unit: payload.unit,
    isDefault: payload.isDefault,
  };
}
