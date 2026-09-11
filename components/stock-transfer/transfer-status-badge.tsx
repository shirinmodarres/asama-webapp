import { Badge } from "@/components/ui/badge";
import type { StockTransferRequest } from "@/lib/models/stock.model";

const labels: Record<string, string> = {
  pending: "در انتظار تأیید مدیر",
  pending_manager_approval: "در انتظار تأیید مدیر",
  approved_waiting_warehouse_scan: "در انتظار اسکن انبار",
  approved_waiting_tracking_codes: "در انتظار اسکن انبار",
  approved: "تکمیل شده",
  completed: "تکمیل شده",
  rejected: "رد شده",
  cancelled: "لغو شده",
};

export function transferStatusLabel(status: string) {
  return labels[status] || status;
}

export function TransferStatusBadge({ status }: Pick<StockTransferRequest, "status">) {
  const variant = status === "completed"
    ? "success"
    : status === "rejected" || status === "cancelled"
      ? "destructive"
      : status === "pending" || status === "pending_manager_approval"
        ? "warning"
        : "brand";
  return <Badge dot variant={variant}>{transferStatusLabel(status)}</Badge>;
}
