"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import type { SepidarPriceList } from "@/lib/models/pricing.model";
import { listSepidarPricingLists } from "@/lib/services/pricing.service";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function SepidarPriceListsPage() {
  const [rows, setRows] = useState<SepidarPriceList[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    listSepidarPricingLists()
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.brandName, row.title, row.code, row.sepidarSaleTypeId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [rows, search]);

  const columns: DataTableColumn<SepidarPriceList>[] = [
    { key: "brand", header: "برند", render: (row) => row.brandName || "-" },
    { key: "title", header: "عنوان", render: (row) => row.title || "-" },
    { key: "code", header: "کد لیست", render: (row) => row.code ? formatFaDigits(row.code) : "-" },
    { key: "saleType", header: "شناسه سپیدار", render: (row) => row.sepidarSaleTypeId ? formatNumber(row.sepidarSaleTypeId) : "-" },
    { key: "items", header: "تعداد کالا", render: (row) => formatNumber(row.itemCount) },
    { key: "synced", header: "آخرین همگام‌سازی", render: (row) => row.lastSyncedAt ? formatDateTime(row.lastSyncedAt) : "-" },
    { key: "status", header: "وضعیت", render: (row) => row.status === "active" ? "فعال" : "غیرفعال" },
  ];

  return (
    <DashboardLayout role="support" title="لیست‌های قیمت سپیدار">
      <SectionHeader title="لیست‌های قیمت سپیدار" description="نمای خواندنی از لیست‌ها و آیتم‌های قیمت همگام‌شده" />
      <div className="mb-4 max-w-md">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو برند، عنوان یا کد" />
      </div>
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? <LoadingState title="در حال دریافت لیست‌های سپیدار" /> : filtered.length ? (
        <DataTable columns={columns} rows={filtered} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState title="لیست قیمتی پیدا نشد" description="همگام‌سازی لیست‌ها و آیتم‌های قیمت را در تنظیمات سپیدار بررسی کنید." />
      )}
    </DashboardLayout>
  );
}
