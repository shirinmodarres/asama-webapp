"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NajaCentersTable } from "@/components/naja/naja-centers-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { NajaCenter } from "@/lib/models/naja-center.model";
import { listNajaCenters } from "@/lib/services/naja-center.service";

export default function SupportNajaCentersPage() {
  const [centers, setCenters] = useState<NajaCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      {isLoading ? (
        <LoadingState title="در حال دریافت مراکز ناجا" />
      ) : error ? (
        <PageErrorMessage title="دریافت مراکز انجام نشد" message={error} />
      ) : centers.length > 0 ? (
        <NajaCentersTable centers={centers} actionBasePath="/support/naja-centers" />
      ) : (
        <EmptyState title="مرکزی ثبت نشده است" description="مرکز ناجا تعریف کنید." />
      )}
    </DashboardLayout>
  );
}
