"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Eye, RefreshCw, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { SepidarStock } from "@/lib/models/stock.model";
import { syncSepidarStocks } from "@/lib/services/sepidar.service";
import { listSupportStocks } from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function SupportWarehousesPage() {
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadStocks = async () => {
    const data = await listSupportStocks();
    setStocks(data);
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listSupportStocks();
        if (isMounted) setStocks(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stocks.filter(
      (stock) =>
        !query ||
        stock.title.toLowerCase().includes(query) ||
        (stock.code ?? "").toLowerCase().includes(query),
    );
  }, [search, stocks]);

  const syncStocks = async () => {
    setIsSyncing(true);
    setError("");
    setMessage("");
    try {
      const result = await syncSepidarStocks();
      await loadStocks();
      setMessage(
        `همگام‌سازی انبارهای سپیدار انجام شد. ${formatNumber(result.processed)} مورد پردازش شد.`,
      );
    } catch (syncError) {
      setError(getErrorMessage(syncError));
    } finally {
      setIsSyncing(false);
    }
  };

  const columns: DataTableColumn<SepidarStock>[] = [
    {
      key: "code",
      header: "کد انبار",
      render: (row) => (row.code ? formatFaDigits(row.code) : "-"),
    },
    { key: "title", header: "نام انبار", render: (row) => row.title || "-" },
    {
      key: "real",
      header: "موجودی واقعی",
      render: (row) => formatNumber(row.realInventoryCount),
    },
    {
      key: "sales",
      header: "موجودی فروش",
      render: (row) => formatNumber(row.salesInventoryCount),
    },
    {
      key: "reserved",
      header: "موجودی رزروشده",
      render: (row) => formatNumber(row.reservedInventoryCount),
    },
    {
      key: "available-sales",
      header: "موجودی قابل فروش",
      render: (row) => formatNumber(row.availableSalesInventoryCount),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "neutral"} dot>
          {row.isActive ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
    {
      key: "synced-at",
      header: "آخرین همگام‌سازی",
      render: (row) =>
        row.lastSepidarSyncAt ? formatDateTime(row.lastSepidarSyncAt) : "-",
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/support/warehouses/${row.objectId}`}>
              <Eye className="size-4" />
              مشاهده موجودی
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/support/stock-transfers">
              <ArrowLeftRight className="size-4" />
              مشاهده انتقال‌ها
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="انبارها">
      <SectionHeader
        title="انبارهای سپیدار"
        description="مشاهده موجودی و وضعیت انبارهای همگام‌سازی‌شده از سپیدار"
        actions={
          <Button type="button" onClick={syncStocks} disabled={isSyncing}>
            <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing
              ? "در حال همگام‌سازی..."
              : "همگام‌سازی انبارهای سپیدار"}
          </Button>
        }
      />

      {message ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {error && !isLoading && stocks.length > 0 ? (
        <InlineErrorMessage message={error} />
      ) : null}

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در انبارها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس کد یا نام انبار"
                className="pr-10"
              />
            </div>
          </label>
          {search ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => setSearch("")}
            >
              حذف فیلترها
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت انبارهای سپیدار" />
      ) : error && stocks.length === 0 ? (
        <PageErrorMessage
          title="دریافت انبارهای سپیدار انجام نشد"
          message={error}
        />
      ) : rows.length ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState
          title="انبار سپیداری یافت نشد"
          description="ابتدا انبارها را از سپیدار همگام‌سازی کنید."
        />
      )}
    </DashboardLayout>
  );
}
