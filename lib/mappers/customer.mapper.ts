import {
  toArray,
  toBooleanValue,
  toNullableString,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
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
    fullName: toStringValue(record.fullName),
    phone: normalizePhone(toStringValue(record.phone)),
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
