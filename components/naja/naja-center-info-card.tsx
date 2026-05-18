import { Card } from "@/components/ui/card";
import type { NajaCenter } from "@/lib/models/naja-center.model";
import { formatFaDigits } from "@/lib/utils/number-format";

interface NajaCenterInfoCardProps {
  center: NajaCenter | null;
  title?: string;
}

export function NajaCenterInfoCard({
  center,
  title = "اطلاعات مرکز ناجا",
}: NajaCenterInfoCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#102034]">{title}</h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            {center
              ? "مرکز انتخاب شده برای این سفارش از داده های backend خوانده می شود."
              : "برای این سفارش هنوز مرکز ناجا ثبت نشده است."}
          </p>
        </div>
      </div>

      {center ? (
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
          <InfoItem label="نام مرکز" value={center.name} />
          <InfoItem
            label="کدپستی مرکز"
            value={formatFaDigits(center.centerCode)}
          />
          <InfoItem label="مسئول" value={center.responsibleName} />
          <InfoItem label="تلفن" value={formatFaDigits(center.phone)} />
          <InfoItem label="استان" value={center.province} />
          <InfoItem label="شهر" value={center.city} />
          <InfoItem label="شهرستان" value={center.county} />
          <InfoItem label="آدرس کامل" value={center.fullAddress} full />
        </dl>
      ) : null}
    </Card>
  );
}

function InfoItem({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="mt-1 text-sm font-medium leading-7 text-[#1F3A5F]">
        {value || "-"}
      </p>
    </div>
  );
}
