import { httpClient } from "@/lib/api/http-client";
import { ApiError } from "@/lib/api/api-error";
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

export async function getAssignedCustomerForExpert(
  customerObjectId: string,
  expertUserId?: string,
): Promise<Customer> {
  const customers = await listAssignedCustomersForExpert(expertUserId);
  const customer = customers.find(
    (entry) => entry.objectId === customerObjectId,
  );
  if (!customer) {
    throw new ApiError({
      code: "ASSIGNMENT_NOT_FOUND",
      message: "برای این مشتری تنظیمات فروش تعریف نشده است.",
      status: 404,
    });
  }
  return customer;
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
    priceListId: record.priceListId ?? customerRecord.priceListId,
    priceListIds: record.priceListIds ?? customerRecord.priceListIds,
    priceListTitle: record.priceListTitle ?? customerRecord.priceListTitle,
    priceListType: record.priceListType ?? customerRecord.priceListType,
    priceListBrand: record.priceListBrand ?? customerRecord.priceListBrand,
    priceLists: record.priceLists ?? customerRecord.priceLists,
    allowedStockObjectIds:
      record.allowedStockObjectIds ?? customerRecord.allowedStockObjectIds,
    allowedSepidarStockIds:
      record.allowedSepidarStockIds ?? customerRecord.allowedSepidarStockIds,
    allowedStocks: record.allowedStocks ?? customerRecord.allowedStocks,
    allowedStockTitles:
      record.allowedStockTitles ?? customerRecord.allowedStockTitles,
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
