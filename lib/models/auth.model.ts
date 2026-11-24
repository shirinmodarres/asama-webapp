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
  activeRole: BackendRoleKey;
  activeRoleLabel: string;
  canSwitchRole: boolean;
  status: UserStatus;
  assignedCustomerCount?: number;
}

export interface LoginResponse {
  sessionToken: string;
  user: AuthUser;
}
