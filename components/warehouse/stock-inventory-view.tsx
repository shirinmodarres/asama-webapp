"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PanelRoleKey } from "@/lib/domain/roles";
import { formatNumber } from "@/lib/expert/utils";
import type { SepidarStock } from "@/lib/models/stock.model";
import { listStocks } from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

interface StockInventoryViewProps {
  role: Extract<PanelRoleKey, "warehouse" | "manager">;
  title: string;
  sectionTitle: string;
  description: string;
}

export function StockInventoryView({
  role,
  title,
  sectionTitle,
  description,
}: StockInventoryViewProps) {
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listStocks();
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
      (row) =>
        !query ||
        row.title.toLowerCase().includes(query) ||
        (row.code ?? "").toLowerCase().includes(query),
    );
  }, [stocks, search]);

  const columns: DataTableColumn<SepidarStock>[] = [
    {
      key: "warehouse",
      header: "نام انبار",
      render: (row) => (
        <div>
          <p className="font-semibold text-[#1F3A5F]">
            {formatFaDigits(row.title || "-")}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            {formatFaDigits(row.code || "-")}
          </p>
        </div>
      ),
    },
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
      header: "رزرو شده",
      render: (row) => formatNumber(row.reservedInventoryCount),
    },
    {
      key: "available",
      header: "موجودی قابل فروش",
      render: (row) => formatNumber(row.availableSalesInventoryCount),
    },
  ];

  return (
    <DashboardLayout role={role} title={title}>
      <SectionHeader title={sectionTitle} description={description} />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <label className="grid gap-2 text-sm font-medium text-[#334155]">
          <span>جستجو در موجودی</span>
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
        <LoadingState title="در حال دریافت موجودی انبارهای سپیدار" />
      ) : error ? (
        <PageErrorMessage title="دریافت موجودی انجام نشد" message={error} />
      ) : rows.length ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState
          title="موجودی یافت نشد"
          description="برای انبارهای سپیدار موجودی ثبت نشده است."
        />
      )}
    </DashboardLayout>
  );
}
