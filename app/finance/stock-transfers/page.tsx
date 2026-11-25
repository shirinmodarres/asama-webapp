"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SectionHeader } from "@/components/shared/section-header";
import { StockTransferList } from "@/components/stock-transfer/stock-transfer-list";

export default function FinanceStockTransfersPage() {
  return (
    <DashboardLayout role="finance" title="حواله‌های انتقال">
      <SectionHeader
        title="حواله‌های انتقال"
        description="حواله‌های انتقال صادرشده را مشاهده کنید."
      />
      <StockTransferList role="finance" />
    </DashboardLayout>
  );
}
