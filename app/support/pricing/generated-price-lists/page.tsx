"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PriceList, PricingReference } from "@/lib/models/pricing.model";
import { listGeneratedPriceLists, listPricingReferences } from "@/lib/services/pricing.service";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

type PriceListRow =
  | (PriceList & { rowType: "generated" })
  | (PricingReference & { rowType: "reference" });

export default function GeneratedPriceListsPage() {
  const [rows, setRows] = useState<PriceListRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([listGeneratedPriceLists(), listPricingReferences()])
      .then(([generatedRows, referenceRows]) => {
        if (mounted) setRows(normalizeRows(generatedRows, referenceRows));
      })
      .catch((err) => {
        if (mounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const columns: DataTableColumn<PriceListRow>[] = [
    { key: "kind", header: "نوع", render: (row) => row.rowType === "reference" ? <Badge variant="brand">لیست مرجع</Badge> : <Badge variant={row.isActive ? "success" : "neutral"}>{getPriceListStatusLabel(row)}</Badge> },
    { key: "brand", header: "برند", render: (row) => row.rowType === "reference" ? row.brandName || "-" : row.brandName || "-" },
    { key: "name", header: "لیست قیمت", render: (row) => row.rowType === "reference" ? (row.displayName || row.internalCode || "-") : (row.displayName || row.name || "-") },
    { key: "code", header: "کد لیست قیمت", render: (row) => row.rowType === "reference" ? (row.internalCode ? formatFaDigits(row.internalCode) : "-") : (row.internalCode ? formatFaDigits(row.internalCode) : "-") },
    { key: "type", header: "نوع لیست", render: (row) => row.rowType === "reference" ? "مرجع" : (row.typeTitle || row.typeCode || "-") },
    { key: "reference", header: "کد سپیدار", render: (row) => row.rowType === "reference" ? (row.sepidarSaleTypeId ? formatFaDigits(row.sepidarSaleTypeId) : "-") : (row.referenceInternalCode ? formatFaDigits(row.referenceInternalCode) : "-") },
    { key: "items", header: "تعداد کالا", render: (row) => row.rowType === "reference" ? 0 : formatNumber(row.itemCount) },
    { key: "generated", header: "زمان تولید", render: (row) => row.rowType === "reference" ? (row.createdAt ? formatDateTime(row.createdAt) : "-") : (row.generatedAt ? formatDateTime(row.generatedAt) : "-") },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => row.rowType === "reference" ? <Badge variant="brand">{row.isActive ? "فعال" : "آرشیو"}</Badge> : <Badge variant={row.isActive ? "success" : "neutral"}>{getPriceListStatusLabel(row)}</Badge>,
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        row.objectId || row.id ? (
          <Button asChild size="sm" variant="outline">
            <Link href={row.rowType === "reference" ? `/support/pricing/reference-price-lists/${row.objectId || row.id}` : `/support/pricing/generated-price-lists/${row.objectId || row.id}`}>جزئیات</Link>
          </Button>
        ) : "-"
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="لیست‌های قیمت تولیدی">
      <SectionHeader title="لیست‌های قیمت تولیدی" description="لیست‌های داخلی ساخته‌شده از مرجع برند" />
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? <LoadingState title="در حال دریافت لیست‌های قیمت" /> : rows.length ? (
        <DataTable columns={columns} rows={rows} rowKey={(row) => `${row.rowType}:${row.objectId}`} />
      ) : (
        <EmptyState title="لیست تولیدی وجود ندارد" description="از صفحه لیست‌های مرجع، برای مرجع فعال برند لیست قیمت تولید کنید." />
      )}
    </DashboardLayout>
  );
}

function normalizeRows(generatedRows: PriceList[], referenceRows: PricingReference[]): PriceListRow[] {
  return [
    ...referenceRows.map((row) => ({ ...row, rowType: "reference" as const })),
    ...generatedRows.map((row) => ({ ...row, rowType: "generated" as const })),
  ];
}

function getPriceListStatusLabel(priceList: PriceList): string {
  const status = (priceList as PriceList & { status?: string | null }).status;
  if (priceList.isActive) return "فعال";
  if (status === "inactive" || status === "disabled") return "غیرفعال";
  return "آرشیو";
}
