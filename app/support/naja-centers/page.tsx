"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ListFilter, Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NajaCentersTable } from "@/components/naja/naja-centers-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { compareText } from "@/lib/expert/utils";
import type { NajaCenter } from "@/lib/models/naja-center.model";
import { listNajaCenters } from "@/lib/services/naja-center.service";

export default function SupportNajaCentersPage() {
  const [centers, setCenters] = useState<NajaCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function loadCenters() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listNajaCenters();
        if (isMounted) setCenters(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCenters();
    return () => {
      isMounted = false;
    };
  }, []);

  const provinceOptions = useMemo(
    () => [
      { value: "all", label: "همه استان‌ها" },
      ...Array.from(new Set(centers.map((center) => center.province).filter(Boolean))).map((province) => ({
        value: province,
        label: province,
      })),
    ],
    [centers],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...centers]
      .filter((center) => {
        const matchesSearch =
          !query ||
          [
            center.name,
            center.centerCode,
            center.responsibleName,
            center.phone,
            center.province,
            center.city,
            center.county,
          ].some((value) => value.toLowerCase().includes(query));
        const matchesStatus =
          statusFilter === "all" || center.status === statusFilter;
        const matchesProvince =
          provinceFilter === "all" || center.province === provinceFilter;
        return matchesSearch && matchesStatus && matchesProvince;
      })
      .sort((a, b) => compareText(a.name, b.name));
  }, [centers, provinceFilter, search, statusFilter]);

  return (
    <DashboardLayout role="support" title="مراکز ناجا">
      <SectionHeader
        title="مراکز ناجا"
        description="تعریف و ویرایش مراکز ناجا"
        actions={
          <Button asChild>
            <Link href="/support/naja-centers/new">تعریف مرکز ناجا</Link>
          </Button>
        }
      />
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در مراکز ناجا</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس نام مرکز، کد مرکز، مسئول یا موقعیت"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>فیلتر استان</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect value={provinceFilter} onValueChange={setProvinceFilter} options={provinceOptions} placeholder="همه استان‌ها" searchPlaceholder="جستجو در استان‌ها" emptyMessage="استانی پیدا نشد" triggerClassName="pr-10" />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>فیلتر وضعیت</span>
            <SearchableSelect value={statusFilter} onValueChange={setStatusFilter} options={[{ value: "all", label: "همه وضعیت‌ها" }, { value: "active", label: "فعال" }, { value: "inactive", label: "غیرفعال" }]} placeholder="همه وضعیت‌ها" searchPlaceholder="جستجو در وضعیت‌ها" emptyMessage="وضعیتی پیدا نشد" />
          </label>
          <Button type="button" variant="outline" className="w-fit shrink-0" onClick={() => { setSearch(""); setProvinceFilter("all"); setStatusFilter("all"); }}>
            پاک کردن فیلترها
          </Button>
        </div>
      </section>
      {isLoading ? (
        <LoadingState title="در حال دریافت مراکز ناجا" />
      ) : error ? (
        <PageErrorMessage title="دریافت مراکز انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <NajaCentersTable centers={rows} actionBasePath="/support/naja-centers" />
      ) : (
        <EmptyState title="مرکزی ثبت نشده است" description="مرکز ناجا تعریف کنید." />
      )}
    </DashboardLayout>
  );
}
