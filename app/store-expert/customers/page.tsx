"use client";

import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { CustomerList } from "@/components/customer/customer-list";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Customer } from "@/lib/models/customer.model";
import { listStoreExpertCustomers } from "@/lib/services/store-expert-customer.service";

const PAGE_SIZE = 20;

export default function StoreExpertCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await listStoreExpertCustomers({ search: deferredSearch, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }, controller.signal);
        if (mounted) { setCustomers(result.items); setTotal(result.total); }
      } catch (loadError) {
        if (mounted && !controller.signal.aborted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; controller.abort(); };
  }, [deferredSearch, page]);

  return <DashboardLayout role="store-expert" title="مشتریان فروشگاه">
    <SectionHeader title="مشتریان مادسنتر" description="فقط مشتریان گروه‌های مادسنتر برای فروشگاه قابل انتخاب هستند." />
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm"><label className="grid gap-2 text-sm font-medium text-[#334155]"><span>جستجو</span><div className="relative"><Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="نام، کد یا تلفن مشتری" className="pr-10" /></div></label></section>
    {loading ? <LoadingState title="در حال دریافت مشتری‌ها" /> : error ? <PageErrorMessage title="دریافت مشتری‌ها انجام نشد" message={error} /> : customers.length ? <><CustomerList customers={customers} detailsHref={(customer) => `/store-expert/customers/${customer.objectId}`} /><PaginationBar currentPage={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} totalItems={total} onPageChange={setPage} /></> : <EmptyState title="مشتری مادسنتری پیدا نشد" description="عبارت جستجو را تغییر دهید." />}
  </DashboardLayout>;
}
