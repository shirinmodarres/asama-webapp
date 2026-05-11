import { toNumber } from "@/lib/utils/number-format";

export type DtoRecord = Record<string, unknown>;

export function toRecord(value: unknown): DtoRecord {
  return value && typeof value === "object" ? (value as DtoRecord) : {};
}

export function toStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

export function toNullableString(value: unknown): string | null {
  const text = toStringValue(value).trim();
  return text ? text : null;
}

export function toNumberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) return toNumber(value);
  return 0;
}

export function toBooleanValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
}

export function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
