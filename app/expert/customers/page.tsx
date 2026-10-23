"use client";

import Link from "next/link";
import { Eye, ListFilter, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Customer } from "@/lib/models/customer.model";
import { listAssignedCustomersPageForExpert } from "@/lib/services/expert-customer.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const PAGE_SIZE = 20;

export default function ExpertCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [grouping, setGrouping] = useState("");
  const [channel, setChannel] = useState("");
  const [subChannel, setSubChannel] = useState("");
  const deferredFilters = useDeferredValue({ search: search.trim(), grouping: grouping.trim(), channel: channel.trim(), subChannel: subChannel.trim() });

  useEffect(() => {
    let isMounted = true;
    async function loadCustomers() {
      setIsLoading(true);
      setError("");
      try {
        const result = await listAssignedCustomersPageForExpert({ ...deferredFilters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
        if (isMounted) {
          setCustomers(result.items);
          setTotal(result.total);
        }
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadCustomers();
    return () => { isMounted = false; };
  }, [deferredFilters, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = Boolean(search.trim() || grouping.trim() || channel.trim() || subChannel.trim());
  const columns: DataTableColumn<Customer>[] = useMemo(() => [
    { key: "name", header: "نام مشتری", render: (row) => <span className="font-medium text-[#1F3A5F]">{row.fullName || "-"}</span> },
    { key: "code", header: "کد سپیدار", render: (row) => row.sepidarCustomerCode ? formatFaDigits(row.sepidarCustomerCode) : "-" },
    { key: "phone", header: "موبایل/تلفن", render: (row) => row.phone ? formatFaDigits(row.phone) : "-" },
    { key: "grouping", header: "گروه مشتری", render: (row) => row.grouping?.title || "-" },
    { key: "channel", header: "کانال", render: (row) => row.channel || "-" },
    { key: "sub-channel", header: "زیرکانال", render: (row) => row.subChannel || "-" },
    { key: "status", header: "وضعیت", render: (row) => <Badge variant={row.status === "active" ? "success" : "neutral"} dot>{row.status === "active" ? "فعال" : "غیرفعال"}</Badge> },
    { key: "actions", header: "عملیات", sticky: "left", render: (row) => <Button asChild type="button" size="sm" variant="outline"><Link href={`/expert/customers/${row.objectId}`}><Eye className="size-4" />جزئیات</Link></Button> },
  ], []);

  return <DashboardLayout role="expert" title="مشتری‌ها">
    <SectionHeader title="مشتری‌های اختصاص‌یافته" description="مشتری‌های اختصاص‌یافته به شما و دسته‌بندی فروش آن‌ها را مشاهده کنید." />
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <FilterInput label="جستجو" icon={<Search className="size-4" />} value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="نام، کد یا تلفن مشتری" />
        <FilterInput label="گروه مشتری" icon={<ListFilter className="size-4" />} value={grouping} onChange={(value) => { setGrouping(value); setPage(1); }} placeholder="عنوان یا کد گروه" />
        <FilterInput label="کانال" icon={<ListFilter className="size-4" />} value={channel} onChange={(value) => { setChannel(value); setPage(1); }} placeholder="مثلاً بازار" />
        <FilterInput label="زیرکانال" icon={<ListFilter className="size-4" />} value={subChannel} onChange={(value) => { setSubChannel(value); setPage(1); }} placeholder="مثلاً خرده فروش" />
        {hasActiveFilters ? <div className="flex items-end"><Button type="button" variant="outline" className="gap-2" onClick={() => { setSearch(""); setGrouping(""); setChannel(""); setSubChannel(""); setPage(1); }}><X className="size-4" />حذف فیلترها</Button></div> : null}
      </div>
    </section>
    {isLoading ? <LoadingState title="در حال دریافت مشتری‌ها" /> : error ? <PageErrorMessage title="دریافت مشتری‌ها انجام نشد" message={error} /> : customers.length ? <><DataTable columns={columns} rows={customers} rowKey={(row) => row.objectId} /><PaginationBar currentPage={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} /></> : <EmptyState title="مشتری‌ای با این شرایط پیدا نشد" description="فیلترها را تغییر دهید یا تخصیص مشتری را بررسی کنید." />}
  </DashboardLayout>;
}

function FilterInput({ label, icon, value, onChange, placeholder }: { label: string; icon: ReactNode; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="grid gap-2 text-sm font-medium text-[#334155]"><span>{label}</span><div className="relative"><span className="pointer-events-none absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-[#6CAE75]">{icon}</span><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pr-10" /></div></label>;
}
