"use client";

import Link from "next/link";
import { FilePlus2, ListChecks, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/api-error";
import { getStoreExpertDashboard, type StoreExpertDashboardStats } from "@/lib/services/store-expert-order.service";

const cards = [
  { key: "orderCount", label: "تعداد سفارش‌ها" },
  { key: "pendingExitCount", label: "در انتظار خروج" },
  { key: "partialExitCount", label: "خروج جزئی" },
  { key: "completedExitCount", label: "خروج تکمیل‌شده" },
] as const;

export default function StoreExpertPage() {
  const [stats, setStats] = useState<StoreExpertDashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void getStoreExpertDashboard().then(setStats).catch((loadError) => setError(getErrorMessage(loadError)));
  }, []);

  return (
    <DashboardLayout role="store-expert" title="داشبورد فروشگاه">
      <SectionHeader title="داشبورد فروشگاه" description="نمای کلی سفارش‌ها و خروج کالاهای مادسنتر" />
      {error ? <PageErrorMessage title="دریافت آمار انجام نشد" message={error} /> : !stats ? <LoadingState title="در حال دریافت آمار" /> : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => <Card key={card.key} className="p-5"><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-2 text-2xl font-bold">{stats[card.key]}</p></Card>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <QuickLink href="/store-expert/orders/new" icon={<FilePlus2 className="size-4" />} label="ثبت سفارش جدید" />
            <QuickLink href="/store-expert/orders" icon={<ListChecks className="size-4" />} label="سفارش‌های من" />
            <QuickLink href="/store-expert/exit-slips" icon={<ScanLine className="size-4" />} label="حواله‌های خروج" />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm font-medium transition hover:bg-muted">{icon}{label}</Link>;
}
