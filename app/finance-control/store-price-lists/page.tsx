"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/components/ui/sonner";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PriceList } from "@/lib/models/pricing.model";
import {
  getStorePriceListConfiguration,
  saveStorePriceListAssignment,
  type StorePriceListAssignment,
} from "@/lib/services/store-expert-order.service";

export default function StorePriceListsPage() {
  const [assignments, setAssignments] = useState<StorePriceListAssignment[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [selectedByBrand, setSelectedByBrand] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingBrand, setSavingBrand] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const data = await getStorePriceListConfiguration();
    setAssignments(data.assignments);
    setPriceLists(data.availablePriceLists);
    setSelectedByBrand(Object.fromEntries(data.assignments.map((assignment) => [assignment.brandName, assignment.priceList.objectId])));
  };

  useEffect(() => {
    let active = true;
    async function loadConfiguration() {
      try {
        const data = await getStorePriceListConfiguration();
        if (!active) return;
        setAssignments(data.assignments);
        setPriceLists(data.availablePriceLists);
        setSelectedByBrand(Object.fromEntries(data.assignments.map((assignment) => [assignment.brandName, assignment.priceList.objectId])));
      } catch (reason) {
        if (active) setError(getErrorMessage(reason));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadConfiguration();
    return () => { active = false; };
  }, []);
  const brands = useMemo(() => [...new Set(priceLists.map((priceList) => priceList.brandName).filter((brand): brand is string => Boolean(brand)))].sort((a, b) => a.localeCompare(b, "fa")), [priceLists]);
  const save = async (brandName: string) => {
    const priceListId = selectedByBrand[brandName];
    if (!priceListId) return;
    setSavingBrand(brandName); setError("");
    try { await saveStorePriceListAssignment(brandName, priceListId); await load(); toast.success("لیست قیمت مشترک برند ذخیره شد."); }
    catch (reason) { setError(getErrorMessage(reason)); }
    finally { setSavingBrand(""); }
  };
  return <DashboardLayout role="support" title="قیمت‌گذاری فروشگاه"><SectionHeader title="لیست قیمت مشترک فروشگاه" description="برای هر برند مادسنتر فقط یک لیست قیمت فعال انتخاب کنید؛ همه کارشناسان فروشگاه از همان قیمت استفاده می‌کنند." />{error ? <InlineErrorMessage message={error} /> : null}{loading ? <LoadingState title="در حال دریافت لیست‌های قیمت" /> : !brands.length ? <EmptyState title="لیست قیمت فعالی وجود ندارد" description="ابتدا لیست قیمت برند را تولید کنید." /> : <div className="space-y-3">{brands.map((brandName) => { const choices = priceLists.filter((priceList) => priceList.brandName === brandName); const assignment = assignments.find((item) => item.brandName === brandName); return <Card key={brandName} className="grid gap-3 p-4 md:grid-cols-[minmax(180px,1fr)_minmax(300px,2fr)_auto] md:items-end"><div><h2 className="font-semibold text-foreground">{brandName}</h2><p className="mt-1 text-sm text-muted-foreground">{assignment ? `لیست فعلی: ${assignment.priceList.title}` : "لیست مشترکی تعیین نشده است"}</p></div><SearchableSelect value={selectedByBrand[brandName] || undefined} onValueChange={(value) => setSelectedByBrand((current) => ({ ...current, [brandName]: value }))} options={choices.map((priceList) => ({ value: priceList.objectId, label: priceList.title, description: priceList.typeTitle || priceList.typeCode || undefined }))} placeholder="انتخاب لیست قیمت" emptyMessage="لیست فعالی برای این برند نیست" /><Button disabled={!selectedByBrand[brandName] || savingBrand === brandName} onClick={() => void save(brandName)}>{savingBrand === brandName ? "در حال ذخیره..." : "ذخیره"}</Button></Card>; })}</div>}</DashboardLayout>;
}
