"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type {
  ProductStockInventory,
  SepidarStockInventory,
} from "@/lib/models/stock.model";
import { getSepidarStockInventory } from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const PAGE_SIZE = 12;

export default function SupportWarehouseDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<SepidarStockInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const result = await getSepidarStockInventory(params.id);
        if (isMounted) setData(result);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.products ?? []).filter(
      (row) =>
        !query ||
        row.productName.toLowerCase().includes(query) ||
        row.productSku.toLowerCase().includes(query),
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const columns: DataTableColumn<ProductStockInventory>[] = [
    {
      key: "code",
      header: "کد کالا",
      render: (row) => formatFaDigits(row.productSku || "-"),
    },
    {
      key: "name",
      header: "نام کالا",
      render: (row) => row.productName || "-",
    },
    {
      key: "real",
      header: "موجودی واقعی",
      render: (row) => formatNumber(row.realQuantity),
    },
    {
      key: "sales",
      header: "موجودی فروش",
      render: (row) => formatNumber(row.salesQuantity),
    },
    {
      key: "reserved",
      header: "رزرو شده",
      render: (row) => formatNumber(row.reservedQuantity),
    },
  ];

  return (
    <DashboardLayout role="support" title="انبارها">
      {isLoading ? (
        <LoadingState title="در حال دریافت موجودی انبار" />
      ) : error || !data ? (
        <PageErrorMessage
          title="دریافت موجودی انبار انجام نشد"
          message={error || "انبار پیدا نشد."}
        />
      ) : (
        <>
          <SectionHeader
            title={data.stock.title || "انبار سپیدار"}
            description={`کد انبار: ${data.stock.code ? formatFaDigits(data.stock.code) : "-"}`}
            actions={
              <Button asChild variant="outline">
                <Link href="/support/stock-transfers">
                  <ArrowLeftRight className="size-4" />
                  مشاهده انتقال‌ها
                </Link>
              </Button>
            }
          />

          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem label="نام انبار" value={data.stock.title || "-"} />
              <InfoItem
                label="کد انبار"
                value={
                  data.stock.code ? formatFaDigits(data.stock.code) : "-"
                }
              />
              <InfoItem
                label="وضعیت"
                value={
                  <Badge
                    variant={data.stock.isActive ? "success" : "neutral"}
                    dot
                  >
                    {data.stock.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                }
              />
              <InfoItem
                label="آخرین همگام‌سازی"
                value={
                  data.stock.lastSepidarSyncAt
                    ? formatDateTime(data.stock.lastSepidarSyncAt)
                    : "-"
                }
              />
            </div>
          </Card>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>جستجو در کالاها</span>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="جستجو بر اساس کد یا نام کالا"
                  className="pr-10"
                />
              </div>
            </label>
          </section>

          {rows.length ? (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(row) => row.objectId}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#6B7280]">
                  صفحه {formatNumber(currentPage)} از {formatNumber(totalPages)}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label="صفحه قبلی"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label="صفحه بعدی"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="کالایی در این انبار یافت نشد"
              description="موجودی کالاهای این انبار پس از ثبت یا انتقال نمایش داده می‌شود."
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280]">{label}</p>
      <div className="mt-2 text-sm font-semibold text-[#102034]">{value}</div>
    </div>
  );
}
