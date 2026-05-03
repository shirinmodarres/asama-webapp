import { Badge } from "@/components/ui/badge";
import type { NajaCenterStatus } from "@/lib/models/naja-center.model";

export function NajaCenterStatusBadge({ status }: { status: NajaCenterStatus }) {
  return status === "active" ? (
    <Badge variant="success">فعال</Badge>
  ) : (
    <Badge variant="neutral">غیرفعال</Badge>
  );
}
