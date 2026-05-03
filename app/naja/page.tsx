"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { SectionCard } from "@/components/ui/section-card";
import { SummaryCard } from "@/components/ui/summary-card";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { NajaCenter } from "@/lib/models/naja-center.model";
import type { Order } from "@/lib/models/order.model";
import { listNajaCenters } from "@/lib/services/naja-center.service";
import { listOrders } from "@/lib/services/order.service";

export default function NajaDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [centers, setCenters] = useState<NajaCenter[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [orderData, centerData] = await Promise.all([
          listOrders({ orderType: "naja" }),
          listNajaCenters(),
        ]);
        if (!isMounted) return;
        setOrders(orderData);
        setCenters(centerData);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const najaOrders = orders.filter((order) => order.orderType === "naja");
  const awaitingWarehouse = najaOrders.filter(
    (order) =>
      order.orderStatus === "approved" &&
      order.warehouseStatus === "awaitingNajaDetails",
  ).length;
  const returnedOrders = najaOrders.filter(
    (order) =>
      order.orderStatus === "returned" ||
      order.orderStatus === "returnedAfterInvoice",
  ).length;
  const latestOrders = [...najaOrders]
    .sort((a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)))
    .slice(0, 4);

  return (
    <DashboardLayout role="naja" title="داشبورد کارشناس ناجا">
      {error ? <InlineErrorMessage message={error} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="تعداد سفارش های ثبت شده" value={String(najaOrders.length)} hint="کل سفارش های جریان اختصاصی ناجا" />
        <SummaryCard label="سفارش های در انتظار انبار" value={String(awaitingWarehouse)} hint="منتظر تکمیل شناسه کالا و کد رهگیری" />
        <SummaryCard label="سفارش های برگشتی" value={String(returnedOrders)} hint="در هر مرحله بازگردانی شده اند" />
        <SummaryCard label="مراکز فعال ناجا" value={String(centers.filter((center) => center.status === "active").length)} hint="مراکز قابل انتخاب برای ثبت سفارش" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SectionCard title="آخرین سفارش های ناجا" description="مرور سریع آخرین سفارش های ثبت شده و برگشتی">
          <div className="space-y-3">
            {latestOrders.map((order) => (
              <div key={order.objectId || order.id} className="rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#102034]">{order.code}</p>
                      <Badge variant="warning">ناجا</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[#6B7280]">{order.customerName ?? "-"}</p>
                    {order.najaCenter ? (
                      <p className="mt-1 text-xs text-[#7C8A9C]">
                        {order.najaCenter.name} - {order.najaCenter.centerCode}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="neutral">{formatDateTime(order.updatedAt)}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-[#6B7280]">ثبت کننده: {order.createdByName || "-"}</p>
                  <Link href={`/naja/orders/${order.objectId}`} className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]">
                    مشاهده جزئیات
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="دسترسی سریع" description="ثبت سفارش، مدیریت مراکز و پیگیری سفارش های ناجا">
          <div className="space-y-3">
            <Link href="/naja/orders/new" className="block rounded-[18px] border border-[#DDEAE0] bg-[linear-gradient(180deg,rgba(247,251,248,1),rgba(255,255,255,1))] p-4 text-sm font-semibold text-[#102034]">
              ثبت سفارش ناجا
              <p className="mt-1 text-sm font-normal leading-7 text-[#6B7280]">ایجاد سفارش جدید از موجودی اختصاصی ناجا</p>
            </Link>
            <Link href="/naja/centers" className="block rounded-[18px] border border-[#E7EDF3] bg-white p-4 text-sm font-semibold text-[#102034]">
              مراکز ناجا
              <p className="mt-1 text-sm font-normal leading-7 text-[#6B7280]">مشاهده و ویرایش مراکز ثبت شده ناجا</p>
            </Link>
            <Link href="/naja/orders" className="block rounded-[18px] border border-[#E7EDF3] bg-white p-4 text-sm font-semibold text-[#102034]">
              سفارش های ناجا
              <p className="mt-1 text-sm font-normal leading-7 text-[#6B7280]">پیگیری، مشاهده جزئیات و بازگردانی سفارش ها</p>
            </Link>
          </div>
        </SectionCard>
      </section>
    </DashboardLayout>
  );
}
