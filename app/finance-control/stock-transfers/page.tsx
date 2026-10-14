"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SectionHeader } from "@/components/shared/section-header";
import { StockTransferList } from "@/components/stock-transfer/stock-transfer-list";

export default function SystemsStockTransfersPage() {
  return (
    <DashboardLayout role="finance-control" title="حواله‌های انتقال">
      <SectionHeader
        title="حواله‌های انتقال"
        description="انتقال‌های تأییدشده مدیر فروش را مشاهده کنید. حواله فقط پس از تکمیل انبار قابل دریافت است."
      />
      <StockTransferList role="systems_expert" />
    </DashboardLayout>
  );
}
