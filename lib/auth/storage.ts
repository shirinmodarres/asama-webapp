import type { AuthUser, LoginResponse } from "@/lib/models/auth.model";
import { mapAuthUserDto } from "@/lib/mappers/auth.mapper";

const SESSION_TOKEN_KEY = "sessionToken";
const CURRENT_USER_KEY = "currentUser";

export function getStoredSessionToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SESSION_TOKEN_KEY) ?? "";
}

export function getStoredCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!rawValue) return null;

  try {
    return mapAuthUserDto(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

export function persistSession(session: LoginResponse): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_TOKEN_KEY, session.sessionToken);
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session.user));
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_TOKEN_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
}
