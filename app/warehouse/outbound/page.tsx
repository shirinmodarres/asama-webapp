"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListFilter, Lock, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import type { SepidarStock } from "@/lib/models/stock.model";
import { listStocks } from "@/lib/services/stock.service";
import { listWarehouseOrders } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function WarehouseOutboundPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [stockObjectId, setStockObjectId] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");
      try {
        const [orderData, stockData] = await Promise.all([
          listWarehouseOrders(),
          listStocks(),
        ]);
        if (!isMounted) return;
        setOrders(orderData);
        setStocks(stockData);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter(
        (order) =>
          stockObjectId === "all" ||
          !order.stockObjectId ||
          order.stockObjectId === stockObjectId,
      )
      .filter((order) => {
        if (!query) return true;
        return (
          order.code.toLowerCase().includes(query) ||
          (order.customerName ?? "").toLowerCase().includes(query) ||
          (order.receiverFullName ?? "").toLowerCase().includes(query)
        );
      })
      .filter((order) => isWithinDateRange(order.createdAt, dateFrom, dateTo));
  }, [dateFrom, dateTo, orders, search, stockObjectId]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    stockObjectId !== "all" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const stockOptions = useMemo(
    () => [
      { value: "all", label: "همه انبارها" },
      ...stocks.map((stock) => ({
        value: stock.objectId,
        label: stock.title,
      })),
    ],
    [stocks],
  );

  const columns: DataTableColumn<Order>[] = [
    {
      key: "orderCode",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">
          {formatFaDigits(row.code)}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "مشتری",
      render: (row) => row.customerName || "-",
    },
    {
      key: "receiverFullName",
      header: "گیرنده بار",
      render: (row) => row.receiverFullName || row.customerName || "-",
    },
    {
      key: "products",
      header: "کالا",
      cellClassName: "max-w-[320px] whitespace-normal leading-7",
      render: (row) =>
        row.items
          .map((item) =>
            formatFaDigits(item.productName || item.productSku || "-"),
          )
          .join("، "),
    },
    {
      key: "quantity",
      header: "تعداد",
      render: (row) =>
        formatNumber(
          row.items.reduce((sum, item) => sum + item.quantity, 0),
        ),
    },
    {
      key: "warehouse",
      header: "انبار اختصاص‌یافته",
      render: (row) =>
        row.stockTitle || row.warehouseName || "-",
    },
    {
      key: "warehouseStatus",
      header: "وضعیت انبار",
      render: (row) => row.warehouseStatusLabel || row.warehouseStatus,
    },
    {
      key: "fulfillmentStatus",
      header: "ممنوعیت خروج",
      render: (row) =>
        row.fulfillmentStatus === "onHold" ? (
          <div className="space-y-2">
            <Badge variant="warning">
              <Lock className="size-3.5" />
              خروج متوقف شده
            </Badge>
            <p className="text-xs leading-6 text-[#8A5A00]">
              این سفارش فعلاً مجاز به خروج نیست.
            </p>
          </div>
        ) : (
          row.fulfillmentStatusLabel || "مجاز به خروج"
        ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => {
        const warehouseMatches =
          stockObjectId === "all" ||
          !row.stockObjectId ||
          row.stockObjectId === stockObjectId;
        const canCreateExitSlip =
          row.orderStatus === "approved" &&
          row.warehouseStatus === "reviewing" &&
          row.fulfillmentStatus !== "onHold" &&
          warehouseMatches;

        return canCreateExitSlip ? (
          <Button asChild size="sm">
            <Link href={`/warehouse/orders/${row.objectId}/exit-slip`}>
              صدور حواله خروج
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            صدور حواله خروج
          </Button>
        );
      },
    },
  ];

  return (
    <DashboardLayout role="warehouse" title="خروج کالا">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در سفارش‌ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس کد سفارش، مشتری یا گیرنده"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر انبار</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={stockObjectId}
                onValueChange={setStockObjectId}
                options={stockOptions}
                placeholder="همه انبارها"
                searchPlaceholder="جستجو در انبارها"
                emptyMessage="انباری پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
          <DateRangeFilter
            value={{ from: dateFrom, to: dateTo }}
            onChange={(range) => {
              setDateFrom(range.from ?? "");
              setDateTo(range.to ?? "");
            }}
          />
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-fit shrink-0 items-center gap-2"
              onClick={() => {
                setSearch("");
                setStockObjectId("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              <span>حذف فیلترها</span>
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش‌های آماده خروج" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش‌ها انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId || row.id}
        />
      ) : (
        <EmptyState
          title="سفارشی برای خروج کالا وجود ندارد"
          description="پس از تأیید سفارش و آماده شدن در انبار، سفارش‌ها اینجا نمایش داده می‌شوند."
        />
      )}
    </DashboardLayout>
  );
}

function isWithinDateRange(
  value: string,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  if (dateFrom && timestamp < new Date(`${dateFrom}T00:00:00`).getTime())
    return false;
  if (dateTo && timestamp > new Date(`${dateTo}T23:59:59`).getTime())
    return false;
  return true;
}
