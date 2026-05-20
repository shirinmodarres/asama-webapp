"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InvoiceTable } from "@/components/finance/invoice-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import type { DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { Invoice } from "@/lib/models/invoice.model";
import { listInvoices } from "@/lib/services/invoice.service";
import { ListFilter, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface InvoiceRow {
  id: string;
  invoice: Invoice;
  orderCode: string;
  createdBy: string;
}

export default function FinanceInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
        const data = await listInvoices();
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

  const rows = useMemo<InvoiceRow[]>(() => {
    return [...invoices]
      .sort(
        (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
      )
      .map((invoice) => ({
        id: invoice.objectId || invoice.id,
        invoice,
        orderCode: invoice.orderCode || "-",
        createdBy: invoice.createdByName || "-",
      }))
      .filter((row) => {
        const query = search.toLowerCase().trim();
        if (!query) return true;
        return (
          row.invoice.invoiceCode.toLowerCase().includes(query) ||
          row.orderCode.toLowerCase().includes(query) ||
          row.createdBy.toLowerCase().includes(query)
        );
      })
      .filter(
        (row) =>
          statusFilter === "all" || row.invoice.status === statusFilter,
      )
      .filter((row) => isWithinDateRange(row.invoice.createdAt, dateFrom, dateTo));
  }, [dateFrom, dateTo, invoices, search, statusFilter]);

  const columns: DataTableColumn<InvoiceRow>[] = [
    {
      key: "invoiceNumber",
      header: "شماره فاکتور",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">
          {row.invoice.invoiceCode}
        </span>
      ),
    },
    { key: "orderCode", header: "کد سفارش", render: (row) => row.orderCode },
    { key: "creator", header: "ثبت کننده", render: (row) => row.createdBy },
    {
      key: "issuedAt",
      header: "تاریخ صدور",
      render: (row) => formatDateTime(row.invoice.createdAt),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) =>
        row.invoice.status === "needs_follow_up" ? "نیازمند پیگیری" : "صادر شده",
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Link
          href={`/finance/invoices/${row.invoice.objectId || row.invoice.id}`}
          className="btn-primary rounded-xl px-3 py-1.5 text-xs font-medium text-white visited:text-white hover:text-white focus:text-white"
        >
          مشاهده فاکتور
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="finance" title="فاکتورها">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در فاکتورها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس شماره فاکتور، کد سفارش، مشتری یا ثبت کننده"
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
                  { value: "issued", label: "صادر شده" },
                  { value: "needs_follow_up", label: "نیازمند پیگیری" },
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
          <Button type="button" variant="outline" className="w-fit shrink-0" onClick={() => { setSearch(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}>
            پاک کردن فیلترها
          </Button>
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت فاکتورها" />
      ) : error ? (
        <PageErrorMessage title="دریافت فاکتورها انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <InvoiceTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      ) : (
        <EmptyState
          title="فاکتوری یافت نشد"
          description="هنوز فاکتوری صادر نشده یا عبارت جستجو نتیجه ای ندارد."
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
