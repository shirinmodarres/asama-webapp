import { Badge } from "@/components/ui/badge";
import {
  getOrderStatusLabel,
  getWarehouseStatusLabel,
} from "@/lib/domain/statuses";

type BadgeType = "order" | "warehouse" | "inventory";
type InventoryStatus = "normal" | "warning" | "critical";

interface StatusBadgeProps {
  type: BadgeType;
  status: string;
}

export function StatusBadge({ type, status }: StatusBadgeProps) {
  const { label, variant } = getBadgeConfig(type, status);

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}

function getBadgeConfig(type: BadgeType, status: string) {
  if (type === "order") {
    if (status === "pending") {
      return { label: getOrderStatusLabel(status), variant: "warning" as const };
    }
    if (status === "approved") {
      return { label: getOrderStatusLabel(status), variant: "success" as const };
    }
    if (status === "cancelled" || status === "returned") {
      return { label: getOrderStatusLabel(status), variant: "destructive" as const };
    }
    if (status === "returnedAfterInvoice") {
      return { label: getOrderStatusLabel(status), variant: "warning" as const };
    }
    if (status === "invoiced") {
      return { label: getOrderStatusLabel(status), variant: "brand" as const };
    }
    return { label: status || "نامشخص", variant: "neutral" as const };
  }

  if (type === "warehouse") {
    if (status === "reserved") {
      return { label: getWarehouseStatusLabel(status), variant: "neutral" as const };
    }
    if (status === "reviewing" || status === "dispatchIssued") {
      return { label: getWarehouseStatusLabel(status), variant: "brand" as const };
    }
    if (status === "delivered" || status === "najaDetailsCompleted") {
      return { label: getWarehouseStatusLabel(status), variant: "success" as const };
    }
    if (status === "awaitingNajaDetails" || status === "returnedFromWarehouse") {
      return { label: getWarehouseStatusLabel(status), variant: "warning" as const };
    }
    if (status === "returnedToInventory") {
      return { label: getWarehouseStatusLabel(status), variant: "destructive" as const };
    }
    return { label: getWarehouseStatusLabel(status) || status || "نامشخص", variant: "neutral" as const };
  }

  const inventoryStatus = status as InventoryStatus;
  if (inventoryStatus === "critical") {
    return { label: "بحرانی", variant: "destructive" as const };
  }
  if (inventoryStatus === "warning") {
    return { label: "کم", variant: "warning" as const };
  }

  return { label: "مناسب", variant: "success" as const };
}
