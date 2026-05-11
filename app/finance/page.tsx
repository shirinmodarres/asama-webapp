"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ManagerSummaryCard } from "@/components/manager/manager-summary-card";
import { ActionLinkCard } from "@/components/shared/action-link-card";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Invoice } from "@/lib/models/invoice.model";
import type { Order } from "@/lib/models/order.model";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { listInvoices } from "@/lib/services/invoice.service";
import { listOrders } from "@/lib/services/order.service";
import { listExitSlips } from "@/lib/services/warehouse.service";
import { formatFaNumber } from "@/lib/utils/number-format";

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [exitSlips, setExitSlips] = useState<ExitSlip[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [orderData, invoiceData, slipData] = await Promise.all([
          listOrders(),
          listInvoices(),
          listExitSlips(),
        ]);
        if (isMounted) {
          setOrders(orderData);
          setInvoices(invoiceData);
          setExitSlips(slipData);
        }
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const readyForInvoiceCount = orders.filter(
    (order) =>
      (order.orderType === "normal" &&
        order.orderStatus === "approved" &&
        order.warehouseStatus === "delivered") ||
      (order.orderType === "naja" &&
        order.orderStatus === "approved" &&
        order.warehouseStatus === "najaDetailsCompleted"),
  ).length;
  const issuedInvoicesCount = invoices.length;
  const completedOrdersCount = orders.filter(
    (order) =>
      order.warehouseStatus === "delivered" || order.orderStatus === "invoiced",
  ).length;
  const reconciliableCount = orders.filter(
    (order) =>
      order.orderStatus === "approved" &&
      order.warehouseStatus === "delivered" &&
      order.orderType === "normal" &&
      exitSlips.some((slip) => slip.orderId === order.objectId),
  ).length;

  return (
    <DashboardLayout role="finance" title="داشبورد حسابداری">
      {error ? <InlineErrorMessage message={error} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ManagerSummaryCard
          title="سفارش های آماده فاکتور"
          value={readyForInvoiceCount}
          hint="شامل جریان عادی و سفارش های ناجا"
        />
        <ManagerSummaryCard
          title="فاکتورهای صادرشده"
          value={issuedInvoicesCount}
          hint="ثبت شده در چرخه داخلی مالی"
        />
        <ManagerSummaryCard
          title="مجموع سفارش های تکمیل شده"
          value={completedOrdersCount}
          hint="تحویل تاییدشده یا فاکتور صادرشده"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ActionLinkCard
          href="/finance/ready"
          icon="layers"
          title="مشاهده سفارش های آماده فاکتور"
          description="صف سفارش هایی که آماده بررسی و صدور فاکتور اند"
        />
        <ActionLinkCard
          href="/finance/ready"
          icon="file-check"
          title="بررسی تطبیق سفارش و حواله"
          description={`تعداد ${formatFaNumber(reconciliableCount)} سفارش قابل تطبیق`}
        />
        <ActionLinkCard
          href="/finance/invoices"
          icon="file-text"
          title="مشاهده فاکتورها"
          description="دسترسی به لیست و جزئیات فاکتورهای صادرشده"
        />
      </section>
    </DashboardLayout>
  );
}
