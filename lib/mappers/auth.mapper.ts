import { getRoleLabel } from "@/lib/domain/roles";
import type { AuthUser } from "@/lib/models/auth.model";
import { toRecord, toStringValue } from "@/lib/mappers/mapper-utils";

export function mapAuthUserDto(dto: unknown): AuthUser {
  const record = toRecord(dto);
  const role = toStringValue(record.role) as AuthUser["role"];

  return {
    objectId: toStringValue(record.objectId),
    fullName: toStringValue(record.fullName),
    phone: toStringValue(record.phone),
    role,
    roleLabel: toStringValue(record.roleLabel) || getRoleLabel(role),
    status: record.status === "inactive" ? "inactive" : "active",
  };
}
