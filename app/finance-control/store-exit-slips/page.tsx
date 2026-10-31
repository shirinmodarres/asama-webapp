"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { listStoreIssuedExitSlips } from "@/lib/services/store-expert-order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const PAGE_SIZE = 25;

export default function StoreExitSlipsPage() {
  const [slips, setSlips] = useState<ExitSlip[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await listStoreIssuedExitSlips(page, PAGE_SIZE);
        if (!active) return;
        setSlips(result.items);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (reason) {
        if (active) setError(getErrorMessage(reason));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [page]);

  const columns: DataTableColumn<ExitSlip>[] = [
    { key: "slipCode", header: "شماره حواله", render: (slip) => <span className="font-semibold text-foreground">{formatFaDigits(slip.slipCode)}</span> },
    { key: "orderCode", header: "کد سفارش", render: (slip) => formatFaDigits(slip.orderCode) || "-" },
    { key: "customer", header: "مشتری", render: (slip) => slip.customerName || "-" },
    { key: "warehouse", header: "انبار", render: (slip) => slip.stockTitle || "-" },
    { key: "issuedAt", header: "تاریخ صدور", render: (slip) => formatDateTime(slip.issuedAt || slip.createdAt) },
    { key: "label", header: "نوع", render: () => <Badge variant="neutral">مادسنتر</Badge> },
  ];

  return <DashboardLayout role="finance-control" title="حواله‌های مادسنتر">
    <SectionHeader title="حواله‌های خروج مادسنتر" description="فقط حواله‌های خروج صادرشده نمایش داده می‌شوند؛ این صفحه هیچ اقدام یا تأییدی ندارد." />
    {loading ? <LoadingState title="در حال دریافت حواله‌های مادسنتر" /> : error ? <PageErrorMessage title="دریافت حواله‌ها انجام نشد" message={error} /> : !slips.length ? <EmptyState title="حواله خروج مادسنتری صادر نشده است" description="پس از صدور حواله، در این فهرست نمایش داده می‌شود." /> : <section className="space-y-4"><DataTable columns={columns} rows={slips} rowKey={(slip) => slip.objectId} /><PaginationBar currentPage={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} /></section>}
  </DashboardLayout>;
}
