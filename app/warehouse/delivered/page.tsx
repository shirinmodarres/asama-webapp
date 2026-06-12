"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { getOrderStatusLabel } from "@/lib/domain/statuses";
import { formatDate } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { listOrders } from "@/lib/services/order.service";
import { listExitSlips } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";
import { ListFilter, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface DeliveredRow {
  order: Order;
  slip?: ExitSlip;
  slipNumber: string;
  deliveredAt: string;
}

export default function WarehouseDeliveredPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [exitSlips, setExitSlips] = useState<ExitSlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDelivered() {
      setIsLoading(true);
      setError("");

      try {
        const [orderData, slipData] = await Promise.all([
          listOrders(),
          listExitSlips(),
        ]);
        if (isMounted) {
          setOrders(orderData);
          setExitSlips(slipData);
        }
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDelivered();

    return () => {
      isMounted = false;
    };
  }, []);

  const deliveredRows = useMemo(() => {
    return orders
      .filter((order) => order.warehouseStatus === "delivered")
      .map((order) => {
        const slip = exitSlips.find(
          (entry) => entry.orderId === order.objectId,
        );
        return {
          order,
          slip,
          slipNumber: slip?.slipCode ?? "-",
          deliveredAt: slip?.deliveryConfirmedAt ?? order.updatedAt,
        } as DeliveredRow;
      })
      .sort(
        (a, b) =>
          Number(new Date(b.deliveredAt)) - Number(new Date(a.deliveredAt)),
      );
  }, [exitSlips, orders]);

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(deliveredRows.map((row) => row.order.orderStatus).filter(Boolean)),
      ),
    [deliveredRows],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return deliveredRows
      .filter((row) => {
        if (!query) return true;
        return (
          row.order.code.toLowerCase().includes(query) ||
          row.slipNumber.toLowerCase().includes(query) ||
          (row.order.customerName ?? "").toLowerCase().includes(query) ||
          (row.order.receiverFullName ?? "").toLowerCase().includes(query) ||
          (row.slip?.customerName ?? "").toLowerCase().includes(query) ||
          (row.slip?.receiverFullName ?? "").toLowerCase().includes(query)
        );
      })
      .filter(
        (row) =>
          statusFilter === "all" || row.order.orderStatus === statusFilter,
      )
      .filter((row) => isWithinDateRange(row.deliveredAt, dateFrom, dateTo));
  }, [dateFrom, dateTo, deliveredRows, search, statusFilter]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "all" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const columns: DataTableColumn<DeliveredRow>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">
          {formatFaDigits(row.order.code)}
        </span>
      ),
    },
    {
      key: "slip",
      header: "شماره حواله",
      render: (row) => formatFaDigits(row.slipNumber),
    },
    {
      key: "delivery-date",
      header: "تاریخ تحویل",
      render: (row) => formatDate(row.deliveredAt),
    },
    {
      key: "order-status",
      header: "وضعیت سفارش",
      render: (row) => (
        <StatusBadge type="order" status={row.order.orderStatus} />
      ),
    },
    {
      key: "warehouse-status",
      header: "وضعیت انبار",
      render: (row) => (
        <StatusBadge type="warehouse" status={row.order.warehouseStatus} />
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => {
        const slip = row.slip;
        if (!slip)
          return (
            <span className="text-xs text-[#94A3B8]">
              جزئیات حواله موجود نیست
            </span>
          );

        return (
          <Link
            href={`/warehouse/exit-slips/${slip.objectId || slip.id}`}
            className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
          >
            مشاهده جزئیات
          </Link>
        );
      },
    },
  ];

  return (
    <DashboardLayout role="warehouse" title="تحویل‌شده‌ها">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در سفارش‌های تحویل‌شده</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس کد سفارش، شماره حواله، مشتری یا گیرنده"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: "all", label: "همه وضعیت‌ها" },
                  ...statusOptions.map((value) => ({
                    value,
                    label: getOrderStatusLabel(value),
                  })),
                ]}
                placeholder="همه وضعیت‌ها"
                searchPlaceholder="جستجو در وضعیت‌ها"
                emptyMessage="وضعیتی پیدا نشد"
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
                setStatusFilter("all");
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
        <LoadingState title="در حال دریافت سفارش های تحویل شده" />
      ) : error ? (
        <PageErrorMessage
          title="دریافت سفارش های تحویل شده انجام نشد"
          message={error}
        />
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.order.objectId || row.order.id}
        />
      ) : (
        <EmptyState
          title="تحویلی ثبت نشده"
          description="هنوز هیچ سفارش تحویل شده ای ثبت نشده است."
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
  if (dateFrom && timestamp < new Date(`${dateFrom}T00:00:00`).getTime()) {
    return false;
  }
  if (dateTo && timestamp > new Date(`${dateTo}T23:59:59`).getTime()) {
    return false;
  }
  return true;
}
