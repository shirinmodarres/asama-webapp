"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PriceList } from "@/lib/models/pricing.model";
import { listActivePriceLists } from "@/lib/services/pricing.service";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ManagerActivePriceListsPage() {
  const [rows, setRows] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    listActivePriceLists()
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

  const brandOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.brandName?.trim())
            .filter((brand): brand is string => Boolean(brand)),
        ),
      ).sort((a, b) => a.localeCompare(b, "fa")),
    [rows],
  );

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => getPriceListTypeLabel(row).trim())
            .filter((type): type is string => Boolean(type)),
        ),
      ).sort((a, b) => a.localeCompare(b, "fa")),
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const rowBrand = row.brandName?.trim() || "";
        const rowType = getPriceListTypeLabel(row);
        const haystack = [
          row.displayName,
          row.name,
          row.internalCode ? formatFaDigits(row.internalCode) : "",
          row.referenceInternalCode ? formatFaDigits(row.referenceInternalCode) : "",
          row.brandName,
          row.typeTitle,
          row.typeCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (brandFilter !== "all" && rowBrand !== brandFilter) return false;
        if (typeFilter !== "all" && rowType !== typeFilter) return false;
        if (search.trim()) {
          const query = search.trim().toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        return true;
      }),
    [brandFilter, rows, search, typeFilter],
  );

  const hasActiveFilters =
    search.trim().length > 0 || brandFilter !== "all" || typeFilter !== "all";

  const columns: DataTableColumn<PriceList>[] = [
    { key: "name", header: "لیست قیمت", render: (row) => row.displayName || row.name || "-" },
    { key: "code", header: "کد داخلی", render: (row) => row.internalCode ? formatFaDigits(row.internalCode) : "-" },
    { key: "reference", header: "کد مرجع", render: (row) => row.referenceInternalCode ? formatFaDigits(row.referenceInternalCode) : "-" },
    { key: "items", header: "تعداد کالا", render: (row) => formatNumber(row.itemCount) },
    { key: "generated", header: "زمان تولید", render: (row) => row.generatedAt ? formatDateTime(row.generatedAt) : "-" },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "neutral"}>
          {row.isActive ? "فعال" : "آرشیو"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        row.objectId || row.id ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/manager/pricing/price-lists/${row.objectId || row.id}`}>
              جزئیات
            </Link>
          </Button>
        ) : "-"
      ),
    },
  ];

  return (
    <DashboardLayout role="manager" title="لیست قیمت‌ها">
      <SectionHeader
        title="لیست قیمت‌های فعال"
        description="تمام لیست‌های قیمت فعال برندها برای بررسی و استفاده در دسترس هستند."
      />
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? (
        <LoadingState title="در حال دریافت لیست‌های قیمت" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-[22px] border border-[#E7EDF4] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:grid-cols-3">
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#334155]">جستجو</span>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو در لیست قیمت، کد یا برند"
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#334155]">برند</span>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه برندها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه برندها</SelectItem>
                  {brandOptions.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#334155]">نوع</span>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه نوع‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه نوع‌ها</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="flex items-center justify-start">
              <Button
                type="button"
                variant="outline"
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 px-4 sm:w-fit"
                onClick={() => {
                  setSearch("");
                  setBrandFilter("all");
                  setTypeFilter("all");
                }}
              >
                <span>حذف فیلترها</span>
              </Button>
            </div>
          ) : null}

          {filteredRows.length ? (
            <DataTable
              columns={columns}
              rows={filteredRows}
              rowKey={(row) => row.objectId}
            />
          ) : (
            <EmptyState
              title="لیست قیمت فعالی پیدا نشد"
              description="با این فیلترها لیست قیمتی برای نمایش وجود ندارد."
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function getPriceListTypeLabel(priceList: PriceList): string {
  return priceList.typeTitle || priceList.typeCode || "-";
}
