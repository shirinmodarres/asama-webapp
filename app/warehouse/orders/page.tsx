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
import {
  formatDate,
  formatNumber,
} from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { listOrders } from "@/lib/services/order.service";
import { Search, Tags } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function WarehouseOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");

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

  const allBrands = useMemo(() => {
    const values = new Set<string>();

    for (const order of orders) {
      for (const item of order.items) {
        if (item.brand) values.add(item.brand);
      }
    }

    return Array.from(values);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return [...orders]
      .filter(
        (order) =>
          (order.orderType === "normal" &&
            order.orderStatus === "approved" &&
            order.warehouseStatus === "reviewing") ||
          (order.orderType === "naja" &&
            order.orderStatus === "approved" &&
            order.warehouseStatus === "awaitingNajaDetails"),
      )
      .filter((order) => {
        const matchesSearch =
          order.code.toLowerCase().includes(search.toLowerCase()) ||
          order.createdByName.toLowerCase().includes(search.toLowerCase()) ||
          (order.customerName ?? "").toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;
        if (brandFilter === "all") return true;

        return order.items.some(
          (item) => item.brand === brandFilter,
        );
      })
      .sort(
        (a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)),
      );
  }, [brandFilter, orders, search]);

  const columns: DataTableColumn<Order>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">{row.code}</span>
      ),
    },
    { key: "creator", header: "ثبت کننده", render: (row) => row.createdByName },
    {
      key: "source",
      header: "منبع",
      render: (row) => (row.orderType === "naja" ? "ناجا" : "عادی"),
    },
    { key: "customer", header: "مشتری", render: (row) => row.customerName ?? "-" },
    {
      key: "date",
      header: "تاریخ تایید",
      render: (row) => formatDate(row.updatedAt),
    },
    {
      key: "item-count",
      header: "تعداد آیتم",
      render: (row) => formatNumber(row.items.reduce((sum, item) => sum + item.quantity, 0)),
    },
    {
      key: "order-status",
      header: "وضعیت سفارش",
      render: (row) => <StatusBadge type="order" status={row.orderStatus} />,
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
        <div className="flex flex-wrap gap-2">
          <Link
            href={
              row.orderType === "naja"
                ? `/warehouse/orders/${row.objectId}/naja-details`
                : `/warehouse/orders/${row.objectId}/exit-slip`
            }
            className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-3 py-1.5 text-xs !text-white"
          >
            {row.orderType === "naja"
              ? "تکمیل اطلاعات انبار"
              : "ثبت حواله خروج"}
          </Link>
          <Link
            href={`/warehouse/orders/${row.objectId}`}
            className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
          >
            مشاهده جزئیات
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="warehouse" title="سفارش های تاییدشده">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو بر اساس کد سفارش، مشتری یا ثبت کننده"
              className="pr-10"
            />
          </div>
          <div className="relative">
            <Tags className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
            <SearchableSelect
              value={brandFilter}
              onValueChange={setBrandFilter}
              options={[
                { value: "all", label: "همه برندها" },
                ...allBrands.map((brand) => ({ value: brand, label: brand })),
              ]}
              placeholder="فیلتر برند"
              searchPlaceholder="جستجو در برندها"
              emptyMessage="برندی پیدا نشد"
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
          title="سفارش آماده بررسی وجود ندارد"
          description="در حال حاضر سفارشی در وضعیت در بررسی انبار موجود نیست."
        />
      )}
    </DashboardLayout>
  );
}
