"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PriceList, PriceListItem } from "@/lib/models/pricing.model";
import type { PriceListItemsPagination } from "@/lib/models/pricing.model";
import {
  getGeneratedPriceList,
  listGeneratedPriceListItems,
} from "@/lib/services/pricing.service";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";
import type { RoleKey } from "@/lib/types";
import { downloadExcelFile } from "@/lib/utils/excel-export";

export default function GeneratedPriceListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <GeneratedPriceListDetailView
      id={id}
      role="support"
      backHref="/support/pricing/generated-price-lists"
    />
  );
}

export function GeneratedPriceListDetailView({
  id,
  role,
  backHref,
}: {
  id: string;
  role: RoleKey;
  backHref: string;
}) {
  const [priceList, setPriceList] = useState<PriceList | null>(null);
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [pagination, setPagination] = useState<PriceListItemsPagination>({
    total: 0,
    limit: 50,
    skip: 0,
    page: 1,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    Promise.resolve()
      .then(() => {
        if (mounted) setIsLoading(true);
        return Promise.all([
          getGeneratedPriceList(id),
          listGeneratedPriceListItems(id, { limit: 50, skip: (page - 1) * 50 }),
        ]);
      })
      .then(([list, itemPage]) => {
        if (!mounted) return;
        setPriceList(list);
        setItems(itemPage.items);
        setPagination(itemPage.pagination);
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
  }, [id, page]);

  const columns: DataTableColumn<PriceListItem>[] = [
    { key: "code", header: "کد کالا", render: (row) => row.productCode ? formatFaDigits(row.productCode) : "-" },
    { key: "name", header: "نام کالا", render: (row) => row.productName || "-" },
    { key: "brand", header: "برند", render: (row) => row.brandName || "-" },
    { key: "source", header: "قیمت مرجع", render: (row) => row.sourcePrice === null ? "-" : formatCurrency(row.sourcePrice) },
    { key: "final", header: "قیمت نهایی", render: (row) => row.finalPrice === null ? "-" : formatCurrency(row.finalPrice) },
  ];

  const exportCurrentList = async () => {
    if (!priceList || !items.length || isExporting) return;
    setIsExporting(true);
    try {
      const allItems: PriceListItem[] = [];
      const pageSize = 100;
      let skip = 0;
      let hasNext = true;
      while (hasNext) {
        const result = await listGeneratedPriceListItems(id, { limit: pageSize, skip });
        allItems.push(...result.items);
        hasNext = result.pagination.hasNext;
        skip += pageSize;
        if (!result.items.length) break;
      }
    if (!priceList || !items.length) return;
    const headers = [
      "کد کالا",
      "نام کالا",
      "برند",
      "قیمت مرجع",
      "قیمت نهایی",
      "نوع لیست",
      "کد داخلی",
      "کد مرجع",
    ];
    const rows = allItems.map((item) => [
      item.productCode || "",
      item.productName || "",
      item.brandName || priceList.brandName || "",
      item.sourcePrice ?? "",
      item.finalPrice ?? "",
      priceList.typeTitle || priceList.typeCode || "",
      priceList.internalCode || "",
      priceList.referenceInternalCode || "",
    ]);
    downloadExcelFile(`${priceList.internalCode || priceList.objectId || "price-list"}.xls`, [
      { name: "لیست قیمت", rows: [headers, ...rows] },
    ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout role={role} title="جزئیات لیست قیمت">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href={backHref}>بازگشت</Link>
        </Button>
        <Button
          type="button"
          onClick={exportCurrentList}
          disabled={!priceList || !items.length || isExporting}
        >
          <Download className="size-4" />
          {isExporting ? "در حال آماده‌سازی..." : "خروجی اکسل"}
        </Button>
      </div>
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? <LoadingState title="در حال دریافت آیتم‌های قیمت" /> : (
        <>
          <SectionHeader title={priceList?.displayName || priceList?.name || "جزئیات لیست قیمت"} description={priceList?.formulaDescription || "آیتم‌های قیمت تولیدی"} />
          <Card className="mb-5 grid gap-3 p-5 text-sm text-[#334155] md:grid-cols-5">
            <div>برند: {priceList?.brandName || "-"}</div>
            <div>نوع: {priceList?.typeTitle || priceList?.typeCode || "-"}</div>
            <div>کد لیست قیمت: {priceList?.internalCode ? formatFaDigits(priceList.internalCode) : "-"}</div>
            <div>کد سپیدار: {priceList?.referenceInternalCode ? formatFaDigits(priceList.referenceInternalCode) : "-"}</div>
            <div className="flex items-center gap-2">
              وضعیت:
              <Badge variant={priceList?.isActive ? "success" : "neutral"}>
                {priceList ? getPriceListStatusLabel(priceList) : "-"}
              </Badge>
            </div>
          </Card>
          {items.length ? (
            <>
              <DataTable columns={columns} rows={items} rowKey={(row) => row.objectId} />
              {pagination.totalPages > 1 ? (
                <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3">
                  <span className="text-sm text-[#64748B]">
                    صفحه {formatNumber(pagination.page)} از {formatNumber(pagination.totalPages)}، مجموع {formatNumber(pagination.total)} آیتم
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={!pagination.hasPrevious || isLoading}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      aria-label="صفحه قبلی"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={!pagination.hasNext || isLoading}
                      onClick={() => setPage((current) => current + 1)}
                      aria-label="صفحه بعدی"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                  </div>
                </Card>
              ) : null}
            </>
          ) : (
            <EmptyState title="آیتمی در این لیست نیست" description="لیست انتخاب‌شده بدون آیتم تولید شده یا آیتم‌های مرجع کالا ندارند." />
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function getPriceListStatusLabel(priceList: PriceList): string {
  const status = (priceList as PriceList & { status?: string | null }).status;
  if (priceList.isActive) return "فعال";
  if (status === "inactive" || status === "disabled") return "غیرفعال";
  return "آرشیو";
}
