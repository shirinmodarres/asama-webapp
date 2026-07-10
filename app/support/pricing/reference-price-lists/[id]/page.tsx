"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  PricingReference,
  PricingReferenceItem,
  PricingReferenceItemsResult,
} from "@/lib/models/pricing.model";
import {
  listPricingReferenceItems,
} from "@/lib/services/pricing.service";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function PricingReferenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [reference, setReference] = useState<PricingReference | null>(null);
  const [result, setResult] = useState<PricingReferenceItemsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    listPricingReferenceItems(id)
      .then((data) => {
        if (!mounted) return;
        setReference(data.reference);
        setResult(data);
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
  }, [id]);

  const columns: DataTableColumn<PricingReferenceItem>[] = [
    {
      key: "code",
      header: "کد کالا",
      render: (row) => row.productCode ? formatFaDigits(row.productCode) : row.sepidarItemId ? formatNumber(row.sepidarItemId) : "-",
    },
    {
      key: "name",
      header: "نام کالا",
      render: (row) => row.productName || "-",
    },
    {
      key: "brand",
      header: "برند",
      render: () => reference?.brandName || "-",
    },
    {
      key: "price",
      header: "قیمت مرجع",
      render: (row) => row.sourcePrice === null ? "-" : formatCurrency(row.sourcePrice),
    },
    {
      key: "grouping",
      header: "گروه مشتری",
      render: (row) => row.customerGroupingRef === null ? "-" : formatNumber(row.customerGroupingRef),
    },
  ];

  return (
    <DashboardLayout role="support" title="جزئیات لیست مرجع">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/support/pricing/reference-price-lists">بازگشت</Link>
        </Button>
      </div>
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? <LoadingState title="در حال دریافت آیتم‌های مرجع" /> : (
        <>
          <SectionHeader
            title={reference?.displayName || "جزئیات لیست مرجع"}
            description="کالاها و قیمت‌های ذخیره‌شده برای این مرجع"
          />
          <Card className="mb-5 grid gap-3 p-5 text-sm text-[#334155] md:grid-cols-5">
            <div>برند: {reference?.brandName || "-"}</div>
            <div>لیست سپیدار: {result?.summary.sepidarSaleTypeId ? formatNumber(result.summary.sepidarSaleTypeId) : "-"}</div>
            <div>عنوان سپیدار: {reference?.saleTypeTitle || "-"}</div>
            <div>تعداد کالا: {formatNumber(result?.summary.priceNoteItemCount || 0)}</div>
            <div>گروه مشتری: {reference?.customerGroupingRef === null ? "-" : formatNumber(reference?.customerGroupingRef || 0)}</div>
          </Card>
          {result?.items.length ? (
            <DataTable columns={columns} rows={result.items} rowKey={(row) => row.objectId || `${row.referenceId}-${row.sepidarItemId}`} />
          ) : (
            <EmptyState title="آیتمی پیدا نشد" description="برای این مرجع کالای ذخیره‌شده‌ای پیدا نشد." />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
