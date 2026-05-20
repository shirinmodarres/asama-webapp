"use client";

import Link from "next/link";
import { ListFilter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { compareText } from "@/lib/expert/utils";
import type { Customer } from "@/lib/models/customer.model";
import { listCustomers } from "@/lib/services/customer.service";
import { formatDeliveryAddress } from "@/lib/utils/address-format";
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
        const data = await listCustomers();
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
        return [customer.fullName, customer.phone].some((value) =>
          value.toLowerCase().includes(query),
        );
      })
      .filter(
        (customer) =>
          statusFilter === "all" || customer.status === statusFilter,
      )
      .sort((a, b) => compareText(a.fullName, b.fullName));
  }, [customers, search, statusFilter]);

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
      key: "phone",
      header: "موبایل",
      render: (row) => (row.phone ? formatFaDigits(row.phone) : "-"),
    },
    {
      key: "nationalId",
      header: "کد ملی",
      render: (row) => (row.nationalId ? formatFaDigits(row.nationalId) : "-"),
    },
    {
      key: "city",
      header: "شهر",
      render: (row) => row.defaultAddress?.city || "-",
    },
    {
      key: "address",
      header: "آدرس ",
      cellClassName: "max-w-[360px] whitespace-normal leading-7",
      render: (row) =>
        row.defaultAddress
          ? formatDeliveryAddress(row.defaultAddress)
          : "آدرس ثبت نشده است.",
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
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Link
          href={`/expert/customers/${row.objectId}/edit`}
          className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
        >
          مشاهده / ویرایش
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="expert" title="مشتری‌ها">
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
          <Button
            type="button"
            variant="outline"
            className="w-fit shrink-0"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          >
            پاک کردن فیلترها
          </Button>
        <Button className="!text-white" asChild>
          <Link href="/expert/customers/new">تعریف مشتری</Link>
        </Button>
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
          title="مشتری یافت نشد"
          description="هنوز مشتری ثبت نشده یا عبارت جستجو نتیجه ای ندارد."
        />
      )}
    </DashboardLayout>
  );
}
