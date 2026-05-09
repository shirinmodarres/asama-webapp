"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";

export default function FinanceInvoiceDetailsPage() {
  return (
    <DashboardLayout role="finance" title="جزئیات فاکتور">
      <EmptyState
        title="جزئیات فاکتور هنوز به backend متصل نشده است"
        description="داده نمونه از این صفحه حذف شده است. فهرست فاکتورها از backend دریافت می شود و جزئیات این مسیر پس از تکمیل contract جزئیات از سرور بارگذاری خواهد شد."
      />
    </DashboardLayout>
  );
}
