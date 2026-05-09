import type { AuthUser, LoginResponse } from "@/lib/models/auth.model";
import {
  clearStoredSession as clearSessionStorage,
  getStoredCurrentUser as getCurrentUserFromStorage,
  getStoredSessionToken as getSessionTokenFromStorage,
  persistSession as persistSessionStorage,
} from "@/lib/auth/storage";
import { httpClient } from "@/lib/api/http-client";
import { mapAuthUserDto } from "@/lib/mappers/auth.mapper";

interface BootstrapSupportPayload {
  fullName: string;
  phone: string;
  password: string;
}

export async function bootstrapSupport(
  payload: BootstrapSupportPayload,
): Promise<AuthUser> {
  const data = await httpClient.post<unknown>(
    "/api/auth/bootstrap-support",
    payload,
  );
  return mapAuthUserDto(data);
}

export async function login(
  phone: string,
  password: string,
): Promise<LoginResponse> {
  const data = await httpClient.post<unknown>("/api/auth/login", {
    phone,
    password,
  });
  const response = mapLoginResponse(data);
  persistSessionStorage(response);
  return response;
}

export async function me(): Promise<LoginResponse> {
  const data = await httpClient.get<unknown>("/api/auth/me");
  const response = mapLoginResponse(data);
  persistSessionStorage(response);
  return response;
}

export async function logout(): Promise<void> {
  try {
    await httpClient.post<unknown>("/api/auth/logout");
  } finally {
    clearSessionStorage();
  }
}

export function getStoredSessionToken(): string {
  return getSessionTokenFromStorage();
}

export function getStoredCurrentUser(): AuthUser | null {
  return getCurrentUserFromStorage();
}

export function persistSession(session: LoginResponse): void {
  persistSessionStorage(session);
}

export function clearStoredSession(): void {
  clearSessionStorage();
}

function mapLoginResponse(dto: unknown): LoginResponse {
  const record =
    typeof dto === "object" && dto ? (dto as Record<string, unknown>) : {};

  return {
    sessionToken:
      typeof record.sessionToken === "string" ? record.sessionToken : "",
    user: mapAuthUserDto(record.user),
  };
}
