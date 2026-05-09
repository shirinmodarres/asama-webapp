"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";

export default function FinanceReconciliationPage() {
  return (
    <DashboardLayout role="finance" title="تطبیق سفارش و حواله">
      <EmptyState
        title="اتصال تطبیق مالی به backend در دست تکمیل است"
        description="داده نمونه از این صفحه حذف شده است. برای این نسخه، فهرست سفارش های آماده فاکتور از backend دریافت می شود و صفحه تطبیق پس از نهایی شدن endpointهای جزئیات مرتبط فعال خواهد شد."
      />
    </DashboardLayout>
  );
}
