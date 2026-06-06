import type { ExpertOrder } from "@/lib/expert/types";

interface ProgressTimelineProps {
  order: ExpertOrder;
}

export function ProgressTimeline({ order }: ProgressTimelineProps) {
  const steps =
    order.orderSource === "naja"
      ? [
          { key: "created", label: "ثبت سفارش ناجا", done: true },
          { key: "inventory", label: "کسر موجودی ناجا", done: true },
          {
            key: "warehouse",
            label: "تکمیل اطلاعات انبار",
            done:
              order.warehouseStatus !== "awaitingNajaDetails" &&
              order.status !== "returned",
          },
          {
            key: "invoice",
            label: "صدور فاکتور",
            done:
              order.status === "invoiced" ||
              order.status === "returnedAfterInvoice",
          },
          {
            key: "return",
            label: "برگشت سفارش",
            done:
              order.status === "returned" ||
              order.status === "returnedAfterInvoice",
          },
        ]
      : [
          { key: "created", label: "ثبت سفارش", done: true },
          { key: "reserved", label: "رزرو موجودی", done: true },
          {
            key: "decision",
            label: "تصمیم مدیر فروش",
            done: order.status !== "pending_approval",
          },
          {
            key: "warehouse",
            label: "جریان انبار",
            done: order.status === "approved" || order.status === "invoiced",
          },
        ];

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[#1F3A5F]">
        تایم لاین پیشرفت
      </h3>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-3">
            <span
              className={`rounded-xl border px-3 py-1.5 text-xs ${
                step.done
                  ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                  : "border-[#E5E7EB] bg-white text-[#94A3B8]"
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 ? (
              <span className="text-[#CBD5E1]">/</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
