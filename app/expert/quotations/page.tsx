"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlusCircle, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatDate, formatNumber } from "@/lib/expert/utils";
import type { SalesQuotation } from "@/lib/models/sales-quotation.model";
import { listSalesQuotations } from "@/lib/services/sales-quotation.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const STATUS_OPTIONS = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "finalized", label: "نهایی‌شده" },
  { value: "cancelled", label: "لغو شده" },
];

export default function ExpertQuotationsPage() {
  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    async function loadQuotations() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listSalesQuotations({
          search: search.trim() || undefined,
          status: statusFilter === "all" ? undefined : (statusFilter as any),
        });
        if (mounted) setQuotations(data);
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadQuotations();
    return () => {
      mounted = false;
    };
  }, [search, statusFilter]);

  const columns: DataTableColumn<SalesQuotation>[] = [
    {
      key: "number",
      header: "شماره",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">
          {formatFaDigits(row.quotationNumber)}
        </span>
      ),
    },
    {
      key: "customer",
      header: "مشتری",
      render: (row) => row.customerName || "-",
    },
    {
      key: "price-list",
      header: "لیست قیمت",
      render: (row) => row.priceListTitle || "-",
    },
    {
      key: "items",
      header: "تعداد کالا",
      render: (row) => formatNumber(row.items.length),
    },
    {
      key: "total",
      header: "مبلغ",
      render: (row) => formatCurrency(row.total),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => statusLabel(row.status),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Link
            href={`/expert/quotations/${row.objectId}`}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[#E5E7EB] px-3 text-xs font-medium text-[#334155]"
          >
            مشاهده
          </Link>
          <Link
            href={`/expert/quotations/${row.objectId}/edit`}
            className="btn-primary inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-medium text-white"
          >
            ویرایش
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="expert" title="پیش فاکتورها">
      <SectionHeader
        title="پیش فاکتورهای من"
        description="فهرست پیش فاکتورهای ثبت‌شده توسط کارشناس"
        actions={
          <Link
            href="/expert/quotations/new"
            className="inline-flex items-center gap-2 rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm font-medium text-white"
          >
            <PlusCircle className="size-4" />
            <span>پیش فاکتور جدید</span>
          </Link>
        }
      />
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="شماره، مشتری یا یادداشت را جستجو کنید"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>وضعیت</span>
            <SearchableSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={STATUS_OPTIONS}
              placeholder="همه وضعیت‌ها"
              searchPlaceholder="جستجو در وضعیت‌ها"
              emptyMessage="وضعیتی پیدا نشد"
            />
          </label>
          {search.trim() || statusFilter !== "all" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              <X className="size-4" />
              <span>پاک کردن</span>
            </Button>
          ) : null}
        </div>
      </section>
      {isLoading ? (
        <LoadingState title="در حال دریافت پیش فاکتورها" />
      ) : error ? (
        <PageErrorMessage title="دریافت پیش فاکتورها انجام نشد" message={error} />
      ) : quotations.length ? (
        <DataTable columns={columns} rows={quotations} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState
          title="پیش فاکتوری یافت نشد"
          description="هنوز پیش فاکتوری برای شما ثبت نشده است."
        />
      )}
    </DashboardLayout>
  );
}

function statusLabel(status: string): string {
  if (status === "finalized") return "نهایی‌شده";
  if (status === "cancelled") return "لغو شده";
  return "پیش‌نویس";
}
