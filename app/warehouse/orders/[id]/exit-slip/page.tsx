"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";

export default function ExitSlipCreatePage() {
  return (
    <DashboardLayout role="warehouse" title="صدور حواله خروج">
      <EmptyState
        title="اتصال فرم حواله خروج به backend در دست تکمیل است"
        description="داده نمونه از این صفحه حذف شده است. پس از نهایی شدن endpointهای جزئیات سفارش و حواله، این فرم به سرویس واقعی متصل می شود."
      />
    </DashboardLayout>
  );
}
