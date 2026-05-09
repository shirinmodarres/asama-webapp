import { StatusBadge } from "@/components/shared/status-badge";

export function WarehouseStatusBadge({ status }: { status: string }) {
  return <StatusBadge type="warehouse" status={status} />;
}
