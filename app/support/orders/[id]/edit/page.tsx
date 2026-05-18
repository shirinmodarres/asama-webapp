"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  OrderForm,
  type OrderFormSubmitPayload,
} from "@/components/orders/order-form";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Order } from "@/lib/models/order.model";
import { getOrder, updatePendingOrder } from "@/lib/services/order.service";

export default function SupportOrderEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setError("");
      try {
        const orderData = await getOrder(params.id);
        if (isMounted) setOrder(orderData);
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

  const handleSubmit = async (payload: OrderFormSubmitPayload) => {
    if (!order) return;

    setIsSubmitting(true);
    try {
      await updatePendingOrder(order.objectId, payload);
      router.push("/support/orders");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ویرایش ویژه سفارش">
      {isLoading ? (
        <LoadingState
          title="در حال دریافت سفارش"
          description="اطلاعات سفارش از سرور دریافت می شود."
        />
      ) : error && !order ? (
        <PageErrorMessage title="دریافت سفارش انجام نشد" message={error} />
      ) : !order ? (
        <EmptyState
          title="سفارش یافت نشد"
          description="شناسه سفارش معتبر نیست یا رکوردی برای آن وجود ندارد."
        />
      ) : !isEditableOrderStatus(order.orderStatus) ? (
        <div className="space-y-4">
          <EmptyState
            title="این سفارش دیگر قابل ویرایش نیست."
            description="برای مشاهده فهرست سفارش‌ها به صفحه قبل برگردید."
          />
          <div className="flex justify-center">
            <Link
              href="/support/orders"
              className="rounded-xl bg-[#1F3A5F] px-4 py-2 text-sm font-semibold text-white"
            >
              بازگشت به سفارش‌ها
            </Link>
          </div>
        </div>
      ) : (
        <>
          <SectionHeader
            title={`ویرایش ${order.code}`}
            description="فیلدهای این فرم با ثبت سفارش جدید یکسان است."
            actions={
              <Link
                href="/support/orders"
                className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155] hover:border-[#CBD5E1]"
              >
                بازگشت به سفارش‌ها
              </Link>
            }
          />

          <OrderForm
            mode="edit"
            initialOrder={order}
            submitLabel="ذخیره تغییرات"
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </DashboardLayout>
  );
}

function isEditableOrderStatus(status: string): boolean {
  return status === "pending" || status === "needs_review";
}
