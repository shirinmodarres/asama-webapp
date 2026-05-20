"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { StatusBadge } from "@/components/shared/status-badge";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDate } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { listOrders } from "@/lib/services/order.service";
import { listExitSlips } from "@/lib/services/warehouse.service";
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

  const rows = useMemo(() => {
    return orders
      .filter((order) => order.warehouseStatus === "delivered")
      .map((order) => {
        const slip = exitSlips.find((entry) => entry.orderId === order.objectId);
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

  const columns: DataTableColumn<DeliveredRow>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">{row.order.code}</span>
      ),
    },
    { key: "slip", header: "شماره حواله", render: (row) => row.slipNumber },
    {
      key: "delivery-date",
      header: "تاریخ تحویل",
      render: (row) => formatDate(row.deliveredAt),
    },
    {
      key: "order-status",
      header: "وضعیت سفارش",
      render: (row) => <StatusBadge type="order" status={row.order.orderStatus} />,
    },
    {
      key: "warehouse-status",
      header: "وضعیت انبار",
      render: (row) => <StatusBadge type="warehouse" status={row.order.warehouseStatus} />,
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
      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش های تحویل شده" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش های تحویل شده انجام نشد" message={error} />
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
