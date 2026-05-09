import { Badge } from "@/components/ui/badge";
import { getInvoiceStatusLabel } from "@/lib/domain/statuses";

export function InvoiceStatusBadge({ status }: { status: string }) {
  const variant = status === "needs_follow_up" ? "warning" : "success";
  return (
    <Badge variant={variant} dot>
      {getInvoiceStatusLabel(status) || status}
    </Badge>
  );
}
