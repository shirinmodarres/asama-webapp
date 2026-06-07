"use client";

import Link from "next/link";
import { ListFilter, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { InternalInvoice } from "@/lib/models/internal-invoice.model";
import { listInternalInvoices } from "@/lib/services/internal-invoice.service";
import { formatFaCurrency, formatFaDigits } from "@/lib/utils/number-format";

export default function InternalInvoicesPage() {
  const [invoices, setInvoices] = useState<InternalInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInvoices() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listInternalInvoices();
        if (isMounted) setInvoices(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInvoices();
    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo(
    () =>
      [...invoices]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .filter((invoice) => {
          const query = search.trim().toLowerCase();
          const matchesSearch =
            !query ||
            invoice.invoiceNumber.toLowerCase().includes(query) ||
            invoice.orderNumber.toLowerCase().includes(query) ||
            invoice.exitSlipNumber.toLowerCase().includes(query) ||
            (invoice.customerName ?? "").toLowerCase().includes(query) ||
            (invoice.stockTitle ?? "").toLowerCase().includes(query);
          const matchesStatus =
            statusFilter === "all" || invoice.status === statusFilter;
          return (
            matchesSearch &&
            matchesStatus &&
            isWithinDateRange(invoice.createdAt, dateFrom, dateTo)
          );
        }),
    [dateFrom, dateTo, invoices, search, statusFilter],
  );

  const columns: DataTableColumn<InternalInvoice>[] = [
    {
      key: "invoice",
      header: "شماره فاکتور داخلی",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">
          {formatFaDigits(row.invoiceNumber || row.id)}
        </span>
      ),
    },
    {
      key: "order",
      header: "شماره سفارش",
      render: (row) => formatFaDigits(row.orderNumber) || "-",
    },
    {
      key: "slip",
      header: "شماره حواله خروج",
      render: (row) => formatFaDigits(row.exitSlipNumber) || "-",
    },
    {
      key: "customer",
      header: "مشتری",
      render: (row) => row.customerName || "-",
    },
    {
      key: "stock",
      header: "انبار",
      render: (row) => row.stockTitle || "-",
    },
    {
      key: "net",
      header: "مبلغ خالص",
      render: (row) => formatFaCurrency(row.netAmount),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.status === "entered" ? "success" : "warning"} dot>
          {row.statusLabel}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "تاریخ ایجاد",
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Link
          href={`/accounting/internal-invoices/${row.objectId || row.id}`}
          className="btn-primary inline-flex rounded-xl px-3 py-2 text-xs font-medium text-white"
        >
          {row.status === "entered"
            ? "مشاهده جزئیات"
            : "مشاهده و ثبت در حسابداری"}
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="finance" title="فاکتورهای داخلی">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <label className="grid min-w-0 flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در فاکتورهای داخلی</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="شماره فاکتور، سفارش، حواله، مشتری یا انبار"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: "all", label: "همه وضعیت‌ها" },
                  { value: "ready", label: "آماده ثبت" },
                  { value: "pending_entry", label: "آماده ثبت" },
                  { value: "entered", label: "ثبت‌شده در حسابداری" },
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
            onChange={(value) => {
              setDateFrom(value.from ?? "");
              setDateTo(value.to ?? "");
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
          >
            <X className="size-4" />
            حذف فیلترها
          </Button>
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت فاکتورهای داخلی" />
      ) : error ? (
        <PageErrorMessage
          title="دریافت فاکتورهای داخلی انجام نشد"
          message={error}
        />
      ) : rows.length ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId || row.id}
        />
      ) : (
        <EmptyState
          title="فاکتور داخلی یافت نشد"
          description="هنوز حواله خروجی برای ثبت در حسابداری آماده نشده است."
        />
      )}
    </DashboardLayout>
  );
}

function isWithinDateRange(
  value: string,
  from: string,
  to: string,
): boolean {
  if (!from && !to) return true;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  if (from && timestamp < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && timestamp > new Date(`${to}T23:59:59`).getTime()) return false;
  return true;
}
