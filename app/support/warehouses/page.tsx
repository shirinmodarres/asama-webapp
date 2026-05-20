"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ListFilter, Search } from "lucide-react";
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
import type { Warehouse } from "@/lib/models/warehouse.model";
import { listWarehouses } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function SupportWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function loadWarehouses() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listWarehouses();
        if (isMounted) setWarehouses(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadWarehouses();
    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return warehouses.filter((warehouse) => {
      const matchesSearch =
        !query ||
        warehouse.name.toLowerCase().includes(query) ||
        warehouse.code.toLowerCase().includes(query);
      const matchesType = typeFilter === "all" || warehouse.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || warehouse.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, statusFilter, typeFilter, warehouses]);

  const columns: DataTableColumn<Warehouse>[] = [
    { key: "name", header: "نام انبار", render: (row) => row.name },
    {
      key: "code",
      header: "کد",
      render: (row) => (row.code ? formatFaDigits(row.code) : "-"),
    },
    { key: "type", header: "نوع", render: (row) => getWarehouseTypeLabel(row.type) },
    {
      key: "allowed",
      header: "سفارش مجاز",
      render: (row) =>
        row.allowedOrderTypes.map(getOrderTypeLabel).join("، ") || "-",
    },
    {
      key: "default",
      header: "پیش‌فرض",
      render: (row) => (row.isDefault ? <Badge>پیش‌فرض</Badge> : "-"),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (row.status === "inactive" ? "غیرفعال" : "فعال"),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/support/warehouses/${row.objectId}/edit`}>ویرایش</Link>
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="انبارها">
      <SectionHeader
        title="فهرست انبارها"
        description="مشاهده، جستجو و ویرایش انبارهای عمومی و ناجا"
        actions={
          <Button asChild>
            <Link href="/support/warehouses/create">تعریف انبار</Link>
          </Button>
        }
      />
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در انبارها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس نام یا کد انبار"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر نوع انبار</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={typeFilter}
                onValueChange={setTypeFilter}
                options={[
                  { value: "all", label: "همه نوع‌ها" },
                  { value: "general", label: "انبار عمومی" },
                  { value: "naja", label: "انبار ناجا" },
                  { value: "other", label: "سایر" },
                ]}
                placeholder="همه نوع‌ها"
                searchPlaceholder="جستجو در نوع انبار"
                emptyMessage="نوعی پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <SearchableSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: "all", label: "همه وضعیت‌ها" },
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
              ]}
              placeholder="همه وضعیت‌ها"
              searchPlaceholder="جستجو در وضعیت‌ها"
              emptyMessage="وضعیتی پیدا نشد"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            className="w-fit shrink-0"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
          >
            پاک کردن فیلترها
          </Button>
        </div>
      </section>
      {isLoading ? (
        <LoadingState title="در حال دریافت انبارها" />
      ) : error ? (
        <PageErrorMessage title="دریافت انبارها انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState title="انباری ثبت نشده است" description="انبار جدید تعریف کنید." />
      )}
    </DashboardLayout>
  );
}

function getWarehouseTypeLabel(type: string) {
  if (type === "naja") return "انبار ناجا";
  if (type === "other") return "سایر";
  return "انبار عمومی";
}

function getOrderTypeLabel(type: string) {
  return type === "naja" ? "سفارش ناجا" : "سفارش عادی";
}
