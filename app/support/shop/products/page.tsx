"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListFilter, PlusCircle, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import type { WebsiteCategory, WebsiteProduct } from "@/lib/models/shop.model";
import {
  listWebsiteCategories,
  listWebsiteProducts,
  updateWebsiteProduct,
  updateWebsiteProductStock,
} from "@/lib/services/shop-admin.service";
import {
  formatFaCurrency,
  formatFaDigits,
  formatFaNumber,
  toNumber,
} from "@/lib/utils/number-format";

export default function SupportShopProductsPage() {
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [categories, setCategories] = useState<WebsiteCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [stockProduct, setStockProduct] = useState<WebsiteProduct | null>(null);
  const [stockValue, setStockValue] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [stockError, setStockError] = useState("");
  const [submittingId, setSubmittingId] = useState("");

  const loadProducts = async () => {
    const data = await listWebsiteProducts();
    setProducts(data);
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [data, categoryItems] = await Promise.all([
          listWebsiteProducts(),
          listWebsiteCategories(true),
        ]);
        if (isMounted) {
          setProducts(data);
          setCategories(categoryItems);
        }
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

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          product.title.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query);
        const matchesCategory =
          categoryFilter === "all" || product.categoryId === categoryFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" ? product.isActive : !product.isActive);
        const matchesFeatured =
          featuredFilter === "all" ||
          (featuredFilter === "featured"
            ? product.isFeatured
            : !product.isFeatured);
        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "in_stock" && product.availableStock > 5) ||
          (stockFilter === "low_stock" &&
            product.availableStock > 0 &&
            product.availableStock <= 5) ||
          (stockFilter === "out_of_stock" && product.availableStock <= 0);
        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus &&
          matchesFeatured &&
          matchesStock
        );
      }),
    [categoryFilter, featuredFilter, products, search, statusFilter, stockFilter],
  );

  const hasActiveFilters =
    search.trim() ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    featuredFilter !== "all" ||
    stockFilter !== "all";

  const handleToggleActive = async (product: WebsiteProduct) => {
    setSubmittingId(product.objectId);
    setError("");
    setMessage("");
    try {
      await updateWebsiteProduct(product.objectId, {
        ...toProductPayload(product),
        isActive: !product.isActive,
      });
      setMessage("وضعیت محصول سایت به‌روزرسانی شد.");
      await loadProducts();
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setSubmittingId("");
    }
  };

  const handleStockSubmit = async () => {
    if (!stockProduct) return;
    const nextStock = toNumber(stockValue);
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      setStockError("موجودی سایت معتبر نیست.");
      return;
    }
    setSubmittingId(stockProduct.objectId);
    setStockError("");
    setError("");
    setMessage("");
    try {
      await updateWebsiteProductStock(stockProduct.objectId, {
        websiteStock: nextStock,
        note: stockNote,
      });
      setMessage("موجودی سایت به‌روزرسانی شد.");
      setStockProduct(null);
      await loadProducts();
    } catch (stockUpdateError) {
      setStockError(getErrorMessage(stockUpdateError));
    } finally {
      setSubmittingId("");
    }
  };

  const columns: DataTableColumn<WebsiteProduct>[] = [
    {
      key: "image",
      header: "تصویر",
      render: (row) =>
        row.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.images[0]}
            alt={row.title}
            className="size-12 rounded-xl border border-[#E5E7EB] object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-xl border border-dashed border-[#D7DEE6] text-xs text-[#94A3B8]">
            -
          </div>
        ),
    },
    { key: "title", header: "عنوان", render: (row) => row.title || "-" },
    {
      key: "sku",
      header: "SKU",
      render: (row) => formatFaDigits(row.sku) || "-",
    },
    { key: "category", header: "دسته‌بندی", render: (row) => row.categoryTitle || "-" },
    {
      key: "price",
      header: "قیمت سایت",
      render: (row) => formatFaCurrency(row.price),
    },
    {
      key: "salePrice",
      header: "قیمت ویژه",
      render: (row) =>
        row.salePrice === null ? "-" : formatFaCurrency(row.salePrice),
    },
    {
      key: "stock",
      header: "موجودی سایت",
      render: (row) => formatFaNumber(row.websiteStock),
    },
    {
      key: "reserved",
      header: "رزروشده",
      render: (row) => formatFaNumber(row.reservedStock),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "neutral"}>
          {row.isActive ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
    {
      key: "featured",
      header: "ویژه",
      render: (row) => (
        <Badge variant={row.isFeatured ? "brand" : "neutral"}>
          {row.isFeatured ? "ویژه" : "عادی"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      sticky: "left",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/support/shop/products/${row.objectId}`}>جزئیات</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/support/shop/products/${row.objectId}/edit`}>
              ویرایش
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setStockProduct(row);
              setStockValue(String(row.websiteStock));
              setStockNote("");
              setStockError("");
            }}
          >
            موجودی
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={Boolean(submittingId)}
            onClick={() => handleToggleActive(row)}
          >
            {row.isActive ? "غیرفعال" : "فعال"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="محصولات سایت">
      <SectionHeader
        title="فهرست محصولات سایت"
        description="محصولات قابل نمایش در فروشگاه عمومی را مدیریت کنید."
        actions={
          <Button asChild>
            <Link href="/support/shop/products/new">
              <PlusCircle className="size-4" />
              ایجاد محصول سایت
            </Link>
          </Button>
        }
      />

      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در محصولات سایت</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="عنوان یا SKU محصول را وارد کنید"
                className="pr-10"
              />
            </div>
          </label>
          <FilterSelect
            label="دسته‌بندی"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: "همه دسته‌ها" },
              ...categories.map((category) => ({
                value: category.objectId,
                label: category.title,
              })),
            ]}
          />
          <FilterSelect
            label="وضعیت"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "همه وضعیت‌ها" },
              { value: "active", label: "فعال" },
              { value: "inactive", label: "غیرفعال" },
            ]}
          />
          <FilterSelect
            label="ویژه"
            value={featuredFilter}
            onChange={setFeaturedFilter}
            options={[
              { value: "all", label: "همه" },
              { value: "featured", label: "ویژه" },
              { value: "normal", label: "عادی" },
            ]}
          />
          <FilterSelect
            label="موجودی"
            value={stockFilter}
            onChange={setStockFilter}
            options={[
              { value: "all", label: "همه" },
              { value: "in_stock", label: "موجود" },
              { value: "low_stock", label: "کم‌موجودی" },
              { value: "out_of_stock", label: "ناموجود" },
            ]}
          />
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit shrink-0"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setStatusFilter("all");
                setFeaturedFilter("all");
                setStockFilter("all");
              }}
            >
              حذف فیلترها
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت محصولات سایت" />
      ) : filteredProducts.length ? (
        <DataTable
          columns={columns}
          rows={filteredProducts}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState
          title="محصولی برای سایت ثبت نشده است"
          description="از دکمه ایجاد محصول سایت برای تعریف اولین محصول استفاده کنید."
        />
      )}

      <Dialog open={Boolean(stockProduct)} onOpenChange={() => setStockProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>به‌روزرسانی موجودی سایت</DialogTitle>
            <DialogDescription>
              موجودی رزروشده فقط برای اطلاع نمایش داده می‌شود.
            </DialogDescription>
          </DialogHeader>
          {stockProduct ? (
            <div className="grid gap-4">
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm leading-7">
                <p>محصول: {stockProduct.title}</p>
                <p>رزروشده: {formatFaNumber(stockProduct.reservedStock)}</p>
                <p>
                  قابل فروش فعلی: {formatFaNumber(stockProduct.availableStock)}
                </p>
              </div>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>موجودی سایت</span>
                <Input
                  inputMode="numeric"
                  value={stockValue}
                  onChange={(event) => {
                    setStockValue(event.target.value);
                    setStockError("");
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>یادداشت</span>
                <Textarea
                  value={stockNote}
                  onChange={(event) => setStockNote(event.target.value)}
                />
              </label>
              {stockError ? <InlineErrorMessage message={stockError} /> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStockProduct(null)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleStockSubmit}
              disabled={Boolean(submittingId)}
            >
              ذخیره موجودی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-48">
      <span>{label}</span>
      <div className="relative">
        <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
        <SearchableSelect
          value={value}
          onValueChange={onChange}
          options={options}
          placeholder="انتخاب"
          searchPlaceholder="جستجو"
          emptyMessage="گزینه‌ای پیدا نشد"
          triggerClassName="pr-10"
        />
      </div>
    </label>
  );
}

function toProductPayload(product: WebsiteProduct) {
  return {
    productRef: product.productRef,
    title: product.title,
    slug: product.slug,
    sku: product.sku,
    accountingItemCode: product.accountingItemCode,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    salePrice: product.salePrice,
    images: product.images,
    brandId: product.brandId ?? "",
    categoryId: product.categoryId ?? "",
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    websiteStock: product.websiteStock,
    reservedStock: product.reservedStock,
    maxOrderQuantity: product.maxOrderQuantity,
    weight: product.weight,
    dimensions: product.dimensions,
  };
}
