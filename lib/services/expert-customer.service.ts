import { httpClient } from "@/lib/api/http-client";
import { mapCustomerListDto } from "@/lib/mappers/customer.mapper";
import { toArray, toRecord } from "@/lib/mappers/mapper-utils";
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
    (Array.isArray(data)
      ? data
      : toArray(record.items ?? record.customers ?? record.assignments)
    ).map(normalizeAssignedCustomerDto),
  );
}

function normalizeAssignedCustomerDto(dto: unknown): Record<string, unknown> {
  const record = toRecord(dto);
  const customerRecord = toRecord(record.customer);
  const source = Object.keys(customerRecord).length ? customerRecord : record;

  return {
    ...source,
    objectId:
      record.customerObjectId ??
      record.customerId ??
      customerRecord.objectId ??
      source.objectId,
    saleType: record.saleType ?? customerRecord.saleType,
    assignedExpertName:
      record.assignedExpertName ??
      record.expertName ??
      customerRecord.assignedExpertName,
    sepidarCustomerCode:
      record.sepidarCustomerCode ??
      customerRecord.sepidarCustomerCode ??
      customerRecord.sepidarCode ??
      customerRecord.code,
    fullName:
      record.customerName ??
      customerRecord.fullName ??
      customerRecord.title ??
      customerRecord.name ??
      source.fullName,
    phone:
      record.customerPhone ??
      customerRecord.phone ??
      customerRecord.mobile ??
      source.phone,
  };
}
