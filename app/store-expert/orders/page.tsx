"use client";

import Link from "next/link";
import { ListFilter, PlusCircle, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { getOrderStatusLabel } from "@/lib/domain/statuses";
import { formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { listStoreOrders } from "@/lib/services/store-expert-order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const PAGE_SIZE = 20;
const STORE_STATUSES = [
  "store_quotation_pending",
  "store_quotation_pending_verification",
  "store_quotation_failed",
  "approved",
];

export default function StoreExpertOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await listStoreOrders({ page: pagination.page, pageSize: PAGE_SIZE, search: deferredSearch, status }, controller.signal);
        if (mounted) {
          setOrders(result.items);
          setPagination(result.pagination);
        }
      } catch (loadError) {
        if (mounted && !controller.signal.aborted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; controller.abort(); };
  }, [deferredSearch, pagination.page, status]);

  const statusOptions = useMemo(() => [
    { value: "all", label: "همه وضعیت‌ها" },
    ...Array.from(new Set([...STORE_STATUSES, ...orders.map((order) => order.orderStatus)])).map((value) => ({ value, label: getOrderStatusLabel(value) })),
  ], [orders]);

  const columns: DataTableColumn<Order>[] = [
    { key: "code", header: "کد سفارش", render: (row) => <span className="font-semibold text-[var(--foreground)]">{formatFaDigits(row.code)}</span> },
    { key: "customer", header: "مشتری", render: (row) => <div><p>{row.customerName || "-"}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatFaDigits(row.sepidarCustomerCode || "-")}</p></div> },
    { key: "brand", header: "برند", render: (row) => row.priceListBrand || "-" },
    { key: "stock", header: "انبار", render: (row) => row.stockTitle || "-" },
    { key: "quantity", header: "تعداد", render: (row) => formatNumber(row.items.reduce((total, item) => total + item.quantity, 0)) },
    { key: "quotation", header: "پیش‌فاکتور", render: (row) => <QuotationState order={row} compact /> },
    { key: "warehouse", header: "خروج کالا", render: (row) => <StatusBadge type="warehouse" status={row.warehouseStatus} /> },
    { key: "date", header: "تاریخ ثبت", render: (row) => formatDate(row.createdAt) },
    { key: "actions", header: "عملیات", sticky: "left", render: (row) => <Link href={`/store-expert/orders/${row.objectId}`} className="inline-flex h-9 items-center rounded-lg border border-[var(--border)] px-3 text-xs font-medium text-[var(--foreground)] hover:bg-muted">مشاهده جزئیات</Link> },
  ];

  return <DashboardLayout role="store-expert" title="پیگیری سفارش‌ها">
    <SectionHeader title="سفارش‌های فروشگاه" description="وضعیت ثبت پیش‌فاکتور، خروج کالا و فاکتور سفارش‌های خودتان را پیگیری کنید." actions={<Link href="/store-expert/orders/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><PlusCircle className="size-4" />ثبت سفارش فروشگاه</Link>} />
    <section className="rounded-lg border border-[var(--border)] bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]"><label className="grid gap-2 text-sm font-medium text-[var(--foreground)]"><span>جستجو</span><div className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} className="pr-10" placeholder="کد سفارش، نام مشتری، کد مشتری یا انبار" /></div></label><label className="grid gap-2 text-sm font-medium text-[var(--foreground)]"><span>وضعیت</span><div className="relative"><ListFilter className="pointer-events-none absolute right-3 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" /><SearchableSelect value={status} onValueChange={(value) => { setStatus(value); setPagination((current) => ({ ...current, page: 1 })); }} options={statusOptions} className="pr-10" /></div></label></div></section>
    {loading ? <LoadingState title="در حال دریافت سفارش‌ها" /> : error ? <PageErrorMessage title="دریافت سفارش‌ها انجام نشد" message={error} /> : orders.length ? <><DataTable columns={columns} rows={orders} rowKey={(row) => row.objectId} /><PaginationBar currentPage={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.total} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} /></> : <EmptyState title="سفارشی یافت نشد" description="عبارت جستجو یا فیلتر وضعیت را تغییر دهید." />}
  </DashboardLayout>;
}

export function QuotationState({ order, compact = false }: { order: Order; compact?: boolean }) {
  if (order.quotationSyncStatus === "success" || order.sepidarQuotationId) return <div className="space-y-1"><StatusBadge type="order" status="approved" /><p className="text-xs text-[var(--muted-foreground)]">{order.sepidarQuotationNumber ? `شماره: ${formatFaDigits(order.sepidarQuotationNumber)}` : "ثبت شد"}</p></div>;
  if (order.quotationSyncStatus === "pending_verification" || order.orderStatus === "store_quotation_pending_verification") return <div className="space-y-1"><span className="text-sm font-medium text-amber-700 dark:text-amber-300">در انتظار بررسی سپیدار</span>{!compact && <p className="text-sm text-[var(--muted-foreground)]">پاسخ سپیدار قطعی نبوده است؛ برای جلوگیری از ثبت تکراری، سفارش دوباره ارسال نمی‌شود.</p>}</div>;
  if (order.quotationSyncStatus === "failed" || order.orderStatus === "store_quotation_failed") return <div className="space-y-1"><span className="text-sm font-medium text-destructive">ثبت پیش‌فاکتور ناموفق</span>{!compact && <p className="text-sm text-destructive">{order.quotationSyncError || order.sepidarLastError || "خطای نامشخص سپیدار"}</p>}</div>;
  return <div className="space-y-1"><span className="text-sm font-medium text-[var(--muted-foreground)]">در حال ثبت پیش‌فاکتور</span>{!compact && <p className="text-sm text-[var(--muted-foreground)]">نتیجه ثبت پیش‌فاکتور هنوز دریافت نشده است.</p>}</div>;
}
