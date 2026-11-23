import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SummaryCardProps {
  label: string;
  value: string;
  hint: string;
}

export function SummaryCard({ label, value, hint }: SummaryCardProps) {
  return (
    <Card className="relative p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#6B7280]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-[#102034]">
            {value}
          </p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-[14px] border border-[#D7E4EF] bg-[#F4F8FC] text-[#1F3A5F]">
          <ArrowUpRight className="size-5" />
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <p className="max-w-[18rem] text-xs leading-6 text-[#6B7280]">{hint}</p>
      </div>
    </Card>
  );
}
