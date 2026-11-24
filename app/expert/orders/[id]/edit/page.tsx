"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { OrderEditForm, type OrderEditFormSubmitPayload } from "@/components/orders/order-edit-form";
import { getErrorMessage } from "@/lib/api/api-error";
import { getFinancialApprovalStatusLabel } from "@/lib/domain/statuses";
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
      console.info("[ORDER_EDIT_LOADING]", {
        orderId: params.id,
      });
      try {
        const orderData = await getOrderEditData(params.id);
        if (isMounted) {
          setEditData(orderData);
          console.info("[ORDER_EDIT_INITIAL_VALUES]", {
            orderId: params.id,
            customerObjectId: orderData.order.customerObjectId,
            salesTypeObjectId: orderData.order.salesTypeObjectId || orderData.order.saleTypeObjectId || null,
            priceListId: orderData.order.priceListId || null,
            itemCount: orderData.order.items.length,
          });
        }
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

  const handleSubmit = async (payload: OrderEditFormSubmitPayload) => {
    if (!editData?.order) return;

    setIsSubmitting(true);
    try {
      console.info("[ORDER_EDIT_UPDATE_PAYLOAD]", {
        orderId: editData.order.objectId,
        payload,
      });
      const updatedOrder = await updatePendingOrder(
        editData.order.objectId,
        payload,
      );
      console.info("[ORDER_EDIT_SAVE_RESULT]", {
        orderId: updatedOrder.objectId,
        customerObjectId: updatedOrder.customerObjectId,
        salesTypeObjectId: updatedOrder.salesTypeObjectId || null,
        priceListId: updatedOrder.priceListId || null,
      });
      router.push(`/expert/orders/${updatedOrder.objectId}`);
    } catch (submitError) {
      console.error("[ORDER_EDIT_SAVE_FAILED]", {
        orderId: editData.order.objectId,
        error: submitError,
      });
      throw submitError;
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

          {editData.order.financialApprovalStatus === "needs_correction" ? (
            <div className="rounded-xl border border-[#F8D9A0] bg-[#FFF8E7] p-4 text-sm text-[#8A5A17] shadow-sm">
              <p className="font-semibold">
                این سفارش برای اصلاح برگشت خورده است.
              </p>
              <p className="mt-2 leading-7">
                وضعیت فعلی: {getFinancialApprovalStatusLabel(editData.order.financialApprovalStatus)}
                . بعد از اصلاح و ذخیره، برای ادامه فرایند از «ارسال مجدد برای بررسی» استفاده کنید.
              </p>
            </div>
          ) : null}

          <OrderEditForm
            order={editData.order}
            submitLabel="ذخیره تغییرات"
            isSubmitting={isSubmitting}
            roleScope="expert"
            initialProducts={editData.products}
            initialCustomers={editData.customers}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </DashboardLayout>
  );
}

function canExpertEdit(editData: OrderEditData): boolean {
  return editData.canEdit;
}
