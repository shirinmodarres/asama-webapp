import type { BackendRoleKey } from "@/lib/domain/roles";
import type { AuthUser, UserStatus } from "@/lib/models/auth.model";

export type User = AuthUser;

export interface CreateUserPayload {
  fullName: string;
  phone: string;
  password: string;
  role: BackendRoleKey;
  status: UserStatus;
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  password?: string;
  role?: BackendRoleKey;
  status?: UserStatus;
}
