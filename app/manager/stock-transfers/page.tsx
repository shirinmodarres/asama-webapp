"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SectionHeader } from "@/components/shared/section-header";
import { StockTransferList } from "@/components/stock-transfer/stock-transfer-list";

export default function ManagerStockTransfersPage() {
  return <DashboardLayout role="manager" title="انتقال موجودی">
    <SectionHeader title="مدیریت انتقال‌های موجودی" description="درخواست‌های انتقال را بررسی، تأیید یا در مرحله انتظار انبار لغو کنید." />
    <StockTransferList role="manager" />
  </DashboardLayout>;
}
