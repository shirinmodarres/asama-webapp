import { httpClient } from "@/lib/api/http-client";
import {
  mapInternalInvoiceDto,
  mapInternalInvoiceListDto,
} from "@/lib/mappers/internal-invoice.mapper";
import type {
  InternalInvoice,
  MarkInternalInvoiceEnteredPayload,
} from "@/lib/models/internal-invoice.model";
import { normalizeDigits } from "@/lib/utils/number-format";

export async function listInternalInvoices(): Promise<InternalInvoice[]> {
  const data = await httpClient.get<unknown>(
    "/api/accounting/internal-invoices",
  );
  return mapInternalInvoiceListDto(data);
}

export async function getInternalInvoice(
  objectId: string,
): Promise<InternalInvoice> {
  const data = await httpClient.get<unknown>(
    `/api/accounting/internal-invoices/${objectId}`,
  );
  return mapInternalInvoiceDto(data);
}

export async function markInternalInvoiceEntered(
  objectId: string,
  payload: MarkInternalInvoiceEnteredPayload,
): Promise<InternalInvoice> {
  const data = await httpClient.patch<unknown>(
    `/api/accounting/internal-invoices/${objectId}/mark-entered`,
    {
      manualInvoiceNumber: normalizeDigits(payload.manualInvoiceNumber.trim()),
      accountantNote: payload.accountantNote?.trim() || undefined,
    },
  );
  return mapInternalInvoiceDto(data);
}
