"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { getOrder } from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function WarehouseOrderDetailsPage() {
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

  const columns = useMemo<DataTableColumn<Order["items"][number]>[]>(
    () => [
      {
        key: "name",
        header: "نام کالا",
        render: (row) =>
          row.productName
            ? formatFaDigits(row.productName)
            : formatFaDigits(row.productSku || "-"),
      },
      {
        key: "brand",
        header: "برند",
        render: (row) => row.brandName || row.brand || "-",
      },
      { key: "quantity", header: "تعداد", render: (row) => formatNumber(row.quantity) },
      { key: "tracking", header: "کد رهگیری", render: (row) => row.trackingCode ? formatFaDigits(row.trackingCode) : "-" },
    ],
    [],
  );

  return (
    <DashboardLayout role="warehouse" title="جزئیات سفارش">
      {isLoading ? (
        <LoadingState title="در حال دریافت جزئیات سفارش" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش انجام نشد" message={error} />
      ) : !order ? (
        <EmptyState title="سفارش یافت نشد" description="شناسه سفارش معتبر نیست." />
      ) : (
        <>
          <SectionHeader
            title={`سفارش ${formatFaDigits(order.code || order.id)}`}
            description="جزئیات سفارش برای عملیات انبار"
          />
          <CustomerInfoCard order={order} />
          <DataTable columns={columns} rows={order.items} rowKey={(row) => row.objectId || row.productId} />
        </>
      )}
    </DashboardLayout>
  );
}
