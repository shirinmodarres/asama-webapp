import type { OrderStatus } from "@/lib/expert/types";

interface OrderTimelineProps {
  status: OrderStatus;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  const steps = [
    { key: "created", label: "ثبت سفارش", done: true },
    { key: "pending_approval", label: "در انتظار تایید", done: true },
    {
      key: "approved",
      label:
        status === "cancelled"
          ? "لغو شده"
          : status === "invoiced"
            ? "فاکتور شده"
            : "تایید نهایی",
      done: status !== "pending_approval",
    },
  ];

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[#1F3A5F]">
        روند وضعیت سفارش
      </h3>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                step.done
                  ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                  : "border-[#E5E7EB] bg-white text-[#6B7280]"
              }`}
            >
              {step.label}
            </div>
            {index < steps.length - 1 ? (
              <span className="text-[#CBD5E1]">/</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
