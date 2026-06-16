import { Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

interface SlipDetailsCardProps {
  slipNumber: string;
  orderCode: string;
  exitDate: string;
  createdBy: string;
  createdAt: string;
  deliveredAt?: string;
  notes: string;
}

export function SlipDetailsCard({
  slipNumber,
  orderCode,
  exitDate,
  createdBy,
  createdAt,
  deliveredAt,
  notes,
}: SlipDetailsCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#102034]">
            اطلاعات حواله
          </h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            جزئیات عملیات خروج و تحویل
          </p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-[14px] border border-[#DDE7F0] bg-[#F5F8FB] text-[#1F3A5F]">
          <Truck className="size-5" />
        </span>
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <Item label="شماره حواله" value={formatFaDigits(slipNumber)} />
        <Item label="سفارش مرتبط" value={formatFaDigits(orderCode)} />
        <Item label="تاریخ خروج" value={formatDate(exitDate)} />
        <Item label="مسئول ثبت" value={createdBy} />
        <Item label="زمان ثبت" value={formatDateTime(createdAt)} />
        <Item
          label="زمان تحویل"
          value={deliveredAt ? formatDateTime(deliveredAt) : "-"}
        />
      </dl>
      <div className="mt-4 rounded-2xl border border-[#E8EEF4] bg-[#FBFCFD] p-4 text-sm leading-7 text-[#475569]">
        {notes || "توضیحی ثبت نشده است."}
      </div>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E8EEF4] bg-[#FBFCFD] p-3.5">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 font-medium text-[#102034]">{value}</dd>
    </div>
  );
}
