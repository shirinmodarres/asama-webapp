import { PackageCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getOrderStatusLabel,
  getWarehouseStatusLabel,
} from "@/lib/domain/statuses";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";

interface OrderSummaryCardProps {
  customerName: string | null;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  status: string;
  warehouseStatus: string;
}

export function OrderSummaryCard({
  customerName,
  itemCount,
  totalQuantity,
  totalAmount,
  status,
  warehouseStatus,
}: OrderSummaryCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#102034]">
            خلاصه سفارش
          </h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            نمای سریع از وضعیت جاری سفارش
          </p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-[14px] border border-[#DDE7F0] bg-[#F5F8FB] text-[#1F3A5F]">
          <PackageCheck className="size-5" />
        </span>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <SummaryRow label="مشتری" value={customerName || "-"} />
        <SummaryRow label="تعداد آیتم" value={formatNumber(itemCount)} />
        <SummaryRow label="جمع تعداد" value={formatNumber(totalQuantity)} />
        <SummaryRow label="مبلغ تقریبی" value={formatCurrency(totalAmount)} />
        <SummaryRow label="وضعیت سفارش" value={getOrderStatusLabel(status)} />
        <SummaryRow
          label="وضعیت انبار"
          value={getWarehouseStatusLabel(warehouseStatus)}
        />
      </dl>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8EEF4] bg-[#FBFCFD] px-3.5 py-3">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="font-semibold text-[#102034]">{value}</dd>
    </div>
  );
}
