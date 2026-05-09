"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";

export default function ExitSlipDetailsPage() {
  return (
    <DashboardLayout role="warehouse" title="جزئیات حواله خروج">
      <EmptyState
        title="جزئیات حواله خروج هنوز به backend متصل نشده است"
        description="این مسیر دیگر از داده محلی استفاده نمی کند. بعد از آماده شدن endpoint جزئیات حواله، اطلاعات کامل این صفحه از سرور دریافت خواهد شد."
      />
    </DashboardLayout>
  );
}
