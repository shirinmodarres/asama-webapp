"use client";

import { CalendarDays, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InvoiceTable } from "@/components/finance/invoice-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { listOrders } from "@/lib/services/order.service";
import { listExitSlips } from "@/lib/services/warehouse.service";

interface ReadyOrderRow {
  id: string;
  order: Order;
  slipNumber: string;
  deliveredAt: string;
}

export default function FinanceReadyPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [exitSlips, setExitSlips] = useState<ExitSlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deliveredDateFilter, setDeliveredDateFilter] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReady() {
      setIsLoading(true);
      setError("");

      try {
        const [orderData, slipData] = await Promise.all([
          listOrders(),
          listExitSlips(),
        ]);
        if (isMounted) {
          setOrders(orderData);
          setExitSlips(slipData);
        }
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReady();

    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo<ReadyOrderRow[]>(() => {
    return orders
      .filter(
        (order) =>
          (order.orderType === "normal" &&
            order.orderStatus === "approved" &&
            order.warehouseStatus === "delivered") ||
          (order.orderType === "naja" &&
            order.orderStatus === "approved" &&
            order.warehouseStatus === "najaDetailsCompleted"),
      )
      .map((order) => {
        const slip = exitSlips.find((entry) => entry.orderId === order.objectId);
        return {
          id: order.objectId || order.id,
          order,
          slipNumber: slip?.slipCode ?? "-",
          deliveredAt: slip?.deliveryConfirmedAt ?? order.updatedAt,
        };
      })
      .sort(
        (a, b) =>
          Number(new Date(b.deliveredAt)) - Number(new Date(a.deliveredAt)),
      )
      .filter((row) => {
        const query = search.toLowerCase().trim();
        const matchesSearch =
          query.length === 0 ||
          row.order.code.toLowerCase().includes(query) ||
          row.order.createdByName.toLowerCase().includes(query) ||
          (row.order.customerName ?? "").toLowerCase().includes(query) ||
          row.slipNumber.toLowerCase().includes(query);

        const deliveredDate = row.deliveredAt
          ? new Date(row.deliveredAt).toISOString().slice(0, 10)
          : "";
        const matchesDate = deliveredDateFilter
          ? deliveredDate === deliveredDateFilter
          : true;
        return matchesSearch && matchesDate;
      });
  }, [orders, exitSlips, search, deliveredDateFilter]);

  const columns: DataTableColumn<ReadyOrderRow>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">{row.order.code}</span>
      ),
    },
    {
      key: "slip",
      header: "شماره حواله خروج",
      render: (row) => row.slipNumber,
    },
    {
      key: "createdBy",
      header: "ثبت کننده",
      render: (row) => row.order.createdByName,
    },
    {
      key: "source",
      header: "منبع",
      render: (row) => (row.order.orderType === "naja" ? "ناجا" : "عادی"),
    },
    {
      key: "customer",
      header: "مشتری",
      render: (row) => row.order.customerName ?? "-",
    },
    {
      key: "deliveryDate",
      header: "تاریخ تحویل",
      render: (row) => formatDateTime(row.deliveredAt),
    },
    {
      key: "orderStatus",
      header: "وضعیت سفارش",
      render: (row) => <StatusBadge type="order" status={row.order.orderStatus} />,
    },
    {
      key: "warehouseStatus",
      header: "وضعیت انبار",
      render: (row) => <StatusBadge type="warehouse" status={row.order.warehouseStatus} />,
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={
              row.order.orderType === "naja"
                ? `/finance/orders/${row.order.objectId}/naja-invoice`
                : `/finance/orders/${row.order.objectId}/reconcile`
            }
            className="btn-primary rounded-xl px-3 py-1.5 text-xs font-medium text-white visited:text-white hover:text-white focus:text-white"
          >
            {row.order.orderType === "naja" ? "صدور فاکتور ناجا" : "بررسی و تطبیق"}
          </Link>
          <Link
            href={
              row.order.orderType === "naja"
                ? `/finance/orders/${row.order.objectId}/naja-invoice`
                : `/finance/orders/${row.order.objectId}/reconcile`
            }
            className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#334155] hover:border-[#CBD5E1]"
          >
            مشاهده جزئیات
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="finance" title="آماده فاکتور">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو بر اساس کد سفارش، مشتری، ثبت کننده یا شماره حواله"
              className="pr-10"
            />
          </div>

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
            <Input
              type="date"
              value={deliveredDateFilter}
              onChange={(event) => setDeliveredDateFilter(event.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش های آماده فاکتور" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش های آماده فاکتور انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <InvoiceTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      ) : (
        <EmptyState
          title="سفارشی برای صدور فاکتور یافت نشد"
          description="فیلترها را تغییر دهید یا منتظر تایید تحویل سفارش های جدید بمانید."
        />
      )}
    </DashboardLayout>
  );
}
