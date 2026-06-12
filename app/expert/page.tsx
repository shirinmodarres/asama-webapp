"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionCard } from "@/components/ui/section-card";
import { SummaryCard } from "@/components/ui/summary-card";
import { getErrorMessage } from "@/lib/api/api-error";
import { listOrders } from "@/lib/services/order.service";
import type { Order } from "@/lib/models/order.model";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ExpertPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listOrders();
        if (isMounted)
          setOrders(data.filter((order) => order.orderType === "normal"));
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const pendingOrders = orders.filter(
      (order) => order.orderStatus === "pending_approval",
    );
    const needsReviewOrders = orders.filter(
      (order) => order.orderStatus === "needs_review",
    );
    const approvedOrders = orders.filter(
      (order) => order.orderStatus === "approved",
    );
    const invoicedOrders = orders.filter(
      (order) => order.orderStatus === "invoiced",
    );
    const latestEditableOrder =
      orders.find((order) => isEditableOrderStatus(order.orderStatus)) ?? null;

    return {
      cards: [
        {
          id: "total",
          label: "کل سفارش های ثبت شده",
          value: formatFaDigits(orders.length),
          hint: "کل سفارش‌های ثبت‌شده",
        },
        {
          id: "pending",
          label: "در انتظار تأیید",
          value: formatFaDigits(pendingOrders.length),
          hint: "منتظر تأیید مدیر",
        },
        {
          id: "needs-review",
          label: "نیازمند بررسی",
          value: formatFaDigits(needsReviewOrders.length),
          hint: "نیازمند اصلاح کارشناس",
        },
        {
          id: "approved",
          label: "تأیید شده",
          value: formatFaDigits(approvedOrders.length),
          hint: "آماده ارسال به انبار",
        },
        {
          id: "invoiced",
          label: "فاکتور شده",
          value: formatFaDigits(invoicedOrders.length),
          hint: "ثبت‌شده در مالی",
        },
      ],
      latestEditableOrder,
      recentOrders: orders.slice(0, 5),
    };
  }, [orders]);

  return (
    <DashboardLayout role="expert" title="داشبورد کارشناس">
      {isLoading ? (
        <LoadingState
          title="در حال دریافت سفارش ها"
          description="اطلاعات داشبورد کارشناس از سرور بارگذاری می شود."
        />
      ) : error ? (
        <PageErrorMessage title="دریافت داشبورد انجام نشد" message={error} />
      ) : (
        <>
          <section className="flex justify-end">
            <Link
              href="/expert/orders/new"
              className="inline-flex items-center gap-2 rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm font-medium text-white!"
            >
              <PlusCircle className="size-4" />
              <span>ثبت سفارش جدید</span>
            </Link>
          </section>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.cards.map((stat) => (
              <SummaryCard
                key={stat.id}
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
              />
            ))}
          </section>

          <section>
            <SectionCard
              title="آخرین سفارش ها"
              description="مرور آخرین سفارش های ثبت شده توسط کارشناس"
            >
              {stats.recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentOrders.map((order) => (
                    <div
                      key={order.objectId}
                      className="rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#102034]">
                            {formatFaDigits(order.code)}
                          </p>
                          <p className="mt-1 text-sm text-[#6B7280]">
                            {order.customerName || "بدون نام مشتری"}
                          </p>
                        </div>
                        <span className="text-xs text-[#6B7280]">
                          {order.orderStatusLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-[#DDEAE0] bg-[#FBFCFD] p-6 text-center">
                  <p className="text-sm font-semibold text-[#102034]">
                    هنوز سفارشی ثبت نشده
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#6B7280]">
                    اولین سفارش را ثبت کنید تا این بخش به‌روزرسانی شود.
                  </p>
                  <Link
                    href="/expert/orders/new"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm font-medium text-white!"
                  >
                    <PlusCircle className="size-4" />
                    <span>ثبت اولین سفارش</span>
                  </Link>
                </div>
              )}
            </SectionCard>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function isEditableOrderStatus(status: string): boolean {
  return status === "pending_approval" || status === "needs_review";
}
