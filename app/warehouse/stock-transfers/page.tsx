"use client";

import { useEffect, useMemo, useState } from "react";
import { ListFilter, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { StockTransferRequest } from "@/lib/models/stock.model";
import { listWarehouseStockTransfers } from "@/lib/services/stock.service";

export default function WarehouseStockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listWarehouseStockTransfers();
        if (isMounted) setTransfers(data);
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
    return transfers.filter((transfer) => {
      const matchesStatus = status === "all" || transfer.status === status;
      const matchesSearch =
        !query ||
        (transfer.productName ?? "").toLowerCase().includes(query) ||
        (transfer.sourceStockTitle ?? "").toLowerCase().includes(query) ||
        (transfer.destinationStockTitle ?? "").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [search, status, transfers]);

  const columns: DataTableColumn<StockTransferRequest>[] = [
    {
      key: "source",
      header: "مبدأ",
      render: (row) => row.sourceStockTitle || "-",
    },
    {
      key: "destination",
      header: "مقصد",
      render: (row) => row.destinationStockTitle || "-",
    },
    {
      key: "quantity",
      header: "تعداد کالا",
      render: (row) => formatNumber(row.quantity),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge
          variant={
            row.status === "approved"
              ? "success"
              : row.status === "rejected"
                ? "destructive"
                : "warning"
          }
        >
          {row.statusLabel}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "تاریخ",
      render: (row) =>
        row.requestedAt ? formatDateTime(row.requestedAt) : "-",
    },
  ];

  const hasFilters = Boolean(search || status !== "all");

  return (
    <DashboardLayout role="warehouse" title="انتقال‌ها">
      <SectionHeader
        title="انتقال‌های بین انبارها"
        description="مشاهده درخواست‌ها و وضعیت انتقال کالا بین انبارهای سپیدار"
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در انتقال‌ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس کالا، مبدأ یا مقصد"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={status}
                onValueChange={setStatus}
                options={[
                  { value: "all", label: "همه وضعیت‌ها" },
                  { value: "pending", label: "در انتظار تأیید" },
                  { value: "approved", label: "تأیید شده" },
                  { value: "rejected", label: "رد شده" },
                ]}
                placeholder="همه وضعیت‌ها"
                searchPlaceholder="جستجو در وضعیت‌ها"
                emptyMessage="وضعیتی پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
            >
              حذف فیلترها
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت انتقال‌ها" />
      ) : error ? (
        <PageErrorMessage title="دریافت انتقال‌ها انجام نشد" message={error} />
      ) : rows.length ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState
          title="انتقالی یافت نشد"
          description="درخواست‌های انتقال ثبت‌شده در این بخش نمایش داده می‌شوند."
        />
      )}
    </DashboardLayout>
  );
}
