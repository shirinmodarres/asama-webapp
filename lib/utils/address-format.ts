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
      | "receiverFullName"
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

  const parts = [
    getAddressValue(address, "province"),
    getAddressValue(address, "county"),
    getAddressValue(address, "city"),
    getAddressValue(address, "fullAddress"),
    formatPlaqueUnit(address),
  ].filter(Boolean);

  return parts.length ? parts.join("، ") : "آدرس ثبت نشده است.";
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
  key: "province" | "county" | "city" | "fullAddress" | "plaque" | "unit",
): string {
  if (key === "province")
    return "province" in address
      ? address.province || ""
      : address.deliveryProvince || "";
  if (key === "county")
    return "county" in address
      ? address.county || ""
      : address.deliveryCounty || "";
  if (key === "city")
    return "city" in address ? address.city || "" : address.deliveryCity || "";
  if (key === "fullAddress")
    return "fullAddress" in address
      ? address.fullAddress || ""
      : address.deliveryFullAddress || "";
  if (key === "plaque")
    return "plaque" in address
      ? address.plaque || ""
      : address.deliveryPlaque || "";
  return "unit" in address ? address.unit || "" : address.deliveryUnit || "";
}
