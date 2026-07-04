import { Badge } from "@/components/ui/badge";
import {
  getOrderStatusLabel,
  getWarehouseStatusLabel,
  normalizeOrderStatus,
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
    const orderStatus = normalizeOrderStatus(status);
    if (orderStatus === "pending_approval") {
      return { label: getOrderStatusLabel(orderStatus), variant: "warning" as const };
    }
    if (orderStatus === "approved" || orderStatus === "completed") {
      return { label: getOrderStatusLabel(orderStatus), variant: "success" as const };
    }
    if (orderStatus === "cancelled" || orderStatus === "returned") {
      return { label: getOrderStatusLabel(orderStatus), variant: "destructive" as const };
    }
    if (orderStatus === "returnedAfterInvoice") {
      return { label: getOrderStatusLabel(orderStatus), variant: "warning" as const };
    }
    if (orderStatus === "invoiced") {
      return { label: getOrderStatusLabel(orderStatus), variant: "brand" as const };
    }
    return { label: getOrderStatusLabel(orderStatus) || orderStatus || "نامشخص", variant: "neutral" as const };
  }

  if (type === "warehouse") {
    if (status === "reserved") {
      return { label: getWarehouseStatusLabel(status), variant: "neutral" as const };
    }
    if (status === "reviewing" || status === "dispatchIssued") {
      return { label: getWarehouseStatusLabel(status), variant: "brand" as const };
    }
    if (status === "delivered" || status === "najaDetailsCompleted" || status === "completed") {
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
