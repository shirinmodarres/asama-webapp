"use client";

import Link from "next/link";
import { ArrowLeft, FilePenLine, PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionCard } from "@/components/ui/section-card";
import { SummaryCard } from "@/components/ui/summary-card";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { listOrders } from "@/lib/services/order.service";
import type { Order } from "@/lib/models/order.model";

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
        if (isMounted) setOrders(data.filter((order) => order.orderType === "normal"));
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
    const pendingOrders = orders.filter((order) => order.orderStatus === "pending");
    const needsReviewOrders = orders.filter(
      (order) => order.orderStatus === "needs_review",
    );
    const approvedOrders = orders.filter((order) => order.orderStatus === "approved");
    const invoicedOrders = orders.filter((order) => order.orderStatus === "invoiced");
    const latestEditableOrder =
      orders.find((order) => isEditableOrderStatus(order.orderStatus)) ?? null;

    return {
      cards: [
        {
          id: "total",
          label: "کل سفارش های ثبت شده",
          value: String(orders.length),
          hint: "بر اساس اطلاعات دریافت شده از سرور",
        },
        {
          id: "pending",
          label: "در انتظار تأیید",
          value: String(pendingOrders.length),
          hint: "منتظر بررسی مدیر فروش",
        },
        {
          id: "needs-review",
          label: "نیازمند بررسی",
          value: String(needsReviewOrders.length),
          hint: "قابل ویرایش برای رفع مشکل",
        },
        {
          id: "approved",
          label: "تأیید شده",
          value: String(approvedOrders.length),
          hint: "آماده ادامه مسیر در انبار",
        },
        {
          id: "invoiced",
          label: "فاکتور شده",
          value: String(invoicedOrders.length),
          hint: "نهایی شده در واحد مالی",
        },
      ],
      latestEditableOrder,
      recentOrders: orders.slice(0, 5),
    };
  }, [orders]);

  return (
    <DashboardLayout role="expert" title="داشبورد کارشناس">
      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش ها" description="اطلاعات داشبورد کارشناس از سرور بارگذاری می شود." />
      ) : error ? (
        <PageErrorMessage title="دریافت داشبورد انجام نشد" message={error} />
      ) : orders.length === 0 ? (
        <EmptyState title="سفارشی ثبت نشده است" description="پس از ثبت اولین سفارش، خلاصه وضعیت اینجا نمایش داده می شود." />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.cards.map((stat) => (
              <SummaryCard key={stat.id} label={stat.label} value={stat.value} hint={stat.hint} />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <SectionCard title="دسترسی سریع" description="ورود مستقیم به ثبت سفارش یا آخرین سفارش قابل ویرایش">
              <div className="space-y-3">
                <div className="rounded-[18px] border border-[#DDEAE0] bg-[linear-gradient(180deg,rgba(247,251,248,1),rgba(255,255,255,1))] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 items-center justify-center rounded-[14px] bg-[#6CAE75] text-white shadow-[0_14px_28px_rgba(108,174,117,0.22)]">
                      <PlusCircle className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[#102034]">ثبت سفارش جدید</div>
                      <p className="mt-1 text-sm leading-7 text-[#6B7280]">ثبت سفارش جدید فروش با اطلاعات واقعی backend.</p>
                    </div>
                  </div>
                  <Button asChild variant="success" fullWidth className="mt-4">
                    <Link href="/expert/orders/new">
                      ورود به فرم ثبت سفارش
                      <ArrowLeft className="size-4" />
                    </Link>
                  </Button>
                </div>

                <div className="rounded-[18px] border border-[#E7EDF3] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 items-center justify-center rounded-[14px] bg-[#EEF4FA] text-[#1F3A5F]">
                      <FilePenLine className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[#102034]">ویرایش آخرین سفارش</div>
                      <p className="mt-1 text-sm leading-7 text-[#6B7280]">
                        {stats.latestEditableOrder
                          ? `آخرین سفارش قابل ویرایش ${stats.latestEditableOrder.code} در وضعیت ${stats.latestEditableOrder.orderStatusLabel} قرار دارد.`
                          : "در حال حاضر سفارشی در وضعیت قابل ویرایش وجود ندارد."}
                      </p>
                    </div>
                  </div>
                  {stats.latestEditableOrder ? (
                    <Button asChild variant="outline" fullWidth className="mt-4">
                      <Link href={`/expert/orders/${stats.latestEditableOrder.objectId}/edit`}>
                        باز کردن سفارش {stats.latestEditableOrder.code}
                        <ArrowLeft className="size-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" fullWidth className="mt-4" disabled>
                      سفارشی برای ویرایش موجود نیست
                    </Button>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="آخرین سفارش ها" description="مرور آخرین سفارش های ثبت شده توسط کارشناس">
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div key={order.objectId} className="rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#102034]">{order.code}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">{order.customerName || "بدون نام مشتری"}</p>
                      </div>
                      <span className="text-xs text-[#6B7280]">{order.orderStatusLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function isEditableOrderStatus(status: string): boolean {
  return status === "pending" || status === "needs_review";
}
