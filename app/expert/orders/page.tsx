"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { getOrderStatusLabel } from "@/lib/domain/statuses";
import {
  formatDate,
  formatNumber,
} from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { listOrders } from "@/lib/services/order.service";
import { ListFilter, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function ExpertOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set([
          "pending",
          "needs_review",
          "review_resolved",
          ...orders.map((order) => order.orderStatus).filter(Boolean),
        ]),
      ),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
      )
      .filter((order) => {
        const matchesSearch = order.code
          .toLowerCase()
          .includes(search.toLowerCase()) ||
          (order.customerName ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || order.orderStatus === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [orders, search, statusFilter]);

  const columns: DataTableColumn<Order>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">{row.code}</span>
      ),
    },
    {
      key: "date",
      header: "تاریخ",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "customer",
      header: "مشتری",
      render: (row) => row.customerName ?? "-",
    },
    {
      key: "items",
      header: "تعداد آیتم",
      render: (row) => formatNumber(row.items.reduce((sum, item) => sum + item.quantity, 0)),
    },
    {
      key: "order-status",
      header: "وضعیت سفارش",
      render: (row) => <StatusBadge type="order" status={row.orderStatus} />,
    },
    {
      key: "review",
      header: "مهلت بررسی",
      render: (row) =>
        row.orderStatus === "needs_review"
          ? formatReviewRemaining(row.reviewRemainingMs, row.reviewExpiresAt)
          : "-",
    },
    {
      key: "warehouse-status",
      header: "وضعیت انبار",
      render: (row) => <StatusBadge type="warehouse" status={row.warehouseStatus} />,
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => {
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/expert/orders/${row.objectId}`}
              className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155] hover:border-[#CBD5E1]"
            >
              مشاهده جزئیات
            </Link>
            {isEditableOrderStatus(row.orderStatus) ? (
              <Link
                href={`/expert/orders/${row.objectId}/edit`}
                className="btn-primary rounded-xl px-3 py-1.5 text-sm font-medium text-white visited:text-white hover:text-white focus:text-white"
              >
                ویرایش
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="ویرایش فقط برای سفارش‌های در انتظار تأیید یا نیازمند بررسی امکان‌پذیر است."
                className="cursor-not-allowed rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-sm text-[#64748B]"
              >
                ویرایش
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout role="expert" title="سفارش های من">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در سفارش ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="کد سفارش یا نام مشتری را وارد کنید"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>فیلتر وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: "all", label: "همه وضعیت ها" },
                  ...statusOptions.map((value) => ({ value, label: getOrderStatusLabel(value) })),
                ]}
                placeholder="همه وضعیت ها"
                searchPlaceholder="جستجو در وضعیت ها"
                emptyMessage="وضعیتی پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش ها" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش ها انجام نشد" message={error} />
      ) : filteredOrders.length > 0 ? (
        <DataTable
          columns={columns}
          rows={filteredOrders}
          rowKey={(row) => row.objectId || row.id}
        />
      ) : (
        <EmptyState
          title="سفارشی یافت نشد"
          description="وضعیت یا عبارت جستجو را تغییر دهید."
        />
      )}
    </DashboardLayout>
  );
}

function isEditableOrderStatus(status: string): boolean {
  return status === "pending" || status === "needs_review";
}

function formatReviewRemaining(
  remainingMs: number | null,
  expiresAt: string | null,
): string {
  if (remainingMs !== null) {
    if (remainingMs <= 0) return "مهلت بررسی پایان یافته است.";

    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

    return `${formatNumber(hours)} ساعت و ${formatNumber(minutes)} دقیقه`;
  }

  return expiresAt ? `تا ${formatDate(expiresAt)}` : "-";
}
