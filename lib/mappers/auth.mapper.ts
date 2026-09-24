import { getRoleLabel } from "@/lib/domain/roles";
import type { AuthUser } from "@/lib/models/auth.model";
import { toRecord, toStringValue } from "@/lib/mappers/mapper-utils";
import { normalizePhone } from "@/lib/utils/number-format";

export function mapAuthUserDto(dto: unknown): AuthUser {
  const record = toRecord(dto);
  const role = toStringValue(record.role) as AuthUser["role"];
  const activeRole = (toStringValue(record.activeRole) || role) as AuthUser["activeRole"];

  return {
    objectId: toStringValue(record.objectId),
    fullName: toStringValue(record.fullName ?? record.name),
    name: toStringValue(record.name) || undefined,
    mobile: normalizePhone(toStringValue(record.mobile ?? record.phone)) || undefined,
    username: toStringValue(record.username) || undefined,
    phone: normalizePhone(toStringValue(record.phone ?? record.mobile)),
    role,
    roleLabel: toStringValue(record.roleLabel) || getRoleLabel(role),
    activeRole,
    activeRoleLabel:
      toStringValue(record.activeRoleLabel) || getRoleLabel(activeRole),
    canSwitchRole: Boolean(record.canSwitchRole) || role === "god",
    status: record.status === "inactive" ? "inactive" : "active",
  };
}
