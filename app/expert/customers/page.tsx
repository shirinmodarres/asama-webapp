"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      .sort((a, b) => compareText(a.fullName, b.fullName));
  }, [customers, search]);

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
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو بر اساس نام مشتری "
            className="pr-10"
          />
        </div>
        <Button className="!text-white" asChild>
          <Link href="/expert/customers/new">تعریف مشتری</Link>
        </Button>
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
