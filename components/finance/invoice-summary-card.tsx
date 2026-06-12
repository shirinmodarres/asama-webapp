import type { ReactNode } from "react";
import { ReceiptText } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/finance/invoice-status-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import type { Invoice, WarehouseStatus } from "@/lib/expert/types";
import {
  formatDateTime,
  formatNumber,
  getOrderItemCount,
  getOrderTotalQuantity,
} from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

interface InvoiceSummaryCardProps {
  invoice?: Invoice;
  warehouseStatus: WarehouseStatus;
}

export function InvoiceSummaryCard({
  invoice,
  warehouseStatus,
}: InvoiceSummaryCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#102034]">خلاصه مالی</h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            نمای سریع از وضعیت مالی این سفارش
          </p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-[14px] border border-[#DDE7F0] bg-[#F5F8FB] text-[#1F3A5F]">
          <ReceiptText className="size-5" />
        </span>
      </div>

      {invoice ? (
        <div className="mt-5 space-y-3 text-sm">
          <Row
            label="شماره فاکتور"
            value={formatFaDigits(invoice.invoiceNumber)}
          />
          <Row label="تاریخ صدور" value={formatDateTime(invoice.issuedAt)} />
          <Row
            label="تعداد آیتم"
            value={formatNumber(getOrderItemCount(invoice.items))}
          />
          <Row
            label="جمع تعداد"
            value={formatNumber(getOrderTotalQuantity(invoice.items))}
          />
          <Row
            label="وضعیت فاکتور"
            value={<InvoiceStatusBadge status={invoice.status} />}
          />
          <Row
            label="وضعیت انبار"
            value={<StatusBadge type="warehouse" status={warehouseStatus} />}
          />
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-[#E7EDF3] bg-[#FBFCFD] px-4 py-3 text-sm leading-7 text-[#6B7280]">
          فاکتور برای این سفارش هنوز صادر نشده است.
        </p>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8EEF4] bg-[#FBFCFD] px-3.5 py-3">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-medium text-[#102034]">{value}</span>
    </div>
  );
}
