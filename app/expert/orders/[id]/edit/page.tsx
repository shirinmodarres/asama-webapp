"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import {
  OrderForm,
  type OrderFormSubmitPayload,
} from "@/components/orders/order-form";
import { getErrorMessage } from "@/lib/api/api-error";
import type { OrderEditData } from "@/lib/models/order.model";
import {
  getOrderEditData,
  updatePendingOrder,
} from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function EditExpertOrderPage() {
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
      const updatedOrder = await updatePendingOrder(
        editData.order.objectId,
        payload,
      );
      router.push(`/expert/orders/${updatedOrder.objectId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="expert" title="ویرایش سفارش">
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
      ) : !canExpertEdit(editData) ? (
        <div className="space-y-4">
          <EmptyState
            title="این سفارش دیگر قابل ویرایش نیست."
            description={
              editData.editBlockedReason ||
              "بعد از تأیید مدیر امکان ویرایش سفارش برای کارشناس وجود ندارد."
            }
          />
          <div className="flex justify-center">
            <Link
              href={`/expert/orders/${editData.order.objectId}`}
              className="rounded-xl bg-[#1F3A5F] px-4 py-2 text-sm font-semibold text-white"
            >
              بازگشت به جزئیات سفارش
            </Link>
          </div>
        </div>
      ) : (
        <>
          <SectionHeader
            title={`ویرایش ${formatFaDigits(editData.order.code)}`}
            description="فیلدهای این فرم با ثبت سفارش جدید یکسان است."
            actions={
              <Link
                href={`/expert/orders/${editData.order.objectId}`}
                className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155] hover:border-[#CBD5E1]"
              >
                بازگشت به جزئیات
              </Link>
            }
          />

          <OrderForm
            mode="edit"
            initialOrder={editData.order}
            submitLabel="ذخیره تغییرات"
            isSubmitting={isSubmitting}
            assignedCustomersOnly
            sepidarProductsOnly
            initialProducts={editData.products}
            initialCustomers={editData.customers}
            lockCustomer
            onSubmit={handleSubmit}
          />
        </>
      )}
    </DashboardLayout>
  );
}

function canExpertEdit(editData: OrderEditData): boolean {
  return (
    editData.canEdit &&
    ["pending_approval", "pending", "review_resolved"].includes(
      editData.order.orderStatus,
    )
  );
}
