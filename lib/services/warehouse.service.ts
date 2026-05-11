import { httpClient } from "@/lib/api/http-client";
import {
  mapExitSlipDto,
  mapExitSlipListDto,
} from "@/lib/mappers/warehouse.mapper";
import type {
  CreateExitSlipPayload,
  ExitSlip,
} from "@/lib/models/warehouse.model";

export async function listExitSlips(): Promise<ExitSlip[]> {
  const data = await httpClient.get<unknown>("/api/exit-slips");
  return mapExitSlipListDto(data);
}

export async function getExitSlip(objectId: string): Promise<ExitSlip> {
  const data = await httpClient.get<unknown>(`/api/exit-slips/${objectId}`);
  return mapExitSlipDto(data);
}

export async function createExitSlip(
  orderObjectId: string,
  payload: CreateExitSlipPayload,
): Promise<ExitSlip> {
  const data = await httpClient.post<unknown>(
    `/api/orders/${orderObjectId}/exit-slip`,
    payload,
  );
  return mapExitSlipDto(data);
}

export async function confirmDelivery(
  exitSlipObjectId: string,
): Promise<ExitSlip> {
  const data = await httpClient.post<unknown>(
    `/api/exit-slips/${exitSlipObjectId}/confirm-delivery`,
  );
  return mapExitSlipDto(data);
}
