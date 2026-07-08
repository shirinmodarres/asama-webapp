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
import { formatFaDigits } from "@/lib/utils/number-format";
import type { OrderEditData } from "@/lib/models/order.model";
import {
  getOrderEditData,
  updatePendingOrder,
} from "@/lib/services/order.service";

export default function SupportOrderEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [editData, setEditData] = useState<OrderEditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setError("");
      try {
        const orderData = await getOrderEditData(params.id);
        if (isMounted) setEditData(orderData);
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
    if (!editData?.order) return;

    setIsSubmitting(true);
    try {
      await updatePendingOrder(editData.order.objectId, payload);
      router.push("/support/orders");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ویرایش سفارش">
      {isLoading ? (
        <LoadingState
          title="در حال دریافت سفارش"
          description="اطلاعات سفارش از سرور دریافت می شود."
        />
      ) : error && !editData?.order ? (
        <PageErrorMessage title="دریافت سفارش انجام نشد" message={error} />
      ) : !editData?.order ? (
        <EmptyState
          title="سفارش یافت نشد"
          description="شناسه سفارش معتبر نیست یا رکوردی برای آن وجود ندارد."
        />
      ) : !canSupportEdit(editData) ? (
        <div className="space-y-4">
          <EmptyState
            title="این سفارش دیگر قابل ویرایش نیست."
            description={
              editData.editBlockedReason ||
              "بعد از صدور حواله خروج امکان ویرایش سفارش وجود ندارد."
            }
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
            title="ویرایش اطلاعات سفارش"
            description={`اصلاح سفارش ${formatFaDigits(editData.order.code)} با همان فیلدهای ثبت سفارش`}
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
            initialOrder={editData.order}
            submitLabel="ذخیره تغییرات"
            isSubmitting={isSubmitting}
            sepidarProductsOnly
            initialProducts={editData.products}
            initialCustomers={editData.customers}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </DashboardLayout>
  );
}

function canSupportEdit(editData: OrderEditData): boolean {
  return editData.canEdit;
}
