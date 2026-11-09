import { Badge } from "@/components/ui/badge";
import {
  getDisplayOrderStatusLabel,
  getFinancialApprovalStatusLabel,
  getOrderStatusLabel,
  getWarehouseStatusLabel,
  normalizeOrderStatus,
} from "@/lib/domain/statuses";

type BadgeType = "order" | "warehouse" | "inventory" | "financial";
type InventoryStatus = "normal" | "warning" | "critical";

interface StatusBadgeProps {
  type: BadgeType;
  status: string;
  warehouseStatus?: string | null;
}

export function StatusBadge({
  type,
  status,
  warehouseStatus,
}: StatusBadgeProps) {
  const { label, variant } = getBadgeConfig(type, status, warehouseStatus);

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}

function getBadgeConfig(
  type: BadgeType,
  status: string,
  warehouseStatus?: string | null,
) {
  if (type === "order") {
    const orderStatus = normalizeOrderStatus(status);
    const label = getDisplayOrderStatusLabel(orderStatus, warehouseStatus);
    if (orderStatus === "pending_financial_approval") {
      return { label, variant: "warning" as const };
    }
    if (orderStatus === "pending_manager_approval") {
      return { label, variant: "brand" as const };
    }
    if (orderStatus === "pending_approval") {
      return { label, variant: "warning" as const };
    }
    if (orderStatus === "approved" || orderStatus === "completed") {
      return { label, variant: "success" as const };
    }
    if (orderStatus === "cancelled" || orderStatus === "returned") {
      return { label, variant: "destructive" as const };
    }
    if (orderStatus === "returnedAfterInvoice") {
      return { label, variant: "warning" as const };
    }
    if (orderStatus === "invoiced") {
      return { label, variant: "brand" as const };
    }
    return {
      label: label || orderStatus || "نامشخص",
      variant: "neutral" as const,
    };
  }

  if (type === "warehouse") {
    if (status === "reserved") {
      return {
        label: getWarehouseStatusLabel(status),
        variant: "neutral" as const,
      };
    }
    if (status === "reviewing" || status === "dispatchIssued") {
      return {
        label: getWarehouseStatusLabel(status),
        variant: "brand" as const,
      };
    }
    if (
      status === "delivered" ||
      status === "najaDetailsCompleted" ||
      status === "completed"
    ) {
      return {
        label: getWarehouseStatusLabel(status),
        variant: "success" as const,
      };
    }
    if (
      status === "awaitingNajaDetails" ||
      status === "returnedFromWarehouse"
    ) {
      return {
        label: getWarehouseStatusLabel(status),
        variant: "warning" as const,
      };
    }
    if (status === "returnedToInventory") {
      return {
        label: getWarehouseStatusLabel(status),
        variant: "destructive" as const,
      };
    }
    return {
      label: getWarehouseStatusLabel(status) || status || "نامشخص",
      variant: "neutral" as const,
    };
  }

  if (type === "financial") {
    if (status === "approved") {
      return {
        label: getFinancialApprovalStatusLabel(status),
        variant: "success" as const,
      };
    }
    if (status === "needs_correction") {
      return {
        label: getFinancialApprovalStatusLabel(status),
        variant: "correction" as const,
      };
    }
    return {
      label: getFinancialApprovalStatusLabel(status) || status || "نامشخص",
      variant: "neutral" as const,
    };
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
