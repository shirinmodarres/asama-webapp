import { httpClient } from "@/lib/api/http-client";
import { mapCustomerListDto } from "@/lib/mappers/customer.mapper";
import { toRecord } from "@/lib/mappers/mapper-utils";
import type { Customer } from "@/lib/models/customer.model";

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
