"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import type { Customer } from "@/lib/models/customer.model";
import type { Product } from "@/lib/models/product.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listAssignedCustomersForExpert } from "@/lib/services/expert-customer.service";
import { listOrderProductsForAssignment } from "@/lib/services/product.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const ALL = "__all";

export default function ExpertProductsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [priceListFilter, setPriceListFilter] = useState(ALL);
  const [brandFilter, setBrandFilter] = useState(ALL);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadCustomers() {
      setIsLoadingCustomers(true);
      try {
        const data = await listAssignedCustomersForExpert(getStoredCurrentUser()?.objectId);
        if (!isMounted) return;
        setCustomers(data);
        setSelectedCustomerId(data[0]?.objectId || "");
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoadingCustomers(false);
      }
    }
    loadCustomers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      if (!selectedCustomerId) {
        if (isMounted) setProducts([]);
        return;
      }
      setIsLoadingProducts(true);
      setError("");
      try {
        const data = await listOrderProductsForAssignment({
          customerObjectId: selectedCustomerId,
          expertUserId: getStoredCurrentUser()?.objectId,
        });
        if (isMounted) setProducts(data);
      } catch (loadError) {
        if (isMounted) {
          setProducts([]);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [selectedCustomerId]);

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.objectId,
        label: [
          customer.sepidarCustomerCode ? formatFaDigits(customer.sepidarCustomerCode) : "",
          customer.fullName,
        ].filter(Boolean).join(" - "),
      })),
    [customers],
  );

  const priceListOptions = useMemo(() => {
    const rows = new Map<string, string>();
    products.forEach((product) => {
      if (product.priceListId) {
        rows.set(product.priceListId, product.priceListTitle || product.priceListId);
      }
    });
    return [
      { value: ALL, label: "همه لیست‌ها" },
      ...Array.from(rows.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [products]);

  const brandOptions = useMemo(() => {
    const brands = [...new Set(products.map((product) => product.brandName || product.brand).filter(Boolean))];
    return [
      { value: ALL, label: "همه برندها" },
      ...brands.map((brand) => ({ value: brand, label: brand })),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const brand = product.brandName || product.brand;
      const searchable = [
        product.sepidarCode,
        product.sku,
        product.name,
        brand,
      ].filter(Boolean).join(" ").toLowerCase();
      if (priceListFilter !== ALL && product.priceListId !== priceListFilter) return false;
      if (brandFilter !== ALL && brand !== brandFilter) return false;
      if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
      return true;
    });
  }, [brandFilter, priceListFilter, products, search]);

  const columns: DataTableColumn<Product>[] = [
    {
      key: "code",
      header: "کد کالا",
      render: (row) => formatFaDigits(row.sepidarCode || row.sku || "-"),
    },
    { key: "name", header: "نام کالا", render: (row) => row.name || "-" },
    { key: "brand", header: "برند", render: (row) => row.brandName || row.brand || "-" },
    { key: "price-list", header: "لیست قیمت", render: (row) => row.priceListTitle || row.priceListId || "-" },
    { key: "price", header: "قیمت", render: (row) => formatCurrency(row.unitPrice) },
    {
      key: "sales-stock",
      header: "موجودی فروش",
      render: (row) => formatNumber(row.availableForSale),
    },
  ];

  return (
    <DashboardLayout role="expert" title="کالاها و قیمت‌ها">
      <SectionHeader
        title="کالاها و قیمت‌ها"
        description="کالاهای قابل فروش بر اساس مشتری و لیست‌های قیمت اختصاص‌یافته"
      />
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoadingCustomers ? (
        <LoadingState title="در حال دریافت مشتری‌ها" />
      ) : customers.length === 0 ? (
        <EmptyState title="مشتری فعالی اختصاص داده نشده است" description="برای این کارشناس مشتری با لیست قیمت فعال وجود ندارد." />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 md:grid-cols-4">
            <SearchableSelect
              value={selectedCustomerId || undefined}
              onValueChange={(value) => {
                setSelectedCustomerId(value);
                setPriceListFilter(ALL);
                setBrandFilter(ALL);
              }}
              options={customerOptions}
              placeholder="انتخاب مشتری"
              searchPlaceholder="جستجو در مشتری‌ها"
              emptyMessage="مشتری پیدا نشد"
            />
            <SearchableSelect
              value={priceListFilter}
              onValueChange={setPriceListFilter}
              options={priceListOptions}
              placeholder="لیست قیمت"
              searchPlaceholder="جستجو در لیست قیمت"
              emptyMessage="لیست قیمت فعالی پیدا نشد"
            />
            <SearchableSelect
              value={brandFilter}
              onValueChange={setBrandFilter}
              options={brandOptions}
              placeholder="برند"
              searchPlaceholder="جستجو در برند"
              emptyMessage="برندی پیدا نشد"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو نام یا کد کالا"
            />
          </div>
          {isLoadingProducts ? (
            <LoadingState title="در حال دریافت کالاها" />
          ) : filteredProducts.length ? (
            <DataTable
              columns={columns}
              rows={filteredProducts}
              rowKey={(row) => row.objectId}
            />
          ) : (
            <EmptyState title="کالایی برای نمایش وجود ندارد" description="برای این مشتری لیست قیمت فعال یا کالای قابل فروش پیدا نشد." />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
