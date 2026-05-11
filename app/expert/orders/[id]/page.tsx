"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { getOrder } from "@/lib/services/order.service";

export default function ExpertOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getOrder(params.id);
        if (isMounted) setOrder(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const detailRows = useMemo(
    () =>
      order?.items.map((item) => ({
        id: item.objectId || item.productId,
        name: item.productName || item.productSku || "کالای نامشخص",
        brand: item.brand || "-",
        productSku: item.productSku || "-",
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })) ?? [],
    [order],
  );

  const totalAmount = detailRows.reduce(
    (sum, row) => sum + row.quantity * row.unitPrice,
    0,
  );

  const columns: DataTableColumn<(typeof detailRows)[number]>[] = [
    { key: "name", header: "نام کالا", render: (row) => <span className="font-medium text-[#1F3A5F]">{row.name}</span> },
    { key: "brand", header: "برند", render: (row) => row.brand },
    { key: "sku", header: "شناسه کالا", render: (row) => row.productSku },
    { key: "unitPrice", header: "قیمت واحد", render: (row) => formatCurrency(row.unitPrice) },
    { key: "quantity", header: "تعداد", render: (row) => formatNumber(row.quantity) },
    { key: "lineTotal", header: "مبلغ", render: (row) => formatCurrency(row.quantity * row.unitPrice) },
  ];

  return (
    <DashboardLayout role="expert" title="جزئیات سفارش">
      {isLoading ? (
        <LoadingState title="در حال دریافت جزئیات سفارش" description="اطلاعات سفارش از سرور دریافت می شود." />
      ) : error ? (
        <PageErrorMessage title="دریافت جزئیات سفارش انجام نشد" message={error} />
      ) : !order ? (
        <EmptyState title="سفارش یافت نشد" description="شناسه سفارش معتبر نیست یا رکوردی برای آن وجود ندارد." />
      ) : (
        <>
          <SectionHeader
            title={`سفارش ${order.code}`}
            description="جزئیات وضعیت سفارش، انبار و اقلام ثبت شده"
            actions={
              <Link href={`/expert/orders/${order.objectId}/edit`} className="btn-primary rounded-xl px-4 py-2 text-sm font-medium text-white visited:text-white hover:text-white focus:text-white">
                ویرایش سفارش
              </Link>
            }
          />

          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-[#1F3A5F]">اطلاعات سفارش</h3>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoItem label="کد سفارش" value={order.code} />
                  <InfoItem label="مشتری" value={order.customerName || "-"} />
                  <InfoItem label="ثبت کننده" value={order.createdByName} />
                  <InfoItem label="تاریخ ثبت" value={formatDate(order.createdAt)} />
                  <InfoItem label="وضعیت سفارش" value={<StatusBadge type="order" status={order.orderStatus} />} />
                  <InfoItem label="وضعیت انبار" value={<StatusBadge type="warehouse" status={order.warehouseStatus} />} />
                </dl>
              </div>

              <CustomerInfoCard order={order} />

              <DataTable columns={columns} rows={detailRows} rowKey={(row) => row.id} />
            </div>

            <OrderSummaryCard
              customerName={order.customerName}
              itemCount={detailRows.length}
              totalQuantity={detailRows.reduce((sum, row) => sum + row.quantity, 0)}
              totalAmount={totalAmount}
              status={order.orderStatus}
              warehouseStatus={order.warehouseStatus}
            />
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#1F3A5F]">{value}</dd>
    </div>
  );
}
