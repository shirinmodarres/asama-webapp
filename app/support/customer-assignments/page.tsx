"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Search, UserRoundX, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableMultiSelect, SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import type { AuthUser } from "@/lib/models/auth.model";
import type { Customer } from "@/lib/models/customer.model";
import type { ExpertCustomerAssignment } from "@/lib/models/customer-assignment.model";
import type { PriceList } from "@/lib/models/pricing.model";
import type { SepidarStock } from "@/lib/models/stock.model";
import { createExpertCustomerAssignment, deactivateExpertCustomerAssignment, listExpertCustomerAssignments, listSupportExperts, updateExpertCustomerAssignment } from "@/lib/services/customer-assignment.service";
import { listCustomers } from "@/lib/services/customer.service";
import { listGeneratedPriceLists } from "@/lib/services/pricing.service";
import { listSepidarStocks } from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const PAGE_SIZE = 10;
type QuickFilter = "all" | "assigned" | "unassigned";

export default function SupportCustomerAssignmentsPage() {
  const [experts, setExperts] = useState<AuthUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignments, setAssignments] = useState<ExpertCustomerAssignment[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [selectedMaster, setSelectedMaster] = useState("unassigned");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("unassigned");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [targetExpertId, setTargetExpertId] = useState("");
  const [selectedPriceListIds, setSelectedPriceListIds] = useState<string[]>([]);
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    const [expertData, customerData, assignmentData, priceListData, stockData] = await Promise.all([
      listSupportExperts(), listAllActiveCustomers(), listAllAssignments(),
      listGeneratedPriceLists({ activeOnly: true }), listSepidarStocks(),
    ]);
    setExperts(expertData.filter((expert) => expert.status === "active" && expert.role === "expert"));
    setCustomers(customerData);
    setAssignments(assignmentData);
    setPriceLists(priceListData);
    setStocks(stockData);
  };

  useEffect(() => {
    let mounted = true;
    // Initial remote synchronization; state changes occur after the requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch((loadError) => mounted && setError(getErrorMessage(loadError))).finally(() => mounted && setIsLoading(false));
    return () => { mounted = false; };
  }, []);

  const activeAssignments = useMemo(() => assignments.filter((item) => item.status === "active"), [assignments]);
  const assignmentByCustomer = useMemo(() => new Map(activeAssignments.map((item) => [item.customerObjectId, item])), [activeAssignments]);
  const expertCounts = useMemo(() => {
    const counts = new Map<string, number>();
    activeAssignments.forEach((item) => counts.set(item.expertObjectId, (counts.get(item.expertObjectId) || 0) + 1));
    return counts;
  }, [activeAssignments]);
  const unassignedCount = customers.filter((customer) => !assignmentByCustomer.has(customer.objectId)).length;

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fa");
    return customers.filter((customer) => {
      const assignment = assignmentByCustomer.get(customer.objectId);
      if (selectedMaster === "unassigned" && assignment) return false;
      if (selectedMaster !== "all" && selectedMaster !== "unassigned" && assignment?.expertObjectId !== selectedMaster) return false;
      if (selectedMaster === "all" && quickFilter === "assigned" && !assignment) return false;
      if (selectedMaster === "all" && quickFilter === "unassigned" && assignment) return false;
      return !term || [customer.fullName, customer.sepidarCustomerCode, customer.phone, assignment?.expertName]
        .filter(Boolean).join(" ").toLocaleLowerCase("fa").includes(term);
    });
  }, [assignmentByCustomer, customers, quickFilter, search, selectedMaster]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);
  const pageCustomers = filteredCustomers.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);
  const allPageSelected = pageCustomers.length > 0 && pageCustomers.every((customer) => selectedCustomerIds.includes(customer.objectId));

  const selectMaster = (value: string) => {
    setSelectedMaster(value);
    setQuickFilter(value === "unassigned" ? "unassigned" : value === "all" ? "all" : "assigned");
    setTargetExpertId(value !== "all" && value !== "unassigned" ? value : "");
    setSelectedCustomerIds([]);
    setPage(1);
  };
  const applyQuickFilter = (value: QuickFilter) => {
    setQuickFilter(value);
    setSelectedMaster(value === "unassigned" ? "unassigned" : "all");
    setSelectedCustomerIds([]);
    setPage(1);
  };
  const toggleCustomer = (customerId: string) => setSelectedCustomerIds((current) => current.includes(customerId) ? current.filter((id) => id !== customerId) : [...current, customerId]);

  const submitBulkAssignment = async () => {
    if (!selectedCustomerIds.length || !targetExpertId || !selectedPriceListIds.length || !selectedStockIds.length) {
      setError("مشتری‌ها، کارشناس مقصد، لیست قیمت و انبار مجاز را کامل انتخاب کنید.");
      return;
    }
    const actorName = getStoredCurrentUser()?.fullName || getStoredCurrentUser()?.username || "پشتیبان";
    setIsSubmitting(true); setError(""); setMessage("");
    let completed = 0;
    try {
      for (const customerObjectId of selectedCustomerIds) {
        const existing = assignmentByCustomer.get(customerObjectId);
        if (existing) {
          await updateExpertCustomerAssignment(existing.objectId, { expertUserId: targetExpertId, customerObjectId, priceListIds: selectedPriceListIds, allowedStockObjectIds: selectedStockIds, updatedByName: actorName });
        } else {
          await createExpertCustomerAssignment({ expertUserId: targetExpertId, customerObjectId, priceListIds: selectedPriceListIds, allowedStockObjectIds: selectedStockIds, assignedByName: actorName });
        }
        completed += 1;
      }
      await loadData();
      setSelectedCustomerIds([]);
      setMessage(`${formatFaDigits(completed)} مشتری با موفقیت اختصاص/منتقل شد.`);
    } catch (submitError) {
      setError(completed ? `${formatFaDigits(completed)} مورد انجام شد؛ ادامه عملیات متوقف شد. ${getErrorMessage(submitError)}` : getErrorMessage(submitError));
      await loadData().catch(() => undefined);
    } finally { setIsSubmitting(false); }
  };

  const deactivateAssignment = async (assignment: ExpertCustomerAssignment) => {
    setIsSubmitting(true); setError("");
    try {
      await deactivateExpertCustomerAssignment(assignment.objectId);
      await loadData();
      setSelectedCustomerIds((current) => current.filter((id) => id !== assignment.customerObjectId));
      setMessage("اختصاص مشتری غیرفعال شد.");
    } catch (deactivateError) { setError(getErrorMessage(deactivateError)); }
    finally { setIsSubmitting(false); }
  };

  const expertOptions = experts.map((expert) => ({ value: expert.objectId, label: expert.fullName || expert.username || "کارشناس فروش" }));
  const masterOptions = [
    { value: "all", label: `همه مشتری‌ها (${formatFaDigits(customers.length)})` },
    { value: "unassigned", label: `بدون کارشناس (${formatFaDigits(unassignedCount)})` },
    ...experts.map((expert) => ({ value: expert.objectId, label: `${expert.fullName || expert.username || "کارشناس"} (${formatFaDigits(expertCounts.get(expert.objectId) || 0)})` })),
  ];
  const priceListOptions = priceLists.map((item) => ({ value: item.objectId, label: item.name || item.title || "-" }));
  const stockOptions = stocks.filter((item) => item.isActive).map((item) => ({ value: item.objectId, label: `${formatFaDigits(item.code || "-")} - ${item.title}` }));

  return (
    <DashboardLayout role="support" title="اختصاص مشتری به کارشناس">
      <SectionHeader title="اختصاص مشتری به کارشناس" description="مشتری‌ها را سریع پیدا کنید و به‌صورت گروهی به کارشناس فروش اختصاص دهید." />
      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? <LoadingState title="در حال دریافت مشتریان و کارشناسان" /> : <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-white p-2 dark:border-slate-700 dark:bg-slate-950">
          {(["all", "assigned", "unassigned"] as QuickFilter[]).map((value) => <Button key={value} type="button" variant={quickFilter === value ? "default" : "ghost"} onClick={() => applyQuickFilter(value)}>{value === "all" ? "همه" : value === "assigned" ? "اختصاص‌یافته" : "بدون کارشناس"}</Button>)}
        </div>
        <div className="md:hidden"><SearchableSelect value={selectedMaster} onValueChange={selectMaster} options={masterOptions} placeholder="انتخاب کارشناس" searchPlaceholder="جستجوی کارشناس" emptyMessage="کارشناسی یافت نشد" /></div>

        <div className="grid items-start gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
          <Card className="sticky top-4 hidden max-h-[calc(100vh-2rem)] overflow-y-auto p-2 md:block">
            <MasterButton active={selectedMaster === "all"} icon={<Users className="size-4" />} label="همه مشتری‌ها" count={customers.length} onClick={() => selectMaster("all")} />
            <MasterButton active={selectedMaster === "unassigned"} icon={<UserRoundX className="size-4" />} label="مشتریان بدون کارشناس" count={unassignedCount} onClick={() => selectMaster("unassigned")} />
            <div className="my-2 border-t dark:border-slate-700" />
            {experts.map((expert) => <MasterButton key={expert.objectId} active={selectedMaster === expert.objectId} icon={<span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{(expert.fullName || "ک").slice(0, 1)}</span>} label={expert.fullName || expert.username || "کارشناس فروش"} count={expertCounts.get(expert.objectId) || 0} onClick={() => selectMaster(expert.objectId)} />)}
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <div className="border-b p-4 dark:border-slate-700"><label className="relative block"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setSelectedCustomerIds([]); }} className="pr-10" placeholder="جستجو با نام، کد مشتری، تلفن یا کارشناس" /></label></div>
            {pageCustomers.length ? <div className="divide-y dark:divide-slate-700">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <input aria-label="انتخاب همه مشتری‌های صفحه" type="checkbox" checked={allPageSelected} onChange={() => setSelectedCustomerIds((current) => allPageSelected ? current.filter((id) => !pageCustomers.some((customer) => customer.objectId === id)) : Array.from(new Set([...current, ...pageCustomers.map((customer) => customer.objectId)])))} className="size-4 accent-emerald-600" />
                <span>{formatFaDigits(filteredCustomers.length)} مشتری</span>
              </div>
              {pageCustomers.map((customer) => {
                const assignment = assignmentByCustomer.get(customer.objectId);
                const selected = selectedCustomerIds.includes(customer.objectId);
                return <div key={customer.objectId} className={`grid gap-3 px-4 py-3 transition sm:grid-cols-[24px_minmax(0,1fr)_180px_auto] sm:items-center ${selected ? "bg-emerald-50/70 dark:bg-emerald-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-900/60"}`}>
                  <input aria-label={`انتخاب ${customer.fullName}`} type="checkbox" checked={selected} onChange={() => toggleCustomer(customer.objectId)} className="size-4 accent-emerald-600" />
                  <div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-slate-100">{customer.fullName || "مشتری"}</p><p className="mt-1 text-xs text-slate-500">کد مشتری: {formatFaDigits(customer.sepidarCustomerCode || customer.id)}</p></div>
                  <div>{assignment ? <Badge variant="success">{assignment.expertName || "اختصاص‌یافته"}</Badge> : <Badge variant="neutral">بدون کارشناس</Badge>}</div>
                  {assignment ? <Button type="button" size="sm" variant="ghost" disabled={isSubmitting} onClick={() => deactivateAssignment(assignment)}>حذف اختصاص</Button> : <span />}
                </div>;
              })}
            </div> : <EmptyState title="مشتری‌ای یافت نشد" description="فیلتر یا عبارت جستجو را تغییر دهید." />}
            <div className="border-t p-3 dark:border-slate-700"><PaginationBar currentPage={effectivePage} totalPages={totalPages} totalItems={filteredCustomers.length} onPageChange={(nextPage) => { setPage(nextPage); setSelectedCustomerIds([]); }} /></div>
          </Card>
        </div>

        <Card className="sticky bottom-3 z-20 border-emerald-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-emerald-900 dark:bg-slate-950/95">
          <div className="grid gap-3 lg:grid-cols-[150px_minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-end">
            <div className="text-sm"><span className="text-slate-500">انتخاب‌شده</span><p className="mt-1 text-lg font-bold">{formatFaDigits(selectedCustomerIds.length)} مشتری</p></div>
            <label className="grid gap-1 text-sm font-medium"><span>کارشناس مقصد</span><SearchableSelect value={targetExpertId || undefined} onValueChange={setTargetExpertId} options={expertOptions} placeholder="انتخاب کارشناس" searchPlaceholder="جستجوی کارشناس" emptyMessage="کارشناسی یافت نشد" /></label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid min-w-0 gap-1 text-sm font-medium"><span>لیست‌های قیمت</span><SearchableMultiSelect values={selectedPriceListIds} onValuesChange={setSelectedPriceListIds} options={priceListOptions} placeholder="انتخاب لیست قیمت" searchPlaceholder="جستجو" emptyMessage="لیستی یافت نشد" /></label>
              <label className="grid min-w-0 gap-1 text-sm font-medium"><span>انبارهای مجاز</span><SearchableMultiSelect values={selectedStockIds} onValuesChange={setSelectedStockIds} options={stockOptions} placeholder="انتخاب انبار" searchPlaceholder="جستجو" emptyMessage="انباری یافت نشد" /></label>
            </div>
            <Button type="button" disabled={isSubmitting || !selectedCustomerIds.length} onClick={submitBulkAssignment}><Check className="ml-2 size-4" />{isSubmitting ? "در حال ثبت..." : "اختصاص / انتقال گروهی"}</Button>
          </div>
        </Card>
      </div>}
    </DashboardLayout>
  );
}

async function listAllActiveCustomers(): Promise<Customer[]> {
  const result: Customer[] = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const page = await listCustomers({ status: "active", limit, offset });
    result.push(...page);
    if (page.length < limit) return result;
  }
}

async function listAllAssignments(): Promise<ExpertCustomerAssignment[]> {
  const result: ExpertCustomerAssignment[] = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const page = await listExpertCustomerAssignments({ limit, offset });
    result.push(...page);
    if (page.length < limit) return result;
  }
}

function MasterButton({ active, icon, label, count, onClick }: { active: boolean; icon: ReactNode; label: string; count: number; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-right text-sm transition ${active ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"}`}>{icon}<span className="min-w-0 flex-1 truncate">{label}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{formatFaDigits(count)}</span></button>;
}
