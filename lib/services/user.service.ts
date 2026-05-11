import { httpClient } from "@/lib/api/http-client";
import { mapAuthUserDto } from "@/lib/mappers/auth.mapper";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
} from "@/lib/models/user.model";
import { normalizePhone } from "@/lib/utils/number-format";

export async function listUsers(): Promise<User[]> {
  const data = await httpClient.get<unknown>("/api/users");
  return Array.isArray(data) ? data.map(mapAuthUserDto) : [];
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const data = await httpClient.post<unknown>("/api/users", {
    ...payload,
    phone: normalizePhone(payload.phone),
  });
  return mapAuthUserDto(data);
}

export async function getUser(objectId: string): Promise<User> {
  const users = await listUsers();
  const user = users.find((entry) => entry.objectId === objectId);
  if (!user) {
    throw new Error("کاربر مورد نظر یافت نشد.");
  }
  return user;
}

export async function updateUser(
  objectId: string,
  payload: UpdateUserPayload,
): Promise<User> {
  const data = await httpClient.put<unknown>(`/api/users/${objectId}`, {
    ...payload,
    phone: payload.phone ? normalizePhone(payload.phone) : payload.phone,
  });
  return mapAuthUserDto(data);
}
