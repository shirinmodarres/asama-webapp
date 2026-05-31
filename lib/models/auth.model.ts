import type { BackendRoleKey } from "@/lib/domain/roles";

export type UserStatus = "active" | "inactive";

export interface AuthUser {
  objectId: string;
  fullName: string;
  name?: string;
  mobile?: string;
  username?: string;
  phone: string;
  role: BackendRoleKey;
  roleLabel: string;
  status: UserStatus;
}

export interface LoginResponse {
  sessionToken: string;
  user: AuthUser;
}
