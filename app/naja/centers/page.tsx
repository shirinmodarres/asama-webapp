"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NajaCentersTable } from "@/components/naja/naja-centers-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { compareText } from "@/lib/expert/utils";
import type { NajaCenter } from "@/lib/models/naja-center.model";
import { listNajaCenters } from "@/lib/services/naja-center.service";
import Link from "next/link";

export default function NajaCentersPage() {
  const [centers, setCenters] = useState<NajaCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...centers]
      .filter((center) => {
        if (!query) return true;
        return [
          center.name,
          center.centerCode,
          center.responsibleName,
          center.phone,
          center.province,
          center.city,
          center.county,
        ].some((value) => value.toLowerCase().includes(query));
      })
      .sort((a, b) => compareText(a.name, b.name));
  }, [centers, search]);

  return (
    <DashboardLayout role="naja" title="مراکز ناجا">
      <SectionHeader
        title="مراکز ناجا"
        description="فهرست مراکز ثبت شده ناجا را از backend مشاهده و ویرایش کنید."
        actions={
          <Button asChild>
            <Link href="/naja/centers/new">تعریف مرکز ناجا</Link>
          </Button>
        }
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو بر اساس نام مرکز، کدپستی مرکز، مسئول یا موقعیت"
            className="pr-10"
          />
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت مراکز ناجا" />
      ) : error ? (
        <PageErrorMessage title="دریافت مراکز ناجا انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <NajaCentersTable centers={rows} />
      ) : (
        <EmptyState
          title="مرکز ناجا یافت نشد"
          description="هنوز مرکزی ثبت نشده یا عبارت جستجو نتیجه ای ندارد."
        />
      )}
    </DashboardLayout>
  );
}
