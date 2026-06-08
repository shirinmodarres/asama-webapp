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
import type { ProductStockInventory } from "@/lib/models/stock.model";
import { listWarehouseInventory } from "@/lib/services/warehouse.service";
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
  const [inventories, setInventories] = useState<ProductStockInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listWarehouseInventory();
        if (isMounted) setInventories(data);
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
    return inventories.filter(
      (row) =>
        !query ||
        row.productName.toLowerCase().includes(query) ||
        row.productSku.toLowerCase().includes(query) ||
        row.stockTitle.toLowerCase().includes(query),
    );
  }, [inventories, search]);

  const groups = useMemo(() => groupByStock(rows), [rows]);

  const columns: DataTableColumn<ProductStockInventory>[] = [
    {
      key: "code",
      header: "کد کالا",
      render: (row) => formatFaDigits(row.productSku || "-"),
    },
    {
      key: "name",
      header: "نام کالا",
      render: (row) => row.productName || "-",
    },
    {
      key: "real",
      header: "موجودی واقعی",
      render: (row) => formatNumber(row.realQuantity),
    },
    {
      key: "sales",
      header: "موجودی فروش",
      render: (row) => formatNumber(row.salesQuantity),
    },
    {
      key: "reserved",
      header: "رزرو شده",
      render: (row) => formatNumber(row.reservedQuantity),
    },
    {
      key: "available",
      header: "موجودی قابل فروش",
      render: (row) => formatNumber(row.availableSalesQuantity),
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
              placeholder="جستجو بر اساس کالا، کد یا انبار"
              className="pr-10"
            />
          </div>
        </label>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت موجودی انبارهای سپیدار" />
      ) : error ? (
        <PageErrorMessage title="دریافت موجودی انجام نشد" message={error} />
      ) : groups.length ? (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.stockId} className="space-y-3">
              <h2 className="text-base font-semibold text-[#1F3A5F]">
                {group.stockTitle}
              </h2>
              <DataTable
                columns={columns}
                rows={group.rows}
                rowKey={(row) => row.objectId}
              />
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="موجودی یافت نشد"
          description="برای انبارهای سپیدار موجودی ثبت نشده است."
        />
      )}
    </DashboardLayout>
  );
}

function groupByStock(rows: ProductStockInventory[]) {
  const groups = new Map<
    string,
    {
      stockId: string;
      stockTitle: string;
      rows: ProductStockInventory[];
    }
  >();

  for (const row of rows) {
    const key =
      row.stockObjectId ||
      (row.sepidarStockId !== null ? String(row.sepidarStockId) : "") ||
      row.stockTitle ||
      "unknown";
    const group = groups.get(key) ?? {
      stockId: key,
      stockTitle: row.stockTitle || "انبار سپیدار",
      rows: [],
    };
    group.rows.push(row);
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.stockTitle.localeCompare(b.stockTitle, "fa"),
  );
}
