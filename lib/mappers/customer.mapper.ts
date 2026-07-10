import {
  toArray,
  toBooleanValue,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import { mapSepidarStockDto } from "@/lib/mappers/stock.mapper";
import type {
  Customer,
  CustomerAddress,
  CustomerAddressStatus,
  CustomerStatus,
  ReceiverType,
} from "@/lib/models/customer.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: "فعال",
  inactive: "غیرفعال",
};

export function mapCustomerDto(dto: unknown): Customer {
  const record = toRecord(dto);
  const status = mapCustomerStatus(record.status);
  const addresses = toArray(record.addresses).map((address) =>
    mapCustomerAddressDto(address, record),
  );
  const defaultAddressRecord = record.defaultAddress ?? record.address;
  const defaultAddress =
    defaultAddressRecord === null || defaultAddressRecord === undefined
      ? addresses.find((address) => address.isDefault) ?? null
      : mapCustomerAddressDto(defaultAddressRecord, record);

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    sepidarCustomerId: toNullableString(
      record.sepidarCustomerId ?? record.sepidarId,
    ),
    sepidarCustomerCode: toNullableString(
      record.sepidarCustomerCode ?? record.sepidarCode ?? record.code,
    ),
    saleType: mapCustomerSaleType(record.saleType),
    priceListId: toNullableString(record.priceListId),
    priceListTitle: toNullableString(record.priceListTitle),
    priceListType: toNullableString(record.priceListType),
    priceListBrand: toNullableString(record.priceListBrand),
    allowedStockObjectIds: toArray(record.allowedStockObjectIds)
      .map(toStringValue)
      .filter(Boolean),
    allowedSepidarStockIds: toArray(record.allowedSepidarStockIds)
      .map(toNumberValue)
      .filter((value) => Number.isFinite(value)),
    allowedStocks: toArray(record.allowedStocks).map(mapSepidarStockDto),
    allowedStockTitles: toArray(record.allowedStockTitles)
      .map(toStringValue)
      .filter(Boolean),
    isSyncedFromSepidar:
      toBooleanValue(record.isSyncedFromSepidar ?? record.syncedFromSepidar) ||
      toStringValue(record.source).toLowerCase() === "sepidar",
    fullName: toStringValue(record.fullName ?? record.title ?? record.name),
    phone: normalizePhone(toStringValue(record.phone ?? record.mobile)),
    mobile: toNullableString(record.mobile)
      ? normalizePhone(toStringValue(record.mobile))
      : null,
    address: toNullableString(record.address),
    postalCode: toNullableString(record.postalCode)
      ? normalizeDigits(toStringValue(record.postalCode))
      : null,
    nationalId: record.nationalId
      ? normalizeDigits(toStringValue(record.nationalId))
      : null,
    assignedExpertName: toNullableString(record.assignedExpertName),
    status,
    statusLabel: toStringValue(record.statusLabel) || STATUS_LABELS[status],
    defaultAddress,
    addresses,
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

function mapCustomerSaleType(value: unknown): Customer["saleType"] {
  const record = toRecord(value);
  if (!Object.keys(record).length) return null;
  return {
    objectId: toNullableString(record.objectId),
    sepidarSaleTypeId:
      record.sepidarSaleTypeId === undefined || record.sepidarSaleTypeId === null
        ? null
        : toNumberValue(record.sepidarSaleTypeId),
    title: toNullableString(record.title),
  };
}

export function mapCustomerListDto(dto: unknown): Customer[] {
  return toArray(dto).map(mapCustomerDto);
}

export function mapCustomerAddressDto(
  dto: unknown,
  customerDto?: unknown,
): CustomerAddress {
  const record = toRecord(dto);
  const customerRecord = toRecord(customerDto);
  const status = mapAddressStatus(record.status);
  const receiverType = mapReceiverType(record.receiverType);
  const customerPhone = customerRecord.phone
    ? normalizePhone(toStringValue(customerRecord.phone))
    : null;

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    customerId: toStringValue(record.customerId),
    title: toStringValue(record.title),
    receiverType,
    receiverFullName:
      toStringValue(record.receiverFullName ?? record.receiverName) ||
      (receiverType === "self" ? toStringValue(customerRecord.fullName) : ""),
    receiverPhone: record.receiverPhone
      ? normalizePhone(toStringValue(record.receiverPhone))
      : receiverType === "self"
        ? customerPhone
        : null,
    province: toStringValue(record.province),
    city: toStringValue(record.city),
    county: toNullableString(record.county),
    fullAddress: toStringValue(record.fullAddress),
    postalCode: record.postalCode
      ? normalizeDigits(toStringValue(record.postalCode))
      : null,
    plaque: record.plaque ? normalizeDigits(toStringValue(record.plaque)) : null,
    unit: record.unit ? normalizeDigits(toStringValue(record.unit)) : null,
    isDefault: toBooleanValue(record.isDefault),
    status,
    statusLabel: toStringValue(record.statusLabel) || STATUS_LABELS[status],
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapCustomerAddressListDto(dto: unknown): CustomerAddress[] {
  return toArray(dto).map(mapCustomerAddressDto);
}

function mapCustomerStatus(value: unknown): CustomerStatus {
  return value === "inactive" ? "inactive" : "active";
}

function mapAddressStatus(value: unknown): CustomerAddressStatus {
  return value === "inactive" ? "inactive" : "active";
}

function mapReceiverType(value: unknown): ReceiverType {
  return value === "other" ? "other" : "self";
}
