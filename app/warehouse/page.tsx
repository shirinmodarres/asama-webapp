"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ManagerSummaryCard } from "@/components/manager/manager-summary-card";
import { ActionLinkCard } from "@/components/shared/action-link-card";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Order } from "@/lib/models/order.model";
import { listOrders } from "@/lib/services/order.service";

export default function WarehousePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        const data = await listOrders();
        if (isMounted) setOrders(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const reviewingCount = orders.filter(
    (order) =>
      order.orderStatus === "approved" && order.warehouseStatus === "reviewing",
  ).length;
  const najaPendingCount = orders.filter(
    (order) =>
      order.orderType === "naja" &&
      order.orderStatus === "approved" &&
      order.warehouseStatus === "awaitingNajaDetails",
  ).length;
  const issuedCount = orders.filter(
    (order) => order.warehouseStatus === "dispatchIssued",
  ).length;
  const deliveredCount = orders.filter(
    (order) => order.warehouseStatus === "delivered",
  ).length;

  return (
    <DashboardLayout role="warehouse" title="داشبورد انبار">
      {error ? <InlineErrorMessage message={error} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagerSummaryCard
          title="سفارش های در بررسی انبار"
          value={reviewingCount}
          hint="منتظر صدور حواله خروج"
        />
        <ManagerSummaryCard
          title="سفارش های ناجا"
          value={najaPendingCount}
          hint="منتظر ثبت شناسه کالا و کد رهگیری"
        />
        <ManagerSummaryCard
          title="حواله های خروج صادرشده"
          value={issuedCount}
          hint="در مسیر تحویل به مشتری"
        />
        <ManagerSummaryCard
          title="سفارش های تحویل شده"
          value={deliveredCount}
          hint="تحویل نهایی تایید شده"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionLinkCard
          href="/warehouse/inventory"
          icon="boxes"
          title="موجودی واقعی انبار"
          description="مشاهده موجودی کالاها"
        />
        <ActionLinkCard
          href="/warehouse/inbound"
          icon="plus-circle"
          title="ورود کالا"
          description="ثبت کالاهای  و شناسه‌های انبار"
        />
        <ActionLinkCard
          href="/warehouse/outbound"
          icon="package"
          title="خروج کالا"
          description="صدور حواله خروج برای سفارش‌های مجاز"
        />
        <ActionLinkCard
          href="/warehouse/exit-slips"
          icon="truck"
          title="حواله‌های خروج"
          description="پیگیری حواله‌های صادرشده و وضعیت تحویل"
        />
        <ActionLinkCard
          href="/warehouse/delivered"
          icon="file-check"
          title="تایید تحویل"
          description="ثبت نهایی دریافت کالا توسط مشتری"
        />
      </section>
    </DashboardLayout>
  );
}
