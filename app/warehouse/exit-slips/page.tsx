"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
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
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { listExitSlips } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";
import { ListFilter, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface ExitSlipRow {
  slip: ExitSlip;
}

export default function WarehouseExitSlipsPage() {
  const [exitSlips, setExitSlips] = useState<ExitSlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadExitSlips() {
      setIsLoading(true);
      setError("");

      try {
        const data = await listExitSlips();
        if (isMounted) setExitSlips(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadExitSlips();

    return () => {
      isMounted = false;
    };
  }, []);

  const rows: ExitSlipRow[] = useMemo(() => {
    return exitSlips
      .map((slip) => ({ slip }))
      .filter((row) => {
        const query = search.toLowerCase();
        return (
          row.slip.slipCode.toLowerCase().includes(query) ||
          row.slip.orderCode.toLowerCase().includes(query) ||
          (row.slip.customerName ?? "").toLowerCase().includes(query)
        );
      })
      .filter((row) => {
        if (deliveryStatusFilter === "confirmed")
          return row.slip.deliveryConfirmed;
        if (deliveryStatusFilter === "pending")
          return !row.slip.deliveryConfirmed;
        return true;
      })
      .filter((row) => isWithinDateRange(row.slip.createdAt, dateFrom, dateTo))
      .sort(
        (a, b) =>
          Number(new Date(b.slip.createdAt)) -
          Number(new Date(a.slip.createdAt)),
      );
  }, [dateFrom, dateTo, deliveryStatusFilter, exitSlips, search]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    deliveryStatusFilter !== "all" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const columns: DataTableColumn<ExitSlipRow>[] = [
    {
      key: "slip",
      header: "شماره حواله",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">
          {formatFa(row.slip.slipCode)}
        </span>
      ),
    },
    {
      key: "order",
      header: "سفارش مرتبط",
      render: (row) => formatFa(row.slip.orderCode) || "-",
    },
    {
      key: "customer",
      header: "مشتری",
      render: (row) => row.slip.customerName || "-",
    },
    {
      key: "receiver",
      header: "گیرنده بار",
      render: (row) => row.slip.receiverFullName || "-",
    },
    {
      key: "status",
      header: "تأیید تحویل",
      render: (row) => (
        <Badge variant={row.slip.deliveryConfirmed ? "success" : "warning"}>
          {row.slip.deliveryConfirmed ? "تأیید شده" : "در انتظار تأیید"}
        </Badge>
      ),
    },
    {
      key: "created-at",
      header: "زمان ثبت",
      render: (row) => formatDateTime(row.slip.createdAt),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Link
          href={`/warehouse/exit-slips/${row.slip.objectId || row.slip.id}`}
          className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
        >
          مشاهده حواله
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="warehouse" title="حواله‌های خروج">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در حواله‌های خروج</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس شماره حواله، کد سفارش یا مشتری"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر تأیید تحویل</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={deliveryStatusFilter}
                onValueChange={setDeliveryStatusFilter}
                options={[
                  { value: "all", label: "همه وضعیت‌ها" },
                  { value: "confirmed", label: "تأیید شده" },
                  { value: "pending", label: "در انتظار تأیید" },
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
                setDeliveryStatusFilter("all");
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
        <LoadingState title="در حال دریافت حواله ها" />
      ) : error ? (
        <PageErrorMessage title="دریافت حواله ها انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.slip.objectId || row.slip.id}
        />
      ) : (
        <EmptyState
          title="حواله خروجی ثبت نشده"
          description="هنوز حواله خروجی برای سفارش ها ثبت نشده است."
        />
      )}
    </DashboardLayout>
  );
}

function formatFa(value: string): string {
  return formatFaDigits(value);
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
