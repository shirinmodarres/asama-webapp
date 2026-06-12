"use client";

import { useParams } from "next/navigation";
import { formatFaDigits } from "@/lib/utils/number-format";
import { useEffect, useState } from "react";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Order } from "@/lib/models/order.model";
import { getOrder } from "@/lib/services/order.service";

export default function FinanceReconciliationPage() {
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

  return (
    <DashboardLayout role="finance" title="تطبیق سفارش">
      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش انجام نشد" message={error} />
      ) : !order ? (
        <EmptyState title="سفارش یافت نشد" description="شناسه سفارش معتبر نیست." />
      ) : (
        <>
          <SectionHeader
            title={`تطبیق ${formatFaDigits(order.code || order.id)}`}
            description="اطلاعات مشتری و آدرس تحویل برای صدور فاکتور"
          />
          <CustomerInfoCard order={order} />
          <EmptyState title="جزئیات تطبیق در انتظار endpoint نهایی است" description="اطلاعات مشتری از سفارش backend نمایش داده می شود." />
        </>
      )}
    </DashboardLayout>
  );
}
