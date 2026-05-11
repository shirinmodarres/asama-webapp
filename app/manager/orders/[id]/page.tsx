"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import { ConfirmationModal } from "@/components/manager/confirmation-modal";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order, OrderItem } from "@/lib/models/order.model";
import {
  approveOrder,
  cancelOrder,
  getOrder,
} from "@/lib/services/order.service";

type DecisionType = "approve" | "cancel" | null;

export default function ManagerOrderReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const objectId = decodeURIComponent(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<DecisionType>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setMessage("");

      try {
        const data = await getOrder(objectId);
        if (isMounted) setOrder(data);
      } catch (loadError) {
        if (isMounted) {
          setMessageType("error");
          setMessage(getErrorMessage(loadError));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [objectId]);

  if (isLoading) {
    return (
      <DashboardLayout role="manager" title="بررسی سفارش">
        <LoadingState title="در حال دریافت سفارش" />
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout role="manager" title="بررسی سفارش">
        {message ? <InlineErrorMessage message={message} /> : null}
        <EmptyState title="سفارش یافت نشد" description="شناسه سفارش معتبر نیست." />
      </DashboardLayout>
    );
  }

  const totalAmount = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const canDecide = order.orderStatus === "pending" && order.orderType === "normal";

  const columns: DataTableColumn<OrderItem>[] = [
    {
      key: "name",
      header: "نام کالا",
      render: (row) => (
        <span className="font-medium text-[#1F3A5F]">
          {row.productName || row.productSku || "کالای نامشخص"}
        </span>
      ),
    },
    { key: "brand", header: "برند", render: (row) => row.brand || "-" },
    {
      key: "unitPrice",
      header: "قیمت واحد",
      render: (row) => formatCurrency(row.unitPrice),
    },
    {
      key: "quantity",
      header: "تعداد درخواست",
      render: (row) => formatNumber(row.quantity),
    },
  ];

  const confirmDecision = async () => {
    if (!decision) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const updated =
        decision === "approve"
          ? await approveOrder(order.objectId)
          : await cancelOrder(order.objectId);
      setOrder(updated);
      setMessageType("success");
      setMessage("عملیات با موفقیت انجام شد.");
      setDecision(null);
      setTimeout(() => router.push("/manager/order-tracking"), 700);
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
      setDecision(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="manager" title="بررسی سفارش">
      <SectionHeader
        title={`بررسی ${order.code || order.id}`}
        description="ثبت تصمیم نهایی مدیر فروش برای شروع یا توقف فرآیند انبار"
        actions={
          <Link
            href="/manager/pending-orders"
            className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155] hover:border-[#CBD5E1]"
          >
            بازگشت به لیست
          </Link>
        }
      />

      {message && messageType === "success" ? (
        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">
          {message}
        </div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#1F3A5F]">
              مشخصات سفارش
            </h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoItem label="کد سفارش" value={order.code || "-"} />
              <InfoItem label="منبع سفارش" value={order.orderType === "naja" ? "ناجا" : "عادی"} />
              <InfoItem label="مشتری" value={order.customerName ?? "-"} />
              <InfoItem label="ثبت کننده" value={order.createdByName || "-"} />
              <InfoItem label="تاریخ ثبت" value={formatDate(order.createdAt)} />
              <InfoItem label="وضعیت سفارش" value={<StatusBadge type="order" status={order.orderStatus} />} />
              <InfoItem label="وضعیت انبار" value={<StatusBadge type="warehouse" status={order.warehouseStatus} />} />
              <InfoItem label="آخرین تغییر" value={formatDate(order.updatedAt)} />
            </dl>
          </div>

          <CustomerInfoCard order={order} />

          <DataTable
            columns={columns}
            rows={order.items}
            rowKey={(row) => row.objectId || row.productId || row.productSku}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6B7280]">مبلغ کل</p>
            <p className="mt-2 text-lg font-semibold text-[#102034]">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm leading-7 text-[#6B7280]">
              {canDecide
                ? "این سفارش آماده تصمیم گیری است."
                : "این سفارش در وضعیت فعلی قابل تایید یا لغو نیست."}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                disabled={!canDecide || isSubmitting}
                onClick={() => setDecision("approve")}
              >
                تایید سفارش
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!canDecide || isSubmitting}
                onClick={() => setDecision("cancel")}
              >
                لغو سفارش
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ConfirmationModal
        open={decision !== null}
        title={decision === "approve" ? "تایید سفارش" : "لغو سفارش"}
        message={
          decision === "approve"
            ? "با تایید، سفارش وارد فرآیند انبار می شود."
            : "با لغو، سفارش از فرآیند عملیاتی خارج می شود."
        }
        confirmText={decision === "approve" ? "تایید نهایی" : "لغو نهایی"}
        tone={decision === "approve" ? "success" : "danger"}
        onConfirm={confirmDecision}
        onCancel={() => setDecision(null)}
      />
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#1F3A5F]">{value}</dd>
    </div>
  );
}
