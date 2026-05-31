"use client";

import { ListFilter, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { compareText } from "@/lib/expert/utils";
import type { Customer } from "@/lib/models/customer.model";
import { listAssignedCustomersForExpert } from "@/lib/services/expert-customer.service";
import { formatFaDigits } from "@/lib/utils/number-format";
import { Badge } from "@/components/ui/badge";

export default function ExpertCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listAssignedCustomersForExpert();
        if (isMounted) setCustomers(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCustomers();
    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...customers]
      .filter((customer) => {
        if (!query) return true;
        return [customer.fullName, customer.sepidarCustomerCode ?? "", customer.phone].some((value) =>
          value.toLowerCase().includes(query),
        );
      })
      .filter(
        (customer) =>
          statusFilter === "all" || customer.status === statusFilter,
      )
      .sort((a, b) => compareText(a.fullName, b.fullName));
  }, [customers, search, statusFilter]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: "نام مشتری",
      render: (row) => (
        <span className="font-medium text-[#1F3A5F]">
          {row.fullName || "-"}
        </span>
      ),
    },
    {
      key: "code",
      header: "کد مشتری",
      render: (row) => row.sepidarCustomerCode || "-",
    },
    {
      key: "phone",
      header: "موبایل/تلفن",
      render: (row) => (row.phone ? formatFaDigits(row.phone) : "-"),
    },
    {
      key: "sale-type",
      header: "نوع فروش",
      render: (row) =>
        row.saleType?.title
          ? `${row.saleType.sepidarSaleTypeId ? `${formatFaDigits(row.saleType.sepidarSaleTypeId)} - ` : ""}${row.saleType.title}`
          : "-",
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "neutral"} dot>
          {row.status === "active" ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardLayout role="expert" title="مشتری‌ها">
      <SectionHeader
        title="مشتری‌های اختصاص‌یافته"
        description="مشتری‌هایی که پشتیبان برای ثبت سفارش به شما اختصاص داده است."
      />
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در مشتری‌ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس نام مشتری یا موبایل"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
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
                triggerClassName="pr-10"
              />
            </div>
          </label>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-fit shrink-0 items-center gap-2"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              <span>حذف فیلترها</span>
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>
      {isLoading ? (
        <LoadingState title="در حال دریافت مشتری‌ها" />
      ) : error ? (
        <PageErrorMessage title="دریافت مشتری‌ها انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState
          title="هنوز مشتری‌ای به شما اختصاص داده نشده است."
          description="پس از تخصیص مشتری توسط پشتیبان، اطلاعات آن در این فهرست نمایش داده می‌شود."
        />
      )}
    </DashboardLayout>
  );
}
