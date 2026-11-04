import type { Customer, CustomerAddress } from "@/lib/models/customer.model";
import type { Order } from "@/lib/models/order.model";
import { formatFaDigits } from "@/lib/utils/number-format";

type CustomerLike = Pick<Customer, "fullName"> | null | undefined;

type AddressLike =
  | Pick<
      CustomerAddress,
      | "title"
      | "receiverType"
      | "receiverFullName"
      | "province"
      | "city"
      | "county"
      | "fullAddress"
      | "plaque"
      | "unit"
    >
  | Pick<
      Order,
      | "deliveryAddressTitle"
      | "deliveryProvince"
      | "deliveryCity"
      | "deliveryCounty"
      | "deliveryFullAddress"
      | "deliveryPlaque"
      | "deliveryUnit"
      | "customerAddressTitle"
      | "customerAddressText"
      | "customerAddress"
      | "receiverFullName"
      | "customerAddressText"
      | "selectedCustomerAddressText"
    >
  | null
  | undefined;

export function getReceiverName(
  address:
    | Pick<CustomerAddress, "receiverType" | "receiverFullName">
    | null
    | undefined,
  customer: CustomerLike,
): string {
  if (!address) return customer?.fullName || "";
  if (address.receiverType === "self")
    return customer?.fullName || address.receiverFullName || "";
  return address.receiverFullName || "";
}

export function formatDeliveryAddress(address: AddressLike): string {
  if (!address) return "آدرس ثبت نشده است.";

  const fullAddress = getAddressValue(address, "fullAddress");
  const parts = fullAddress
    ? [
        fullAddress,
        getAddressPostalCode(address),
        formatPlaqueUnit(address),
      ].filter(Boolean)
    : [
        getAddressValue(address, "addressText"),
        getAddressValue(address, "province"),
        getAddressValue(address, "county"),
        getAddressValue(address, "city"),
        getAddressPostalCode(address),
        formatPlaqueUnit(address),
      ].filter(Boolean);

  return parts.length
    ? [...new Set(parts)].join("، ")
    : "آدرس ثبت نشده است.";
}

export function formatPlaqueUnit(address: AddressLike): string {
  if (!address) return "";

  const plaque = getAddressValue(address, "plaque");
  const unit = getAddressValue(address, "unit");
  const parts = [];

  if (plaque) parts.push(`پلاک ${formatFaDigits(plaque)}`);
  if (unit) parts.push(`واحد ${formatFaDigits(unit)}`);

  return parts.join("، ");
}

function getAddressValue(
  address: NonNullable<AddressLike>,
  key:
    | "addressText"
    | "province"
    | "county"
    | "city"
    | "fullAddress"
    | "plaque"
    | "unit",
): string {
  if (key === "addressText")
    return "customerAddressText" in address
      ? address.customerAddressText || address.selectedCustomerAddressText || ""
      : "";
  const source = address as
    | {
        province?: string | null;
        county?: string | null;
        city?: string | null;
        fullAddress?: string | null;
        customerAddressText?: string | null;
        customerAddress?: string | null;
        plaque?: string | number | null;
        unit?: string | number | null;
        deliveryProvince?: string | null;
        deliveryCounty?: string | null;
        deliveryCity?: string | null;
        deliveryFullAddress?: string | null;
        deliveryPlaque?: string | number | null;
        deliveryUnit?: string | number | null;
      }
    | undefined;
  if (key === "province")
    return source?.province || source?.deliveryProvince || "";
  if (key === "county")
    return source?.county || source?.deliveryCounty || "";
  if (key === "city")
    return source?.city || source?.deliveryCity || "";
  if (key === "fullAddress")
    return (
      source?.fullAddress ||
      source?.customerAddressText ||
      source?.customerAddress ||
      source?.deliveryFullAddress ||
      ""
    );
  if (key === "plaque")
    return String(source?.plaque || source?.deliveryPlaque || "");
  return String(source?.unit || source?.deliveryUnit || "");
}

function getAddressPostalCode(address: NonNullable<AddressLike>): string {
  return "";
}
