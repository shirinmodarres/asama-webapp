"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";

export default function SupportOrderEditPage() {
  return (
    <DashboardLayout role="support" title="ویرایش ویژه سفارش">
      <EmptyState
        title="اتصال این صفحه به backend در دست تکمیل است"
        description="برای ویرایش ویژه سفارش هنوز endpoint اختصاصی backend در این نسخه نهایی نشده است. داده نمونه از این صفحه حذف شده و پس از آماده شدن endpoint، فرم ویرایش به سرویس واقعی متصل می شود."
      />
    </DashboardLayout>
  );
}
