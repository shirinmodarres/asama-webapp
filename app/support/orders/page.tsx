"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { DateRangeFilter, type DateRangeValue } from "@/components/shared/date-range-filter";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { OrderFinancialAmounts } from "@/components/shared/order-financial-amounts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { getOrderStatusLabel } from "@/lib/domain/statuses";
import type { Order } from "@/lib/models/order.model";
import { listOrders } from "@/lib/services/order.service";
import { ListFilter, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function SupportOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: null,
    to: null,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const data = await listOrders();
        if (isMounted) setOrders(data);
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

  const filteredOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)),
      )
      .filter(
        (order) =>
          order.code.toLowerCase().includes(search.toLowerCase()) ||
          (order.createdByName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (order.customerName ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
      .filter(
        (order) => statusFilter === "all" || order.orderStatus === statusFilter,
      );
  }, [orders, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange.from, dateRange.to, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(
    () => filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredOrders],
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "همه وضعیت‌ها" },
      ...Array.from(
        new Set(orders.map((order) => order.orderStatus).filter(Boolean)),
      ).map((status) => ({
        value: status,
        label: getOrderStatusLabel(status),
      })),
    ],
    [orders],
  );

  const columns: DataTableColumn<Order>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">
          {formatFaDigits(row.code)}
        </span>
      ),
    },
    { key: "creator", header: "ثبت کننده", render: (row) => row.createdByName },
    {
      key: "customer",
      header: "مشتری",
      render: (row) => row.customerName ?? "-",
    },
    {
      key: "status",
      header: "وضعیت سفارش",
      render: (row) => <StatusBadge type="order" status={row.orderStatus} />,
    },
    {
      key: "warehouse",
      header: "وضعیت انبار",
      render: (row) => (
        <StatusBadge type="warehouse" status={row.warehouseStatus} />
      ),
    },
    {
      key: "amounts",
      header: "مبالغ سفارش",
      render: (row) => <OrderFinancialAmounts order={row} />,
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) =>
        row.canEdit ? (
          <Link
            href={`/support/orders/${row.objectId}/edit`}
            className="rounded-xl border border-[#F59E0B] bg-[#FFFBEB] px-3 py-1.5 text-xs text-[#92400E]"
          >
            ویرایش ویژه
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="بعد از صدور حواله خروج امکان ویرایش سفارش وجود ندارد."
            className="cursor-not-allowed rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#64748B]"
          >
            ویرایش ویژه
          </button>
        ),
    },
  ];

  return (
    <DashboardLayout role="support" title="سفارش‌ها">
      <SectionHeader
        title="فهرست سفارش‌ها"
        description="بررسی، جستجو و ویرایش سفارش‌ها"
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="grid gap-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:items-end">
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>جستجو در سفارش‌ها</span>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="جستجو بر اساس نام مشتری یا ثبت کننده"
                  className="pr-10"
                />
              </div>
            </label>

            <DateRangeFilter
              value={dateRange}
              onChange={(value) =>
                setDateRange({
                  from: value.from ?? null,
                  to: value.to ?? null,
                })
              }
              label="بازه زمانی"
              placeholder="انتخاب بازه زمانی"
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(18rem,22rem)_auto] xl:items-end">
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>فیلتر وضعیت</span>
              <div className="relative">
                <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <SearchableSelect
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={statusOptions}
                  placeholder="همه وضعیت‌ها"
                  searchPlaceholder="جستجو در وضعیت‌ها"
                  emptyMessage="وضعیتی پیدا نشد"
                  triggerClassName="pr-10"
                />
              </div>
            </label>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                className="inline-flex w-fit shrink-0 items-center gap-2"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDateRange({ from: null, to: null });
                }}
              >
                <span>حذف فیلترها</span>
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش ها" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش ها انجام نشد" message={error} />
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={paginatedOrders}
            rowKey={(row) => row.objectId || row.id}
          />
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <EmptyState
          title="سفارشی یافت نشد"
          description="عبارت جستجو را تغییر دهید."
        />
      )}
    </DashboardLayout>
  );
}
