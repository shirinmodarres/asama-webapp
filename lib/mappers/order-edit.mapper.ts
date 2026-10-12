import type {
  CreateOrderPayload,
  UpdatePendingOrderPayload,
} from "@/lib/models/order.model";
import { normalizeDigits, normalizePhone, toNumber } from "@/lib/utils/number-format";

export function normalizeOrderEditPayload(
  payload: UpdatePendingOrderPayload | CreateOrderPayload,
): Record<string, unknown> {
  const editPayload = payload as OrderEditPayloadInput;
  const items = Array.isArray(editPayload.items)
    ? editPayload.items.map((item) => {
        const editableItem = item as EditableOrderItemInput;
        return {
          productObjectId: editableItem.productObjectId?.trim() || undefined,
          productId: editableItem.productId?.trim() || undefined,
          quantity: toNumber(editableItem.quantity),
          unitPrice:
            editableItem.unitPrice === undefined || editableItem.unitPrice === null
              ? undefined
              : toNumber(editableItem.unitPrice),
          priceNoteItemId:
            editableItem.priceNoteItemId === undefined || editableItem.priceNoteItemId === null
              ? undefined
              : toNumber(editableItem.priceNoteItemId),
          priceListId: editableItem.priceListId?.trim() || undefined,
          priceListItemId: editableItem.priceListItemId?.trim() || undefined,
          pricingSource: editableItem.pricingSource?.trim() || undefined,
        };
      })
    : undefined;

  return stripUndefined({
    customerName: trimOrUndefined(editPayload.customerName),
    createdByName: trimOrUndefined(editPayload.createdByName),
    expertUserId: trimOrUndefined(editPayload.expertUserId),
    salesTypeObjectId: trimOrUndefined(
      editPayload.salesTypeObjectId ?? editPayload.saleTypeObjectId,
    ),
    salesTypeTitle: trimOrNull(
      (editPayload as { salesTypeTitle?: string | null }).salesTypeTitle,
    ),
    salesTypeInternalCode: numberOrUndefined(
      (editPayload as { salesTypeInternalCode?: number | null }).salesTypeInternalCode,
    ),
    salesTypeSepidarCode: numberOrUndefined(
      (editPayload as { salesTypeSepidarCode?: number | null }).salesTypeSepidarCode,
    ),
    customerObjectId: trimOrUndefined(editPayload.customerObjectId),
    customerAddressObjectId: trimOrUndefined(editPayload.customerAddressObjectId),
    customerAddressId: numberOrUndefined(editPayload.customerAddressId),
    selectedCustomerAddressId: numberOrUndefined(editPayload.selectedCustomerAddressId),
    customerAddressTitle: trimOrNull(editPayload.customerAddressTitle),
    customerAddressText: trimOrNull(editPayload.customerAddressText),
    customerAddressZipCode: editPayload.customerAddressZipCode
      ? normalizeDigits(String(editPayload.customerAddressZipCode).trim())
      : editPayload.customerAddressZipCode,
    customerAddressCityRef: numberOrUndefined(editPayload.customerAddressCityRef),
    customerAddressPathRef: numberOrUndefined(editPayload.customerAddressPathRef),
    customerAddressIsMain: editPayload.customerAddressIsMain,
    priceListId: trimOrUndefined(editPayload.priceListId),
    stockObjectId: trimOrUndefined(editPayload.stockObjectId),
    selectedStockObjectIds: Array.isArray(editPayload.selectedStockObjectIds)
      ? editPayload.selectedStockObjectIds.map((value) => String(value).trim()).filter(Boolean)
      : undefined,
    recipientFirstName: trimOrNull(editPayload.recipientFirstName),
    recipientLastName: trimOrNull(editPayload.recipientLastName),
    recipientNationalId: editPayload.recipientNationalId
      ? normalizeDigits(String(editPayload.recipientNationalId).trim())
      : editPayload.recipientNationalId,
    recipientMobile: editPayload.recipientMobile
      ? normalizePhone(String(editPayload.recipientMobile).trim())
      : editPayload.recipientMobile,
    najaOrderNumber: editPayload.najaOrderNumber
      ? normalizeDigits(String(editPayload.najaOrderNumber).trim())
      : editPayload.najaOrderNumber,
    najaPurchaseDate: trimOrNull(editPayload.najaPurchaseDate),
    sepidarQuotationDate: trimOrNull(editPayload.sepidarQuotationDate),
    notes: trimOrNull(editPayload.notes),
    items,
  });
}

type OrderEditPayloadInput = Partial<CreateOrderPayload> &
  Partial<UpdatePendingOrderPayload> & {
    customerAddressId?: number | string;
    selectedCustomerAddressId?: number | string;
    customerAddressTitle?: string | null;
    customerAddressText?: string | null;
    customerAddressZipCode?: string | null;
    customerAddressCityRef?: number | null;
    customerAddressPathRef?: number | null;
    customerAddressIsMain?: boolean;
    items?: Array<
      EditableOrderItemInput
    >;
  };

interface EditableOrderItemInput {
  productObjectId?: string;
  productId?: string;
  quantity: number;
  unitPrice?: number | null;
  priceNoteItemId?: number | null;
  priceListId?: string | null;
  priceListItemId?: string | null;
  pricingSource?: string | null;
}

function trimOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function trimOrNull(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text ? text : null;
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}
