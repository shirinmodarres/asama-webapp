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

export default function ManagerPendingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

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
        (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
      )
      .filter((order) => {
        const matchesSearch =
          order.code.toLowerCase().includes(search.toLowerCase()) ||
          order.createdByName.toLowerCase().includes(search.toLowerCase()) ||
          (order.customerName ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ? true : order.orderStatus === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [orders, search, statusFilter]);

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

  const columns: DataTableColumn<Order>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">{row.code}</span>
      ),
    },
    { key: "creator", header: "ثبت کننده", render: (row) => row.createdByName },
    { key: "customer", header: "مشتری", render: (row) => row.customerName ?? "-" },
    {
      key: "date",
      header: "تاریخ",
      render: (row) => formatDate(row.createdAt),
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
      header: "بررسی",
      render: (row) =>
        row.orderStatus === "needs_review"
          ? row.reviewReasonLabel || "نیازمند بررسی"
          : row.orderStatus === "review_resolved"
            ? "مشکل برطرف شد"
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
      render: (row) => (
        <Link
          href={`/manager/orders/${row.objectId}`}
          className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-3 py-1.5 text-xs !text-white"
        >
          بررسی سفارش
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="manager" title="سفارش های در انتظار تایید">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو بر اساس کد سفارش، مشتری یا نام ثبت کننده"
              className="pr-10"
            />
          </div>
          <div className="relative">
            <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
            <SearchableSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: "pending", label: "در انتظار تایید" },
                { value: "needs_review", label: "نیازمند بررسی" },
                { value: "review_resolved", label: "مشکل برطرف شد" },
                { value: "all", label: "همه وضعیت ها" },
                ...statusOptions
                  .filter(
                    (value) =>
                      !["pending", "needs_review", "review_resolved"].includes(
                        value,
                      ),
                  )
                  .map((value) => ({ value, label: getOrderStatusLabel(value) })),
              ]}
              placeholder="فیلتر وضعیت"
              searchPlaceholder="جستجو در وضعیت ها"
              emptyMessage="وضعیتی پیدا نشد"
              triggerClassName="pr-10"
            />
          </div>
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
          title="سفارش در انتظار تایید یافت نشد"
          description="فیلترها را تغییر دهید یا وارد روند سفارش ها شوید."
        />
      )}
    </DashboardLayout>
  );
}
