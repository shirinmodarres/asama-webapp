"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { listWarehouseOrders } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function WarehouseOutboundPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listWarehouseOrders();
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

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter((order) => order.orderType === "normal")
      .filter((order) => {
        if (!query) return true;
        return (
          order.code.toLowerCase().includes(query) ||
          (order.customerName ?? "").toLowerCase().includes(query) ||
          (order.receiverFullName ?? "").toLowerCase().includes(query)
        );
      });
  }, [orders, search]);

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
      key: "items",
      header: "تعداد آیتم",
      render: (row) => formatNumber(row.items.length),
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
        const canCreateExitSlip =
          row.orderStatus === "approved" &&
          row.warehouseStatus === "reviewing" &&
          row.fulfillmentStatus !== "onHold";

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
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو بر اساس کد سفارش، مشتری یا گیرنده"
            className="pr-10"
          />
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
