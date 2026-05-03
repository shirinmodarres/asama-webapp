interface NajaOrderTimelineProps {
  order: {
    orderStatus: string;
    warehouseStatus: string;
  };
}

export function NajaOrderTimeline({ order }: NajaOrderTimelineProps) {
  const steps = [
    { key: "created", label: "ثبت سفارش ناجا", done: true },
    { key: "inventory", label: "کسر موجودی ناجا", done: true },
    {
      key: "warehouse",
      label: "تکمیل اطلاعات انبار",
      done:
        order.warehouseStatus !== "awaitingNajaDetails" &&
        order.orderStatus !== "returned",
    },
    {
      key: "invoice",
      label: "صدور فاکتور",
      done:
        order.orderStatus === "invoiced" ||
        order.orderStatus === "returnedAfterInvoice",
    },
    {
      key: "return",
      label: "برگشت سفارش",
      done:
        order.orderStatus === "returned" ||
        order.orderStatus === "returnedAfterInvoice",
    },
  ];

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[#1F3A5F]">
        تایم لاین سفارش ناجا
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
