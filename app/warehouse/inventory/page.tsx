"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { ProductStatusBadge } from "@/components/support/product-status-badge";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { Product } from "@/lib/models/product.model";
import { listWarehouseInventory } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function WarehouseInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listWarehouseInventory();
        if (isMounted) setProducts(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInventory();
    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query),
    );
  }, [products, search]);

  const columns: DataTableColumn<Product>[] = [
    { key: "name", header: "کالا", render: (row) => row.name },
    {
      key: "sku",
      header: "کد کالا",
      render: (row) => formatFaDigits(row.sku || row.id),
    },
    {
      key: "brand-model",
      header: "برند/مدل",
      render: (row) => [row.brand, row.model].filter(Boolean).join(" / ") || "-",
    },
    {
      key: "warehouseStock",
      header: "موجودی واقعی انبار",
      render: (row) => formatNumber(row.warehouseStock),
    },
    { key: "unit", header: "واحد", render: (row) => row.unit },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => <ProductStatusBadge status={row.status} />,
    },
  ];

  return (
    <DashboardLayout role="warehouse" title="موجودی واقعی انبار">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو بر اساس کالا، کد یا برند"
            className="pr-10"
          />
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت موجودی واقعی انبار" />
      ) : error ? (
        <PageErrorMessage title="دریافت موجودی انبار انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState
          title="موجودی انبار یافت نشد"
          description="داده‌ای برای موجودی واقعی انبار در دسترس نیست."
        />
      )}
    </DashboardLayout>
  );
}
