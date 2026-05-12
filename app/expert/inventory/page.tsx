"use client";

import { Search, Tags } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InventorySummaryCard } from "@/components/shared/inventory-summary-card";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import type { Product } from "@/lib/models/product.model";
import { listProducts } from "@/lib/services/product.service";

type InventoryStatus = "normal" | "warning" | "critical";

export default function ExpertInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      try {
        const data = await listProducts("expert");
        if (isMounted) setProducts(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const brands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand))),
    [products],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesBrand = brand === "all" || product.brand === brand;
      return matchesSearch && matchesBrand;
    });
  }, [brand, products, search]);

  const summary = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        acc.total += product.salesStock;
        acc.reserved += product.reservedStock;
        acc.available += product.availableStock;
        return acc;
      },
      { total: 0, reserved: 0, available: 0 },
    );
  }, [products]);

  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "نام کالا",
      render: (row) => (
        <span className="font-medium text-[#1F3A5F]">{row.name}</span>
      ),
    },
    { key: "brand", header: "برند", render: (row) => row.brand },
    { key: "unit", header: "واحد", render: (row) => row.unit },
    {
      key: "unit-price",
      header: "قیمت واحد",
      render: (row) => formatCurrency(row.unitPrice),
    },
    {
      key: "total",
      header: "موجودی فروش",
      render: (row) => formatNumber(row.salesStock),
    },
    {
      key: "reserved",
      header: "موجودی رزروشده",
      render: (row) => formatNumber(row.reservedStock),
    },
    {
      key: "available",
      header: "موجودی قابل فروش",
      render: (row) => formatNumber(row.availableStock),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <StatusBadge type="inventory" status={getInventoryStatus(row)} />
      ),
    },
  ];

  return (
    <DashboardLayout role="expert" title="موجودی کالاها">
      <section className="grid gap-4 md:grid-cols-3">
        <InventorySummaryCard
          title="موجودی فروش"
          value={summary.total}
          hint="مجموع ظرفیت فروش ثبت شده"
        />
        <InventorySummaryCard
          title="موجودی رزروشده"
          value={summary.reserved}
          hint="اختصاص یافته به سفارش های در انتظار تایید"
        />
        <InventorySummaryCard
          title="موجودی قابل فروش"
          value={summary.available}
          hint="قابل انتخاب برای سفارش جدید"
        />
      </section>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در کالاها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="نام کالا را وارد کنید"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>فیلتر برند</span>
            <div className="relative">
              <Tags className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={brand}
                onValueChange={setBrand}
                options={[
                  { value: "all", label: "همه برندها" },
                  ...brands.map((item) => ({ value: item, label: item })),
                ]}
                placeholder="همه برندها"
                searchPlaceholder="جستجو در برندها"
                emptyMessage="برندی پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت موجودی" />
      ) : error ? (
        <PageErrorMessage title="دریافت موجودی انجام نشد" message={error} />
      ) : filteredProducts.length > 0 ? (
        <DataTable
          columns={columns}
          rows={filteredProducts}
          rowKey={(row) => row.objectId || row.id}
        />
      ) : (
        <EmptyState
          title="کالایی یافت نشد"
          description="فیلترها را تغییر دهید یا عبارت جستجو را اصلاح کنید."
        />
      )}
    </DashboardLayout>
  );
}

function getInventoryStatus(product: Product): InventoryStatus {
  const available = product.availableStock;
  if (available <= 0) return "critical";
  if (available <= product.salesStock * 0.2) return "warning";
  return "normal";
}
