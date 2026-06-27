"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListFilter, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  getWebsiteOrderStatusLabel,
  getWebsitePaymentStatusLabel,
} from "@/lib/mappers/shop.mapper";
import type { WebsiteOrder } from "@/lib/models/shop.model";
import { listWebsiteOrders } from "@/lib/services/shop-admin.service";
import { getErrorMessage } from "@/lib/api/api-error";
import {
  formatFaCurrency,
  formatFaDigits,
} from "@/lib/utils/number-format";
import { formatDateTime } from "@/lib/expert/utils";

const ORDER_STATUS_OPTIONS = [
  "pending_payment",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
  "refunded",
];

const PAYMENT_STATUS_OPTIONS = ["unpaid", "pending", "paid", "failed", "refunded"];

export default function SupportShopOrdersPage() {
  const [orders, setOrders] = useState<WebsiteOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listWebsiteOrders();
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

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const query = search.trim().toLowerCase();
          const matchesSearch =
            !query ||
            order.orderNumber.toLowerCase().includes(query) ||
            order.customerMobile.toLowerCase().includes(query) ||
            order.customerName.toLowerCase().includes(query);
          const matchesOrderStatus =
            orderStatus === "all" || order.orderStatus === orderStatus;
          const matchesPaymentStatus =
            paymentStatus === "all" || order.paymentStatus === paymentStatus;
          const matchesDate = isWithinDateRange(order.createdAt, dateFrom, dateTo);
          return (
            matchesSearch &&
            matchesOrderStatus &&
            matchesPaymentStatus &&
            matchesDate
          );
        })
        .sort(
          (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
        ),
    [dateFrom, dateTo, orderStatus, orders, paymentStatus, search],
  );

  const hasActiveFilters =
    search.trim() || orderStatus !== "all" || paymentStatus !== "all" || dateFrom || dateTo;

  const columns: DataTableColumn<WebsiteOrder>[] = [
    {
      key: "orderNumber",
      header: "شماره سفارش",
      render: (row) => formatFaDigits(row.orderNumber) || "-",
    },
    { key: "customer", header: "مشتری", render: (row) => row.customerName || "-" },
    {
      key: "mobile",
      header: "موبایل",
      render: (row) => formatFaDigits(row.customerMobile) || "-",
    },
    {
      key: "amount",
      header: "مبلغ نهایی",
      render: (row) => formatFaCurrency(row.finalAmount),
    },
    {
      key: "payment",
      header: "پرداخت",
      render: (row) => (
        <Badge variant={row.paymentStatus === "paid" ? "success" : "warning"}>
          {row.paymentStatusLabel}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "وضعیت سفارش",
      render: (row) => <ShopOrderStatusBadge status={row.orderStatus} label={row.orderStatusLabel} />,
    },
    {
      key: "city",
      header: "استان/شهر",
      render: (row) => [row.province, row.city].filter(Boolean).join(" / ") || "-",
    },
    {
      key: "createdAt",
      header: "تاریخ",
      render: (row) => (row.createdAt ? formatDateTime(row.createdAt) : "-"),
    },
    {
      key: "actions",
      header: "عملیات",
      sticky: "left",
      render: (row) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/support/shop/orders/${row.objectId}`}>جزئیات</Link>
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="سفارش‌های سایت">
      <SectionHeader
        title="فهرست سفارش‌های سایت"
        description="سفارش‌های ثبت‌شده در فروشگاه عمومی را پیگیری کنید."
      />
      {error ? <InlineErrorMessage message={error} /> : null}

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در سفارش‌های سایت</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="شماره سفارش، موبایل یا نام مشتری"
                className="pr-10"
              />
            </div>
          </label>
          <FilterSelect
            label="وضعیت سفارش"
            value={orderStatus}
            onChange={setOrderStatus}
            options={[
              { value: "all", label: "همه وضعیت‌ها" },
              ...ORDER_STATUS_OPTIONS.map((status) => ({
                value: status,
                label: getWebsiteOrderStatusLabel(status),
              })),
            ]}
          />
          <FilterSelect
            label="وضعیت پرداخت"
            value={paymentStatus}
            onChange={setPaymentStatus}
            options={[
              { value: "all", label: "همه پرداخت‌ها" },
              ...PAYMENT_STATUS_OPTIONS.map((status) => ({
                value: status,
                label: getWebsitePaymentStatusLabel(status),
              })),
            ]}
          />
          <DateRangeFilter
            value={{ from: dateFrom, to: dateTo }}
            onChange={(value) => {
              setDateFrom(value.from ?? null);
              setDateTo(value.to ?? null);
            }}
          />
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit shrink-0"
              onClick={() => {
                setSearch("");
                setOrderStatus("all");
                setPaymentStatus("all");
                setDateFrom(null);
                setDateTo(null);
              }}
            >
              حذف فیلترها
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش‌های سایت" />
      ) : filteredOrders.length ? (
        <DataTable columns={columns} rows={filteredOrders} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState
          title="سفارشی در سایت پیدا نشد"
          description="فیلترها را تغییر دهید یا بعد از ثبت سفارش‌های سایت دوباره بررسی کنید."
        />
      )}
    </DashboardLayout>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-52">
      <span>{label}</span>
      <div className="relative">
        <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
        <SearchableSelect
          value={value}
          onValueChange={onChange}
          options={options}
          placeholder="انتخاب"
          searchPlaceholder="جستجو"
          emptyMessage="گزینه‌ای پیدا نشد"
          triggerClassName="pr-10"
        />
      </div>
    </label>
  );
}

function ShopOrderStatusBadge({ status, label }: { status: string; label: string }) {
  const variant =
    status === "delivered"
      ? "success"
      : status === "cancelled" || status === "payment_failed" || status === "refunded"
        ? "destructive"
        : status === "processing" || status === "packed" || status === "shipped"
          ? "brand"
          : "warning";
  return <Badge variant={variant}>{label}</Badge>;
}

function isWithinDateRange(
  dateValue: string,
  from?: string | null,
  to?: string | null,
): boolean {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return true;
  if (from && date < new Date(`${from}T00:00:00`)) return false;
  if (to && date > new Date(`${to}T23:59:59`)) return false;
  return true;
}
