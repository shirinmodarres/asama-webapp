"use client";

import { ListFilter, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { CustomerList } from "@/components/customer/customer-list";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { listAssignedCustomersPageForExpert } from "@/lib/services/expert-customer.service";

const PAGE_SIZE = 20;

export default function ExpertCustomersPage() {
  const [customers, setCustomers] = useState<import("@/lib/models/customer.model").Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [grouping, setGrouping] = useState("");
  const [channel, setChannel] = useState("");
  const [subChannel, setSubChannel] = useState("");
  const filters = useMemo(
    () => ({
      search: search.trim(),
      grouping: grouping.trim(),
      channel: channel.trim(),
      subChannel: subChannel.trim(),
    }),
    [search, grouping, channel, subChannel],
  );
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    async function loadCustomers() {
      setIsLoading(true);
      setError("");
      try {
        const result = await listAssignedCustomersPageForExpert(
          { ...deferredFilters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
          abortController.signal,
        );
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
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [deferredFilters, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = Boolean(search.trim() || grouping.trim() || channel.trim() || subChannel.trim());
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
    {isLoading ? <LoadingState title="در حال دریافت مشتری‌ها" /> : error ? <PageErrorMessage title="دریافت مشتری‌ها انجام نشد" message={error} /> : customers.length ? <><CustomerList customers={customers} detailsHref={(customer) => `/expert/customers/${customer.objectId}`} assignedExpertName={(customer) => customer.assignedExpertName} /><PaginationBar currentPage={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} /></> : <EmptyState title="مشتری‌ای با این شرایط پیدا نشد" description="فیلترها را تغییر دهید یا تخصیص مشتری را بررسی کنید." />}
  </DashboardLayout>;
}

function FilterInput({ label, icon, value, onChange, placeholder }: { label: string; icon: ReactNode; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="grid gap-2 text-sm font-medium text-[#334155]"><span>{label}</span><div className="relative"><span className="pointer-events-none absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-[#6CAE75]">{icon}</span><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pr-10" /></div></label>;
}
