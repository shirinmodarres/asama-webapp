"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { Product } from "@/lib/models/product.model";
import type { ProductWarehouseInventory } from "@/lib/models/warehouse.model";
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

  const groups = useMemo(() => groupProductsByWarehouse(rows), [rows]);

  const columns: DataTableColumn<ProductInventoryRow>[] = [
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
      key: "stock",
      header: "موجودی",
      render: (row) => formatNumber(row.inventory.stock),
    },
    {
      key: "reserved",
      header: "موجودی رزروشده",
      render: (row) => formatNumber(row.inventory.reservedStock),
    },
    {
      key: "available",
      header: "موجودی قابل استفاده",
      render: (row) => formatNumber(row.inventory.availableStock),
    },
    { key: "unit", header: "واحد", render: (row) => row.unit },
  ];

  return (
    <DashboardLayout role="warehouse" title="موجودی">
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
      ) : groups.length > 0 ? (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.warehouseId} className="space-y-3">
              <h2 className="text-base font-semibold text-[#1F3A5F]">
                {getWarehouseTypeLabel(group.warehouseType)}
                {group.warehouseName ? ` - ${group.warehouseName}` : ""}
              </h2>
              <DataTable
                columns={columns}
                rows={group.rows}
                rowKey={(row) => `${row.objectId}-${row.inventory.warehouseId}`}
              />
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="موجودی انبار یافت نشد"
          description="داده‌ای برای موجودی واقعی انبار در دسترس نیست."
        />
      )}
    </DashboardLayout>
  );
}

interface ProductInventoryRow extends Product {
  inventory: ProductWarehouseInventory;
}

function groupProductsByWarehouse(products: Product[]) {
  const groups = new Map<
    string,
    {
      warehouseId: string;
      warehouseName: string;
      warehouseType: string;
      rows: ProductInventoryRow[];
    }
  >();

  for (const product of products) {
    const inventories =
      product.inventories.length > 0
        ? product.inventories
        : [
            {
              warehouseId: "default",
              warehouseName: "انبار کل",
              warehouseType: "general",
              stock: product.warehouseStock,
              reservedStock: product.reservedStock,
              availableStock: product.warehouseAvailableStock,
            },
          ];

    for (const inventory of inventories) {
      const key = inventory.warehouseId || inventory.warehouseName || "default";
      const group =
        groups.get(key) ??
        {
          warehouseId: key,
          warehouseName: inventory.warehouseName,
          warehouseType: inventory.warehouseType,
          rows: [],
        };
      group.rows.push({ ...product, inventory });
      groups.set(key, group);
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    getWarehouseTypeLabel(a.warehouseType).localeCompare(
      getWarehouseTypeLabel(b.warehouseType),
      "fa",
    ),
  );
}

function getWarehouseTypeLabel(type: string) {
  return type === "naja" ? "انبار ناجا" : "انبار عمومی";
}
