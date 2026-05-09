"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";

export default function WarehouseOrderDetailsPage() {
  return (
    <DashboardLayout role="warehouse" title="جزئیات سفارش انبار">
      <EmptyState
        title="اتصال جزئیات انبار به backend در دست تکمیل است"
        description="داده نمونه از این صفحه حذف شده است. برای این نسخه، فهرست سفارش های انبار از backend دریافت می شود و جزئیات این مسیر پس از تکمیل endpointهای مرتبط فعال خواهد شد."
      />
    </DashboardLayout>
  );
}
