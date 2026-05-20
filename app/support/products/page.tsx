"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { ProductStatusBadge } from "@/components/support/product-status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import type { Product } from "@/lib/models/product.model";
import { listProducts } from "@/lib/services/product.service";
import { Search, Tags } from "lucide-react";

export default function SupportProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      try {
        const data = await listProducts("support");
        if (isMounted) setProducts(data);
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError));
        }
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
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.brand)
            .filter(
              (b): b is string => typeof b === "string" && b.trim().length > 0,
            ),
        ),
      ),
    [products],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter((category) => category.trim().length > 0),
        ),
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesBrand =
        brandFilter === "all" || product.brand === brandFilter;
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;
      return matchesSearch && matchesBrand && matchesCategory && matchesStatus;
    });
  }, [brandFilter, categoryFilter, products, search, statusFilter]);

  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "نام کالا",
      render: (row) => (
        <span className="font-medium text-[#1F3A5F]">{row.name}</span>
      ),
    },
    { key: "brand", header: "برند", render: (row) => row.brand },
    { key: "category", header: "دسته بندی", render: (row) => row.category },
    {
      key: "total",
      header: "موجودی فروش",
      render: (row) => formatNumber(row.salesStock),
    },
    {
      key: "najaInventoryQty",
      header: "موجودی ناجا",
      render: (row) => formatNumber(row.najaInventoryQty),
    },
    {
      key: "warehouseStock",
      header: "موجودی کل انبارها",
      render: (row) => formatNumber(row.warehouseStock),
    },
    { key: "unit", header: "واحد", render: (row) => row.unit },
    {
      key: "unitPrice",
      header: "قیمت واحد",
      render: (row) => formatCurrency(row.unitPrice),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => <ProductStatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Link
          href={`/support/products/${row.objectId || row.id}/edit`}
          className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
        >
          ویرایش
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="کالاها">
      <SectionHeader
        title="فهرست کالاها"
        description="مشاهده، جستجو و ویرایش کالاها"
        actions={
          <Link
            href="/support/products/new"
            className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm !text-white"
          >
            تعریف کالای جدید
          </Link>
        }
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در کالاها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس نام کالا"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر برند</span>
            <div className="relative">
              <Tags className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="pr-10">
                  <SelectValue placeholder="همه برندها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه برندها</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={`brand-${brand}`} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر دسته‌بندی</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="همه دسته‌بندی‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={`category-${category}`} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="همه وضعیت‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <Button
            type="button"
            variant="outline"
            className="w-fit shrink-0"
            onClick={() => {
              setSearch("");
              setBrandFilter("all");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}
          >
            پاک کردن فیلترها
          </Button>
        </div>
      </section>

      {isLoading ? (
        <LoadingState
          title="در حال دریافت کالاها"
          description="فهرست کالاها از سرور دریافت می شود."
        />
      ) : error ? (
        <PageErrorMessage title="دریافت کالاها انجام نشد" message={error} />
      ) : filteredProducts.length > 0 ? (
        <DataTable
          columns={columns}
          rows={filteredProducts}
          rowKey={(row) => row.objectId || row.id}
        />
      ) : (
        <EmptyState
          title="کالایی یافت نشد"
          description="فیلترها را تغییر دهید یا کالای جدید ثبت کنید."
        />
      )}
    </DashboardLayout>
  );
}
