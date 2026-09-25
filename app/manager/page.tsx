"use client";

import { ClipboardList, Package, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DateRangeFilter, type DateRangeValue } from "@/components/shared/date-range-filter";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { ManagerBrandSalesCard } from "@/components/manager/manager-brand-sales-card";
import { ManagerChannelSalesCard } from "@/components/manager/manager-channel-sales-card";
import { ManagerExpertSalesCard } from "@/components/manager/manager-expert-sales-card";
import { ManagerMetricCard } from "@/components/manager/manager-metric-card";
import { ManagerSummaryCard } from "@/components/manager/manager-summary-card";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Order } from "@/lib/models/order.model";
import {
  getOrderTotalAmount as getSalesTotalAmount,
  getOrderTotalQuantity as getSalesTotalQuantity,
} from "@/lib/reports/order-sales-metrics";
import { listOrders } from "@/lib/services/order.service";
import { formatFaCurrencywithoutRial, formatNumber } from "@/lib/expert/utils";

const TOP_EXPERT_ROWS = 6;
const TOP_BRAND_ROWS = 6;

export default function ManagerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: null,
    to: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        const [recentOrders, najaOrders] = await Promise.all([
          listOrders(),
          listOrders({ orderType: "naja" }),
        ]);
        const mergedOrders = new Map(
          [...recentOrders, ...najaOrders].map((order) => [order.objectId, order]),
        );
        if (isMounted) setOrders([...mergedOrders.values()]);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) =>
          isWithinDateRange(order.createdAt, dateRange.from, dateRange.to),
        )
        .sort(
          (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
        ),
    [dateRange.from, dateRange.to, orders],
  );

  const pendingFinancialCount = filteredOrders.filter(
    (order) => order.orderStatus === "pending_financial_approval",
  ).length;
  const pendingManagerCount = filteredOrders.filter(
    (order) => order.orderStatus === "pending_manager_approval",
  ).length;
  const approvedOrders = filteredOrders.filter(
    (order) => order.orderStatus === "approved",
  );
  const confirmedSalesOrders = useMemo(
    () => filteredOrders.filter((order) =>
      ["approved", "invoiced", "completed"].includes(order.orderStatus),
    ),
    [filteredOrders],
  );
  const invoicedOrders = filteredOrders.filter(
    (order) => order.orderStatus === "invoiced",
  );
  const warehouseWaitingCount = filteredOrders.filter((order) =>
    ["reserved", "reviewing"].includes(order.warehouseStatus),
  ).length;

  const totalSalesAmount = confirmedSalesOrders.reduce(
    (sum, order) => sum + getSalesTotalAmount(order.items),
    0,
  );
  const totalSalesQuantity = confirmedSalesOrders.reduce(
    (sum, order) => sum + getSalesTotalQuantity(order.items),
    0,
  );
  const expertRows = useMemo(
    () => groupByExpert(confirmedSalesOrders).slice(0, TOP_EXPERT_ROWS),
    [confirmedSalesOrders],
  );
  const channelRows = useMemo(
    () => groupByChannel(confirmedSalesOrders),
    [confirmedSalesOrders],
  );
  const brandRows = useMemo(
    () => groupByBrand(confirmedSalesOrders).slice(0, TOP_BRAND_ROWS),
    [confirmedSalesOrders],
  );

  return (
    <DashboardLayout role="manager" title="داشبورد مدیر فروش">
      <div className="space-y-4">
        {error ? <InlineErrorMessage message={error} /> : null}

        <section className="rounded-[26px] border border-[#DDE7F0] bg-white px-4 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-5 lg:px-6">
          <div className="flex flex-col gap-3 border-b border-[#E7EDF4] pb-5 text-right">
            <h1 className="text-2xl font-black text-[#102034] sm:text-3xl">
              مبلغ کل فروش
            </h1>
            <p className="text-base font-medium text-[#6B7280]">
              جمع فروش قطعی در بازه انتخابی
            </p>
          </div>
          <div className="mt-5 max-w-xl">
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              label="بازه گزارش"
              placeholder="کل گزارش"
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ManagerSummaryCard
            title="در انتظار تأیید مالی"
            value={pendingFinancialCount}
            hint="سفارش‌هایی که منتظر بررسی مالی هستند"
          />
          <ManagerSummaryCard
            title="در انتظار تأیید مدیر"
            value={pendingManagerCount}
            hint="سفارش‌هایی که منتظر مدیر فروش هستند"
          />
          <ManagerSummaryCard
            title="در انتظار انبار"
            value={warehouseWaitingCount}
            hint="سفارش‌هایی که در انبار نهایی نشده‌اند"
          />
          <ManagerSummaryCard
            title="فاکتور شده"
            value={invoicedOrders.length}
            hint="سفارش‌هایی که فاکتور گرفته‌اند"
          />
          <ManagerSummaryCard
            title="تأیید شده"
            value={approvedOrders.length}
            hint="سفارش‌های تأیید شده در بازه انتخابی"
          />
        </section>

        <section className="grid gap-3 xl:grid-cols-3">
          <ManagerMetricCard
            title="مبلغ کل فروش"
            value={formatFaCurrencywithoutRial(totalSalesAmount)}
            icon={<Wallet className="size-6" />}
            iconTone="green"
            footer="ریال"
          />
          <ManagerMetricCard
            title="تعداد سفارش‌های فروش"
            value={formatNumber(confirmedSalesOrders.length)}
            icon={<ClipboardList className="size-6" />}
            iconTone="blue"
            footer="سفارش"
          />
          <ManagerMetricCard
            title="تعداد اقلام"
            value={formatNumber(totalSalesQuantity)}
            icon={<Package className="size-6" />}
            iconTone="amber"
            footer="قلم"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <ManagerExpertSalesCard
            title="فروش به تفکیک کارشناس"
            description="نمودار رتبه‌بندی کارشناسان بر اساس مبلغ فروش"
            rows={expertRows}
            emptyMessage="در این بازه فروش ثبت‌شده‌ای برای کارشناسان وجود ندارد."
          />
          <ManagerChannelSalesCard
            rows={channelRows}
            totalAmount={totalSalesAmount}
            emptyMessage="برای این بازه داده‌ای ثبت نشده است."
          />
        </section>

        <ManagerBrandSalesCard
          rows={brandRows}
          totalAmount={totalSalesAmount}
          totalQuantity={totalSalesQuantity}
          emptyMessage="در این بازه فروشی برای نمایش بر اساس برند وجود ندارد."
        />
      </div>
    </DashboardLayout>
  );
}

function groupByExpert(orders: Order[]) {
  const map = new Map<
    string,
    { key: string; label: string; count: number; quantity: number; amount: number }
  >();

  for (const order of orders) {
    const key = order.createdByName?.trim() || order.expertUserId || "نامشخص";
    const current = map.get(key) ?? {
      key,
      label: order.createdByName?.trim() || order.expertUserId || "نامشخص",
      count: 0,
      quantity: 0,
      amount: 0,
    };
    current.count += 1;
    current.quantity += getSalesTotalQuantity(order.items);
    current.amount += getSalesTotalAmount(order.items);
    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function groupByChannel(orders: Order[]) {
  const grouped = [
    { key: "normal", label: "بازار", count: 0, quantity: 0, amount: 0 },
    { key: "naja", label: "ناجا", count: 0, quantity: 0, amount: 0 },
  ];

  for (const order of orders) {
    const target = order.orderType === "naja" ? grouped[1] : grouped[0];
    target.count += 1;
    target.quantity += getSalesTotalQuantity(order.items);
    target.amount += getSalesTotalAmount(order.items);
  }

  return grouped;
}

function groupByBrand(orders: Order[]) {
  const map = new Map<
    string,
    { key: string; label: string; count: number; quantity: number; amount: number }
  >();

  for (const order of orders) {
    const key = order.priceListBrand?.trim() || "نامشخص";
    const current = map.get(key) ?? {
      key,
      label: order.priceListBrand?.trim() || "نامشخص",
      count: 0,
      quantity: 0,
      amount: 0,
    };
    current.count += 1;
    current.quantity += getSalesTotalQuantity(order.items);
    current.amount += getSalesTotalAmount(order.items);
    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function isWithinDateRange(
  value: string,
  dateFrom?: string | null,
  dateTo?: string | null,
): boolean {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;

  const fromTimestamp = dateFrom ? new Date(dateFrom).getTime() : null;
  if (fromTimestamp && timestamp < fromTimestamp) return false;

  const toTimestamp = dateTo ? new Date(dateTo).getTime() : null;
  if (toTimestamp) {
    const endOfDay = new Date(toTimestamp);
    endOfDay.setHours(23, 59, 59, 999);
    if (timestamp > endOfDay.getTime()) return false;
  }

  return true;
}
