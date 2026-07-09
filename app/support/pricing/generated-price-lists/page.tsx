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
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PriceList } from "@/lib/models/pricing.model";
import { listGeneratedPriceLists } from "@/lib/services/pricing.service";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function GeneratedPriceListsPage() {
  const [rows, setRows] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    listGeneratedPriceLists()
      .then((data) => {
        if (mounted) setRows(data);
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

  const columns: DataTableColumn<PriceList>[] = [
    { key: "brand", header: "برند", render: (row) => row.brandName || "-" },
    { key: "name", header: "لیست قیمت", render: (row) => row.displayName || row.name || "-" },
    { key: "code", header: "کد داخلی", render: (row) => row.internalCode ? formatFaDigits(row.internalCode) : "-" },
    { key: "type", header: "نوع", render: (row) => row.typeTitle || row.typeCode || "-" },
    { key: "reference", header: "کد مرجع", render: (row) => row.referenceInternalCode ? formatFaDigits(row.referenceInternalCode) : "-" },
    { key: "items", header: "تعداد کالا", render: (row) => formatNumber(row.itemCount) },
    { key: "generated", header: "زمان تولید", render: (row) => row.generatedAt ? formatDateTime(row.generatedAt) : "-" },
    { key: "status", header: "وضعیت", render: (row) => row.isActive ? "فعال" : "آرشیو" },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        row.objectId || row.id ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/support/pricing/generated-price-lists/${row.objectId || row.id}`}>جزئیات</Link>
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
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState title="لیست تولیدی وجود ندارد" description="از صفحه لیست‌های مرجع، برای مرجع فعال برند لیست قیمت تولید کنید." />
      )}
    </DashboardLayout>
  );
}
