import type {
  ExitSlip,
  ExitSlipPdfData,
} from "@/lib/models/warehouse.model";

export interface ResolvedExitSlipCustomer {
  name: string | null;
  sepidarCustomerCode: string | null;
  phone: string | null;
  address: string | null;
}

export interface ResolvedExitSlipRecipient {
  fullName: string | null;
  nationalId: string | null;
  mobile: string | null;
  najaOrderNumber: string | null;
}

export function resolveExitSlipCustomer(
  slip: ExitSlip,
): ResolvedExitSlipCustomer {
  const order = slip.order;
  return {
    name: order?.customerName || slip.customerName,
    sepidarCustomerCode:
      order?.sepidarCustomerCode || slip.sepidarCustomerCode,
    phone:
      order?.customerMobile ||
      order?.customerPhone ||
      slip.customerMobile ||
      slip.customerPhone,
    address:
      order?.customerAddress ||
      order?.deliveryFullAddress ||
      slip.customerAddress ||
      slip.deliveryAddress ||
      slip.deliveryFullAddress,
  };
}

export function resolveExitSlipRecipient(
  slip: ExitSlip,
): ResolvedExitSlipRecipient {
  const order = slip.order;
  return {
    fullName:
      joinName(order?.recipientFirstName, order?.recipientLastName) ||
      joinName(slip.recipientFirstName, slip.recipientLastName),
    nationalId: order?.recipientNationalId || slip.recipientNationalId,
    mobile: order?.recipientMobile || slip.recipientMobile,
    najaOrderNumber: order?.najaOrderNumber || slip.najaOrderNumber,
  };
}

export function resolveExitSlipPdfCustomer(
  data: ExitSlipPdfData,
): ResolvedExitSlipCustomer {
  const order = data.order;
  return {
    name: order?.customerName || data.customer.name,
    sepidarCustomerCode:
      order?.sepidarCustomerCode || data.customer.sepidarCustomerCode,
    phone:
      order?.customerMobile ||
      order?.customerPhone ||
      data.customer.mobile ||
      data.customer.phone,
    address:
      order?.customerAddress ||
      order?.deliveryFullAddress ||
      data.customer.address ||
      data.deliveryAddress.formatted ||
      data.deliveryAddress.fullAddress,
  };
}

export function resolveExitSlipPdfRecipient(
  data: ExitSlipPdfData,
): ResolvedExitSlipRecipient {
  const order = data.order;
  return {
    fullName:
      joinName(order?.recipientFirstName, order?.recipientLastName) ||
      joinName(data.recipient.firstName, data.recipient.lastName),
    nationalId: order?.recipientNationalId || data.recipient.nationalId,
    mobile: order?.recipientMobile || data.recipient.mobile,
    najaOrderNumber:
      order?.najaOrderNumber || data.recipient.najaOrderNumber,
  };
}

export function isNajaExitSlip(
  orderType: string | null | undefined,
  recipient: ResolvedExitSlipRecipient,
): boolean {
  return (
    orderType === "naja" ||
    Boolean(
      recipient.fullName ||
        recipient.nationalId ||
        recipient.mobile ||
        recipient.najaOrderNumber,
    )
  );
}

function joinName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string | null {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || null;
}
