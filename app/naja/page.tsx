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
import { formatFaDigits } from "@/lib/utils/number-format";
import type { NajaCenter } from "@/lib/models/naja-center.model";
import type { Order } from "@/lib/models/order.model";
import { listNajaCenters } from "@/lib/services/naja-center.service";
import { listOrders } from "@/lib/services/order.service";
import { ActionLinkCard } from "@/components/shared/action-link-card";

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
    .sort(
      (a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)),
    )
    .slice(0, 4);

  return (
    <DashboardLayout role="naja" title="داشبورد کارشناس ناجا">
      {error ? <InlineErrorMessage message={error} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="سفارش‌های ثبت‌شده"
          value={formatFaDigits(najaOrders.length)}
          hint="کل سفارش‌های ناجا"
        />
        <SummaryCard
          label="در انتظار انبار"
          value={formatFaDigits(awaitingWarehouse)}
          hint="نیازمند شناسه و رهگیری"
        />
        <SummaryCard
          label="سفارش‌های برگشتی"
          value={formatFaDigits(returnedOrders)}
          hint="بازگشتی در هر مرحله"
        />
        <SummaryCard
          label="مراکز فعال ناجا"
          value={formatFaDigits(
            centers.filter((center) => center.status === "active").length,
          )}
          hint="قابل انتخاب در سفارش"
        />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <ActionLinkCard
          href="/naja/orders/create"
          icon="plus-circle"
          title="ثبت سفارش ناجا"
          description="ثبت سفارش جدید"
        />
        <ActionLinkCard
          href="/naja/centers"
          icon="building-2"
          title="مراکز ناجا"
          description="مشاهده و ویرایش مراکز"
        />
        <ActionLinkCard
          href="/naja/orders"
          icon="package"
          title="سفارش‌های ناجا"
          description="پیگیری سفارش‌ها"
        />
      </div>

      <section className="grid gap-6">
        <SectionCard
          title="آخرین سفارش های ناجا"
          description="مرور سریع آخرین سفارش های ثبت شده و برگشتی"
        >
          {latestOrders.length > 0 ? (
            <div className="space-y-3">
              {latestOrders.map((order) => (
                <div
                  key={order.objectId || order.id}
                  className="rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#102034]">
                          {order.code}
                        </p>
                        <Badge variant="warning">ناجا</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        {order.customerName ?? "-"}
                      </p>
                      {order.najaCenter ? (
                        <p className="mt-1 text-xs text-[#7C8A9C]">
                          {order.najaCenter.name} -{" "}
                          {order.najaCenter.centerCode}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="neutral">
                      {formatDateTime(order.updatedAt)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-[#6B7280]">
                      ثبت کننده: {order.createdByName || "-"}
                    </p>
                    <Link
                      href={`/naja/orders/${order.objectId}`}
                      className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
                    >
                      مشاهده جزئیات
                    </Link>
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
                اولین سفارش ناجا را ثبت کنید تا این بخش به‌روزرسانی شود.
              </p>
              <Link
                href="/naja/orders/create"
                className="mt-4 inline-flex rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm font-medium text-white!"
              >
                ثبت سفارش ناجا
              </Link>
            </div>
          )}
        </SectionCard>
      </section>
    </DashboardLayout>
  );
}
