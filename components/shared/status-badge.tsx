import { orderStatusLabel, warehouseStatusLabel } from "@/lib/expert/mock-data";
import type { OrderStatus, WarehouseStatus } from "@/lib/expert/types";
import { Badge } from "@/components/ui/badge";

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
    const value = status as OrderStatus;
    if (value === "pending") {
      return { label: orderStatusLabel[value], variant: "warning" as const };
    }
    if (value === "approved") {
      return { label: orderStatusLabel[value], variant: "success" as const };
    }
    if (value === "cancelled" || value === "returned") {
      return { label: orderStatusLabel[value], variant: "destructive" as const };
    }
    if (value === "returnedAfterInvoice") {
      return { label: orderStatusLabel[value], variant: "warning" as const };
    }
    if (value === "invoiced") {
      return { label: orderStatusLabel[value], variant: "brand" as const };
    }
    return { label: status || "نامشخص", variant: "neutral" as const };
  }

  if (type === "warehouse") {
    const value = status as WarehouseStatus;
    if (value === "reserved" || value === "returned") {
      return { label: warehouseStatusLabel[value], variant: "neutral" as const };
    }
    if (value === "reviewing" || value === "processing" || value === "dispatchIssued") {
      return { label: warehouseStatusLabel[value], variant: "brand" as const };
    }
    if (value === "delivered" || value === "najaDetailsCompleted") {
      return { label: warehouseStatusLabel[value], variant: "success" as const };
    }
    if (value === "awaitingNajaDetails" || value === "returnedFromWarehouse") {
      return { label: warehouseStatusLabel[value], variant: "warning" as const };
    }
    if (value === "returnedToInventory") {
      return { label: warehouseStatusLabel[value], variant: "destructive" as const };
    }
    if (value === "completed") {
      return { label: warehouseStatusLabel[value], variant: "brand" as const };
    }
    return { label: status || "نامشخص", variant: "neutral" as const };
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
