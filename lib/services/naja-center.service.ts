import { httpClient } from "@/lib/api/http-client";
import {
  mapNajaCenterDto,
  mapNajaCenterListDto,
} from "@/lib/mappers/naja-center.mapper";
import type {
  CreateNajaCenterPayload,
  NajaCenter,
  UpdateNajaCenterPayload,
} from "@/lib/models/naja-center.model";

export async function listNajaCenters(): Promise<NajaCenter[]> {
  const data = await httpClient.get<unknown>("/api/naja/centers");
  return mapNajaCenterListDto(data);
}

export async function getNajaCenter(objectId: string): Promise<NajaCenter> {
  const data = await httpClient.get<unknown>(`/api/naja/centers/${objectId}`);
  return mapNajaCenterDto(data);
}

export async function createNajaCenter(
  payload: CreateNajaCenterPayload,
): Promise<NajaCenter> {
  const data = await httpClient.post<unknown>("/api/naja/centers", payload);
  return mapNajaCenterDto(data);
}

export async function updateNajaCenter(
  objectId: string,
  payload: UpdateNajaCenterPayload,
): Promise<NajaCenter> {
  const data = await httpClient.put<unknown>(
    `/api/naja/centers/${objectId}`,
    payload,
  );
  return mapNajaCenterDto(data);
}

export async function deleteNajaCenter(objectId: string): Promise<void> {
  await httpClient.delete<unknown>(`/api/naja/centers/${objectId}`);
}
