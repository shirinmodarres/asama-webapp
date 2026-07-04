"use client";

import { Download, ListFilter, Search, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { getOrderStatusLabel } from "@/lib/domain/statuses";
import { formatDate } from "@/lib/expert/utils";
import type {
  NajaRialReport,
  NajaRialReportFilters,
  NajaRialReportRow,
} from "@/lib/models/naja.model";
import { getNajaRialReport } from "@/lib/services/naja.service";
import {
  formatFaCurrency,
  formatFaDigits,
  formatFaNumber,
} from "@/lib/utils/number-format";

const EMPTY_REPORT: NajaRialReport = {
  rows: [],
  totals: {
    totalOrders: 0,
    totalQuantity: 0,
    totalRialAmount: 0,
  },
};

export default function NajaRialReportPage() {
  const [report, setReport] = useState<NajaRialReport>(EMPTY_REPORT);
  const [optionRows, setOptionRows] = useState<NajaRialReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<NajaRialReportFilters>({});

  useEffect(() => {
    let isMounted = true;

    async function loadInitialOptions() {
      try {
        const data = await getNajaRialReport();
        if (isMounted) setOptionRows(data.rows);
      } catch {
        if (isMounted) setOptionRows([]);
      }
    }

    loadInitialOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadReport() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getNajaRialReport(filters);
        if (isMounted) setReport(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReport();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return report.rows;
    return report.rows.filter((row) =>
      [
        row.orderCode,
        row.customerName,
        row.recipientFullName,
        row.recipientNationalId,
        row.recipientMobile,
        row.najaOrderNumber,
        row.productName,
        row.stockTitle,
        row.saleTypeTitle,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [report.rows, search]);

  const customerOptions = uniqueOptions(optionRows, "customerObjectId", "customerName");
  const saleTypeOptions = uniqueOptions(optionRows, "saleTypeObjectId", "saleTypeTitle");
  const stockOptions = uniqueOptions(optionRows, "stockObjectId", "stockTitle");
  const statusOptions = [
    { value: "all", label: "همه وضعیت‌ها" },
    ...Array.from(new Set(optionRows.map((row) => row.orderStatus).filter(Boolean))).map(
      (status) => ({ value: status, label: getOrderStatusLabel(status) }),
    ),
  ];
  const hasActiveFilters =
    search.trim() ||
    Object.values(filters).some((value) => value !== undefined && value !== "");

  const columns: DataTableColumn<NajaRialReportRow>[] = [
    {
      key: "orderCode",
      header: "کد سفارش",
      render: (row) => formatFaDigits(row.orderCode),
    },
    {
      key: "createdAt",
      header: "تاریخ ثبت",
      render: (row) => (row.createdAt ? formatDate(row.createdAt) : "-"),
    },
    {
      key: "najaPurchaseDate",
      header: "تاریخ سفارش",
      render: (row) =>
        row.najaPurchaseDate ? formatDate(row.najaPurchaseDate) : "-",
    },
    {
      key: "customerName",
      header: "مشتری/مرکز",
      render: (row) => row.customerName || "-",
    },
    {
      key: "recipient",
      header: "تحویل‌گیرنده",
      render: (row) => row.recipientFullName || "-",
    },
    {
      key: "nationalId",
      header: "کد ملی",
      render: (row) =>
        row.recipientNationalId ? formatFaDigits(row.recipientNationalId) : "-",
    },
    {
      key: "mobile",
      header: "موبایل",
      render: (row) =>
        row.recipientMobile ? formatFaDigits(row.recipientMobile) : "-",
    },
    {
      key: "najaOrderNumber",
      header: "شماره سفارش",
      render: (row) =>
        row.najaOrderNumber ? formatFaDigits(row.najaOrderNumber) : "-",
    },
    {
      key: "productName",
      header: "کالا",
      render: (row) => row.productName || "-",
    },
    {
      key: "quantity",
      header: "تعداد",
      render: (row) => formatFaNumber(row.quantity),
    },
    {
      key: "unitPrice",
      header: "قیمت واحد",
      render: (row) => formatFaCurrency(row.unitPrice),
    },
    {
      key: "lineTotal",
      header: "مبلغ ردیف",
      render: (row) => formatFaCurrency(row.lineTotal),
    },
    {
      key: "orderTotal",
      header: "جمع سفارش",
      render: (row) => formatFaCurrency(row.orderTotal),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => <StatusBadge type="order" status={row.orderStatus} />,
    },
    {
      key: "stock",
      header: "انبار",
      render: (row) => row.stockTitle || "-",
    },
    {
      key: "saleType",
      header: "نوع فروش",
      render: (row) => row.saleTypeTitle || "-",
    },
  ];

  return (
    <DashboardLayout role="naja" title="گزارش مالی سفارش‌های ناجا">
      <SectionHeader
        title="گزارش مالی تفکیکی سفارش‌های ناجا"
        description="بررسی ردیف‌های کالا، مبالغ ریالی، مراکز سپیدار و اطلاعات تحویل‌گیرنده"
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-4 lg:items-end">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در گزارش</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="کد سفارش، مشتری، تحویل‌گیرنده، موبایل یا کالا"
                className="pr-10"
              />
            </div>
          </label>
          <SelectFilter
            label="فیلتر وضعیت"
            value={filters.orderStatus || "all"}
            options={statusOptions}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                orderStatus: value === "all" ? undefined : value,
              }))
            }
          />
          <SelectFilter
            label="مشتری/مرکز"
            value={filters.customerObjectId || "all"}
            options={[{ value: "all", label: "همه مشتری‌ها" }, ...customerOptions]}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                customerObjectId: value === "all" ? undefined : value,
              }))
            }
          />
          <DateRangeFilter
            value={{ from: filters.dateFrom, to: filters.dateTo }}
            onChange={(range) =>
              setFilters((current) => ({
                ...current,
                dateFrom: range.from || undefined,
                dateTo: range.to || undefined,
              }))
            }
          />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-4 lg:items-end">
          <SelectFilter
            label="نوع فروش"
            value={filters.saleTypeObjectId || "all"}
            options={[{ value: "all", label: "همه نوع‌ها" }, ...saleTypeOptions]}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                saleTypeObjectId: value === "all" ? undefined : value,
              }))
            }
          />
          <SelectFilter
            label="انبار"
            value={filters.stockObjectId || "all"}
            options={[{ value: "all", label: "همه انبارها" }, ...stockOptions]}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                stockObjectId: value === "all" ? undefined : value,
              }))
            }
          />
          <div className="flex flex-wrap items-end justify-start gap-2 lg:col-span-2 lg:justify-end">
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                className="inline-flex w-full items-center gap-2 sm:w-auto"
                onClick={() => {
                  setSearch("");
                  setFilters({});
                }}
              >
                <span>حذف فیلترها</span>
                <X className="size-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-full items-center gap-2 sm:w-auto"
              onClick={() => exportReportCsv(rows)}
              disabled={rows.length === 0}
            >
              <Download className="size-4" />
              خروجی اکسل
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryBox label="کل سفارش‌ها" value={formatFaNumber(report.totals.totalOrders)} />
        <SummaryBox label="جمع تعداد کالا" value={formatFaNumber(report.totals.totalQuantity)} />
        <SummaryBox label="جمع مبلغ ریالی" value={formatFaCurrency(report.totals.totalRialAmount)} />
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت گزارش" />
      ) : error ? (
        <PageErrorMessage title="دریافت گزارش انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      ) : (
        <EmptyState
          title="رکوردی برای گزارش پیدا نشد"
          description="فیلترها را تغییر دهید یا بازه زمانی دیگری انتخاب کنید."
        />
      )}
    </DashboardLayout>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      <div className="relative">
        <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
        <SearchableSelect
          value={value}
          onValueChange={onChange}
          options={options}
          placeholder="همه"
          searchPlaceholder="جستجو"
          emptyMessage="گزینه‌ای پیدا نشد"
          triggerClassName="pr-10"
        />
      </div>
    </label>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#64748B]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#102034]">{value}</p>
    </div>
  );
}

function uniqueOptions(
  rows: NajaRialReportRow[],
  valueKey: keyof NajaRialReportRow,
  labelKey: keyof NajaRialReportRow,
) {
  const map = new Map<string, string>();
  rows.forEach((row) => {
    const value = row[valueKey];
    const label = row[labelKey];
    if (value && label) map.set(String(value), String(label));
  });
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
}

function exportReportCsv(rows: NajaRialReportRow[]) {
  const headers = [
    "orderCode",
    "createdAt",
    "najaPurchaseDate",
    "customerName",
    "recipientFullName",
    "recipientNationalId",
    "recipientMobile",
    "najaOrderNumber",
    "productName",
    "quantity",
    "unitPrice",
    "lineTotal",
    "orderTotal",
    "orderStatus",
    "stockTitle",
    "saleTypeTitle",
  ];
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.orderCode,
        row.createdAt,
        row.najaPurchaseDate,
        row.customerName,
        row.recipientFullName,
        row.recipientNationalId,
        row.recipientMobile,
        row.najaOrderNumber,
        row.productName,
        row.quantity,
        row.unitPrice,
        row.lineTotal,
        row.orderTotal,
        row.orderStatusLabel || row.orderStatus,
        row.stockTitle,
        row.saleTypeTitle,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];
  const blob = new Blob([`\uFEFF${csvRows.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `naja-rial-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
