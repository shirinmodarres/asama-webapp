"use client";

import { ListFilter, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { getOrderStatusLabel } from "@/lib/domain/statuses";
import { formatDate } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { listOrders } from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function NajaOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const data = await listOrders({ orderType: "naja" });
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

  const rows = useMemo(
    () =>
      orders
        .filter((order) => order.orderType === "naja")
        .filter((order) => {
          const query = search.toLowerCase().trim();
          if (!query) return true;
          return (
            order.code.toLowerCase().includes(query) ||
            (order.customerName ?? "").toLowerCase().includes(query) ||
            (order.customerNationalId ?? "").toLowerCase().includes(query) ||
            (order.customerPhone ?? "").toLowerCase().includes(query)
          );
        })
        .filter((order) => statusFilter === "all" || order.orderStatus === statusFilter)
        .filter((order) => isWithinDateRange(order.updatedAt, dateFrom, dateTo))
        .sort(
          (a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)),
        ),
    [dateFrom, dateTo, orders, search, statusFilter],
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "همه وضعیت‌ها" },
      ...Array.from(new Set(orders.map((order) => order.orderStatus).filter(Boolean))).map((status) => ({
        value: status,
        label: getOrderStatusLabel(status),
      })),
    ],
    [orders],
  );

  const columns: DataTableColumn<Order>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">{row.code}</span>
      ),
    },
    { key: "customer", header: "نام مشتری", render: (row) => row.customerName ?? "-" },
    { key: "nationalId", header: "کد ملی", render: (row) => row.customerNationalId ? formatFaDigits(row.customerNationalId) : "-" },
    { key: "phone", header: "شماره موبایل", render: (row) => row.customerPhone ? formatFaDigits(row.customerPhone) : "-" },
    {
      key: "orderStatus",
      header: "وضعیت سفارش",
      render: (row) => <StatusBadge type="order" status={row.orderStatus} />,
    },
    {
      key: "warehouseStatus",
      header: "وضعیت انبار",
      render: (row) => <StatusBadge type="warehouse" status={row.warehouseStatus} />,
    },
    {
      key: "updatedAt",
      header: "آخرین تغییر",
      render: (row) => formatDate(row.updatedAt),
    },
    {
      key: "actions",
      header: "عملیات",
      sticky: "left",
      headerClassName: "min-w-[150px]",
      cellClassName: "min-w-[150px]",
      render: (row) => (
        <Link
          href={`/naja/orders/${row.objectId}`}
          className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
        >
          مشاهده جزئیات
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="naja" title="سفارش های ناجا">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در سفارش‌ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو بر اساس کد سفارش، مشتری، کد ملی یا موبایل" className="pr-10" />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>فیلتر وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} placeholder="همه وضعیت‌ها" searchPlaceholder="جستجو در وضعیت‌ها" emptyMessage="وضعیتی پیدا نشد" triggerClassName="pr-10" />
            </div>
          </label>
          <DateRangeFilter
            value={{ from: dateFrom, to: dateTo }}
            onChange={(range) => {
              setDateFrom(range.from ?? "");
              setDateTo(range.to ?? "");
            }}
          />
          <Button type="button" variant="outline" className="w-fit shrink-0" onClick={() => { setSearch(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}>
            پاک کردن فیلترها
          </Button>
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش های ناجا" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش های ناجا انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.objectId || row.id} />
      ) : (
        <EmptyState
          title="سفارش ناجایی یافت نشد"
          description="فیلتر را تغییر دهید یا سفارش جدید ثبت کنید."
        />
      )}
    </DashboardLayout>
  );
}

function isWithinDateRange(value: string, dateFrom: string, dateTo: string): boolean {
  if (!dateFrom && !dateTo) return true;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  if (dateFrom && timestamp < new Date(`${dateFrom}T00:00:00`).getTime()) return false;
  if (dateTo && timestamp > new Date(`${dateTo}T23:59:59`).getTime()) return false;
  return true;
}
