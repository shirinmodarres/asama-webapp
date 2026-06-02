"use client";

import { ListFilter, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import {
  getOrderStatusLabel,
  getWarehouseStatusLabel,
} from "@/lib/domain/statuses";
import { formatDate } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { listOrders } from "@/lib/services/order.service";

type TrackingFilter =
  | "all"
  | "pending"
  | "needs_review"
  | "review_resolved"
  | "approved"
  | "cancelled"
  | "voided"
  | "dispatchIssued"
  | "delivered"
  | "invoiced"
  | "returned"
  | "returnedAfterInvoice";

export default function ManagerOrderTrackingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TrackingFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const data = await listOrders();
        if (isMounted) setOrders(data);
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

  const filteredOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)),
      )
      .filter((order) => {
        const matchesSearch =
          order.code.toLowerCase().includes(search.toLowerCase()) ||
          (order.createdByName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (order.customerName ?? "")
            .toLowerCase()
            .includes(search.toLowerCase());

        if (!matchesSearch) return false;
        if (filter === "all") return true;
        if (filter === "dispatchIssued")
          return order.warehouseStatus === "dispatchIssued";
        if (filter === "delivered")
          return order.warehouseStatus === "delivered";
        if (filter === "invoiced") return order.orderStatus === "invoiced";
        return order.orderStatus === filter;
      })
      .filter((order) => isWithinDateRange(order.updatedAt, dateFrom, dateTo));
  }, [dateFrom, dateTo, filter, orders, search]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    filter !== "all" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const columns: DataTableColumn<Order>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">{row.code}</span>
      ),
    },
    {
      key: "source",
      header: "منبع",
      render: (row) => (row.orderType === "naja" ? "ناجا" : "عادی"),
    },
    { key: "creator", header: "ثبت کننده", render: (row) => row.createdByName },
    {
      key: "customer",
      header: "مشتری",
      render: (row) => row.customerName ?? "-",
    },
    {
      key: "order-status",
      header: "وضعیت سفارش",
      render: (row) => <StatusBadge type="order" status={row.orderStatus} />,
    },
    {
      key: "warehouse-status",
      header: "وضعیت انبار",
      render: (row) => (
        <StatusBadge type="warehouse" status={row.warehouseStatus} />
      ),
    },
    {
      key: "updated",
      header: "تاریخ آخرین تغییر",
      render: (row) => formatDate(row.updatedAt),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Link
          href={`/manager/orders/${row.objectId}`}
          className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
        >
          مشاهده جزئیات
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="manager" title="سفارش‌ها">
      <SectionHeader
        title="روند سفارش‌ها"
        description="پایش وضعیت سفارش‌ها از ثبت تا فاکتور"
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در سفارش‌ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس کد سفارش، مشتری یا ثبت کننده"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={filter}
                onValueChange={(value) => setFilter(value as TrackingFilter)}
                options={[
                  { value: "all", label: "همه وضعیت‌ها" },
                  { value: "pending", label: getOrderStatusLabel("pending") },
                  {
                    value: "needs_review",
                    label: getOrderStatusLabel("needs_review"),
                  },
                  {
                    value: "review_resolved",
                    label: getOrderStatusLabel("review_resolved"),
                  },
                  { value: "approved", label: getOrderStatusLabel("approved") },
                  {
                    value: "cancelled",
                    label: getOrderStatusLabel("cancelled"),
                  },
                  { value: "voided", label: getOrderStatusLabel("voided") },
                  {
                    value: "dispatchIssued",
                    label: getWarehouseStatusLabel("dispatchIssued"),
                  },
                  {
                    value: "delivered",
                    label: getWarehouseStatusLabel("delivered"),
                  },
                  { value: "invoiced", label: getOrderStatusLabel("invoiced") },
                  { value: "returned", label: getOrderStatusLabel("returned") },
                  {
                    value: "returnedAfterInvoice",
                    label: getOrderStatusLabel("returnedAfterInvoice"),
                  },
                ]}
                placeholder="همه وضعیت‌ها"
                searchPlaceholder="جستجو در وضعیت‌ها"
                emptyMessage="وضعیتی پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
          <DateRangeFilter
            value={{ from: dateFrom, to: dateTo }}
            onChange={(range) => {
              setDateFrom(range.from ?? "");
              setDateTo(range.to ?? "");
            }}
          />
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-fit shrink-0 items-center gap-2"
              onClick={() => {
                setSearch("");
                setFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              <span>حذف فیلترها</span>
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش ها" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش ها انجام نشد" message={error} />
      ) : filteredOrders.length > 0 ? (
        <DataTable
          columns={columns}
          rows={filteredOrders}
          rowKey={(row) => row.objectId || row.id}
        />
      ) : (
        <EmptyState
          title="سفارشی با این فیلتر یافت نشد"
          description="فیلترهای انتخابی را تغییر دهید."
        />
      )}
    </DashboardLayout>
  );
}

function isWithinDateRange(
  value: string,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  if (dateFrom && timestamp < new Date(`${dateFrom}T00:00:00`).getTime())
    return false;
  if (dateTo && timestamp > new Date(`${dateTo}T23:59:59`).getTime())
    return false;
  return true;
}
