"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SectionHeader } from "@/components/shared/section-header";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { TransferStatusBadge } from "@/components/stock-transfer/transfer-status-badge";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { StockTransferListResult } from "@/lib/models/stock.model";
import { listWarehouseStockTransfersPage } from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function FinanceStockTransfersPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<StockTransferListResult | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    listWarehouseStockTransfersPage({ page, pageSize: 15 })
      .then((data) => { if (active) { setResult(data); setError(""); } })
      .catch((reason) => { if (active) { setResult(null); setError(getErrorMessage(reason)); } });
    return () => { active = false; };
  }, [page]);
  return <DashboardLayout role="finance" title="حواله‌های انتقال">
    <SectionHeader title="حواله‌های انتقال" description="مشاهده حواله‌های انتقال صادرشده" />
    {error ? <PageErrorMessage title="دریافت حواله‌ها انجام نشد" message={error} /> : !result || result.pagination.page !== page ? <LoadingState title="در حال دریافت حواله‌ها" /> : !result.items.length ? <EmptyState title="حواله انتقالی یافت نشد" description="حواله‌های صادرشده در این بخش نمایش داده می‌شوند." /> : <div className="space-y-3">
      {result.items.map((transfer) => <Card key={transfer.objectId} className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"><strong>شماره حواله: {transfer.transferSlipCode ? formatFaDigits(transfer.transferSlipCode) : "نامشخص"}</strong><span>مبدأ: {transfer.sourceStockTitle || "-"}</span><span>مقصد: {transfer.destinationStockTitle || "-"}</span><TransferStatusBadge status={transfer.status} /></div>
        <div className="grid gap-2 sm:grid-cols-2">{transfer.items.map((item, index) => <div key={`${item.productObjectId}-${index}`} className="rounded-lg border p-3 text-sm">{item.productName || "کالای نامشخص"} · تعداد: {formatNumber(item.quantity)}</div>)}</div>
      </Card>)}
      <PaginationBar currentPage={page} totalPages={result.pagination.totalPages} totalItems={result.pagination.total} onPageChange={setPage} />
    </div>}
  </DashboardLayout>;
}
