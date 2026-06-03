"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ManagerSummaryCard } from "@/components/manager/manager-summary-card";
import { ActionLinkCard } from "@/components/shared/action-link-card";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Order } from "@/lib/models/order.model";
import { listOrders } from "@/lib/services/order.service";

export default function ManagerPage() {
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

  const pendingCount = orders.filter(
    (order) => order.orderStatus === "pending_approval",
  ).length;
  const approvedCount = orders.filter(
    (order) => order.orderStatus === "approved",
  ).length;
  const cancelledCount = orders.filter(
    (order) => order.orderStatus === "cancelled",
  ).length;
  const warehouseInProgressCount = orders.filter((order) =>
    ["reviewing", "processing", "dispatchIssued"].includes(
      order.warehouseStatus,
    ),
  ).length;

  return (
    <DashboardLayout role="manager" title="داشبورد مدیر فروش">
      {error ? <InlineErrorMessage message={error} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagerSummaryCard
          title="سفارش های در انتظار تایید"
          value={pendingCount}
          hint="نیازمند اقدام سریع مدیر فروش"
        />
        <ManagerSummaryCard
          title="سفارش های تایید شده"
          value={approvedCount}
          hint="منتقل شده به فرآیند انبار"
        />
        <ManagerSummaryCard
          title="سفارش های لغوشده"
          value={cancelledCount}
          hint="رزرو موجودی آن ها آزاد شده است"
        />
        <ManagerSummaryCard
          title="سفارش های در جریان انبار"
          value={warehouseInProgressCount}
          hint="در بررسی، آماده سازی یا خروج"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ActionLinkCard
          href="/manager/pending-orders"
          icon="clipboard-check"
          title="بررسی سفارش ها"
          description="مشاهده سفارش های در انتظار تایید و ثبت تصمیم نهایی"
        />
        <ActionLinkCard
          href="/manager/order-tracking"
          icon="activity"
          title="مشاهده روند سفارش ها"
          description="پایش وضعیت کلی سفارش ها از تایید تا فاکتور"
        />
      </section>
    </DashboardLayout>
  );
}
