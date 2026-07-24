"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, PencilLine, Copy, Ban, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { formatCurrency, formatDate, formatNumber } from "@/lib/expert/utils";
import { getErrorMessage } from "@/lib/api/api-error";
import type { SalesQuotation, SalesQuotationItem } from "@/lib/models/sales-quotation.model";
import { cancelSalesQuotation, duplicateSalesQuotation, finalizeSalesQuotation, getSalesQuotation } from "@/lib/services/sales-quotation.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ExpertQuotationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quotation, setQuotation] = useState<SalesQuotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadQuotation() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getSalesQuotation(params.id);
        if (mounted) setQuotation(data);
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadQuotation();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const columns: DataTableColumn<SalesQuotationItem>[] = useMemo(
    () => [
      { key: "name", header: "کالا", render: (row) => row.productName || row.productSku || "-" },
      { key: "qty", header: "تعداد", render: (row) => formatNumber(row.quantity) },
      { key: "unitPrice", header: "قیمت واحد", render: (row) => formatCurrency(row.unitPrice) },
      { key: "discount", header: "تخفیف", render: (row) => formatCurrency(row.discount) },
      { key: "tax", header: "مالیات", render: (row) => formatCurrency(row.tax) },
      { key: "total", header: "مبلغ", render: (row) => formatCurrency(row.lineTotal) },
    ],
    [],
  );

  const handleAction = async (action: () => Promise<SalesQuotation>) => {
    if (!quotation) return;
    setIsSubmitting(true);
    setActionError("");
    try {
      const updated = await action();
      setQuotation(updated);
    } catch (actionErr) {
      setActionError(getErrorMessage(actionErr));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="expert" title="جزئیات پیش فاکتور">
      {isLoading ? (
        <LoadingState title="در حال دریافت پیش فاکتور" />
      ) : error ? (
        <PageErrorMessage title="دریافت پیش فاکتور انجام نشد" message={error} />
      ) : !quotation ? (
        <EmptyState title="پیش فاکتور یافت نشد" description="رکوردی برای این شناسه وجود ندارد." />
      ) : (
        <>
          <SectionHeader
            title={`پیش فاکتور ${formatFaDigits(quotation.quotationNumber)}`}
            description="پیش فاکتور مستقل از سفارش و بدون تأثیر روی موجودی"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={quotation.pdfUrl || `/api/sales-quotations/${quotation.objectId}/pdf`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm font-medium text-white"
                >
                  <Download className="size-4" />
                  دانلود PDF
                </a>
                {quotation.status === "draft" ? (
                  <Link href={`/expert/quotations/${quotation.objectId}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#1F3A5F]">
                    <PencilLine className="size-4" />
                    ویرایش
                  </Link>
                ) : null}
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleAction(() => finalizeSalesQuotation(quotation.objectId))}>
                  <CheckCircle2 className="ml-2 size-4" />
                  نهایی‌سازی
                </Button>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleAction(() => cancelSalesQuotation(quotation.objectId))}>
                  <Ban className="ml-2 size-4" />
                  لغو
                </Button>
                <Button type="button" disabled={isSubmitting} onClick={() => handleAction(() => duplicateSalesQuotation(quotation.objectId))}>
                  <Copy className="ml-2 size-4" />
                  تکثیر
                </Button>
              </div>
            }
          />

          {actionError ? <PageErrorMessage title="انجام عملیات ممکن نشد" message={actionError} /> : null}

          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[#E5E7EB] px-5 py-4">
                <h3 className="text-base font-semibold text-[#1F3A5F]">اقلام پیش فاکتور</h3>
              </div>
              <DataTable columns={columns} rows={quotation.items} rowKey={(row) => row.productObjectId || row.productSku || row.productName} />
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="text-base font-semibold text-[#1F3A5F]">اطلاعات پیش فاکتور</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <InfoRow label="مشتری" value={quotation.customerName || "-"} />
                  <InfoRow label="لیست قیمت" value={quotation.priceListTitle || "-"} />
                  <InfoRow label="وضعیت" value={<StatusBadge type="order" status={quotation.status} />} />
                  <InfoRow label="تاریخ اعتبار" value={quotation.validUntil ? formatDate(quotation.validUntil) : "-"} />
                  <InfoRow label="جمع جزء" value={formatCurrency(quotation.subtotal)} />
                  <InfoRow label="تخفیف" value={formatCurrency(quotation.discount)} />
                  <InfoRow label="مالیات" value={formatCurrency(quotation.tax)} />
                  <InfoRow label="جمع کل" value={formatCurrency(quotation.total)} />
                </dl>
              </Card>
              {quotation.notes ? (
                <Card className="p-5">
                  <h3 className="text-base font-semibold text-[#1F3A5F]">توضیحات</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#334155]">{quotation.notes}</p>
                </Card>
              ) : null}
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8EEF4] bg-[#FBFCFD] px-3.5 py-3">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="font-semibold text-[#102034]">{value}</dd>
    </div>
  );
}
