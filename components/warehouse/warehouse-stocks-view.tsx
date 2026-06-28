"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PanelRoleKey } from "@/lib/domain/roles";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { WarehouseStockUnitSummary } from "@/lib/models/warehouse.model";
import { listWarehouseStocksWithUnits } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

interface WarehouseStocksViewProps {
  role: Extract<PanelRoleKey, "support" | "manager" | "warehouse">;
  basePath: string;
}

export function WarehouseStocksView({ role, basePath }: WarehouseStocksViewProps) {
  const [rows, setRows] = useState<WarehouseStockUnitSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadRows = async () => {
    setIsLoading(true);
    setError("");
    try {
      setRows(await listWarehouseStocksWithUnits());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRows();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(
      (row) =>
        !query ||
        row.title.toLowerCase().includes(query) ||
        (row.code ?? "").toLowerCase().includes(query),
    );
  }, [rows, search]);

  const columns: DataTableColumn<WarehouseStockUnitSummary>[] = [
    {
      key: "title",
      header: "انبار",
      render: (row) => (
        <div>
          <p className="font-semibold text-[#102034]">{row.title || "-"}</p>
          <p className="mt-1 text-xs text-[#64748B]">
            {row.code ? formatFaDigits(row.code) : "-"}
          </p>
        </div>
      ),
    },
    {
      key: "productCount",
      header: "تعداد کالا",
      render: (row) => formatNumber(row.totalProductCount),
    },
    {
      key: "unitCount",
      header: "تعداد واحد",
      render: (row) => formatNumber(row.totalUnitCount),
    },
    {
      key: "sync",
      header: "آخرین همگام‌سازی",
      render: (row) =>
        row.lastSepidarSyncAt ? formatDateTime(row.lastSepidarSyncAt) : "-",
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Button asChild type="button" size="sm" variant="outline">
          <Link href={`${basePath}/${row.objectId}`}>مشاهده موجودی</Link>
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout role={role} title="انبارها">
      <SectionHeader
        title="موجودی قابل ردیابی انبارها"
        description="موجودی هر انبار بر اساس کدهای رهگیری و سریال‌های ثبت‌شده"
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <label className="grid gap-2 text-sm font-medium text-[#334155]">
          <span>جستجو در انبارها</span>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو بر اساس نام یا کد انبار"
              className="pr-10"
            />
          </div>
        </label>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت انبارها" />
      ) : error ? (
        <PageErrorMessage title="دریافت انبارها انجام نشد" message={error} />
      ) : filteredRows.length ? (
        <DataTable
          columns={columns}
          rows={filteredRows}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState
          title="انباری یافت نشد"
          description="پس از ثبت ورود کالا، تعداد واحدهای هر انبار اینجا نمایش داده می‌شود."
        />
      )}
    </DashboardLayout>
  );
}
