"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, Unlock } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order, OrderItem } from "@/lib/models/order.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  approveOrder,
  cancelOrder,
  getOrder,
  lockShipment,
  unlockShipment,
} from "@/lib/services/order.service";

type DecisionType = "approve" | "cancel" | null;
type ShipmentAction = "lock" | "unlock" | null;

export default function ManagerOrderReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const objectId = decodeURIComponent(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<DecisionType>(null);
  const [shipmentAction, setShipmentAction] = useState<ShipmentAction>(null);
  const [shipmentStopReason, setShipmentStopReason] = useState("");
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
  const shipmentActionBlockedStatuses = ["cancelled", "invoiced"];
  const shipmentActionBlockedWarehouseStatuses = ["dispatchIssued", "delivered"];
  const canManageShipmentStop =
    order.orderType === "normal" &&
    order.orderStatus === "approved" &&
    !shipmentActionBlockedStatuses.includes(order.orderStatus) &&
    !shipmentActionBlockedWarehouseStatuses.includes(order.warehouseStatus);
  const isShipmentStopped = order.fulfillmentStatus === "onHold";

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

  const confirmShipmentAction = async () => {
    if (!shipmentAction) return;

    const currentUserName = getStoredCurrentUser()?.fullName ?? "";

    if (shipmentAction === "lock" && !shipmentStopReason.trim()) {
      setMessageType("error");
      setMessage("دلیل توقف خروج را وارد کنید.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const updated =
        shipmentAction === "lock"
          ? await lockShipment(order.objectId, {
              reason: shipmentStopReason.trim(),
              heldByName: currentUserName,
            })
          : await unlockShipment(order.objectId, {
              releasedByName: currentUserName,
            });
      setOrder(updated);
      setMessageType("success");
      setMessage(
        shipmentAction === "lock"
          ? "توقف خروج سفارش ثبت شد."
          : "توقف خروج سفارش رفع شد.",
      );
      setShipmentAction(null);
      setShipmentStopReason("");
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
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
              <InfoItem
                label="ممنوعیت خروج از انبار"
                value={
                  order.fulfillmentStatus === "onHold" ? (
                    <Badge variant="warning">
                      <Lock className="size-3.5" />
                      متوقف شده
                    </Badge>
                  ) : (
                    order.fulfillmentStatusLabel
                  )
                }
              />
              <InfoItem label="آخرین تغییر" value={formatDate(order.updatedAt)} />
            </dl>
          </div>

          {isShipmentStopped ? (
            <div className="rounded-xl border border-[#F1D7AA] bg-[#FFF8EB] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#9A6C18]">
                <Lock className="size-4" />
                <h3 className="text-base font-semibold">دلیل توقف خروج</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#5F4320]">
                {order.holdReason || "دلیلی ثبت نشده است."}
              </p>
              {order.heldByName || order.heldAt ? (
                <p className="mt-3 text-xs leading-6 text-[#8A6A3A]">
                  {order.heldByName ? `ثبت کننده: ${order.heldByName}` : ""}
                  {order.heldByName && order.heldAt ? " • " : ""}
                  {order.heldAt ? `زمان ثبت: ${formatDate(order.heldAt)}` : ""}
                </p>
              ) : null}
            </div>
          ) : null}

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

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1F3A5F]">
                  ممنوعیت خروج از انبار
                </p>
                <p className="mt-2 text-sm leading-7 text-[#6B7280]">
                  {isShipmentStopped
                    ? "این سفارش فعلاً مجاز به خروج نیست."
                    : "برای سفارش‌های تایید شده می‌توانید خروج از انبار را متوقف کنید."}
                </p>
              </div>
              {isShipmentStopped ? (
                <Badge variant="warning">
                  <Lock className="size-3.5" />
                  متوقف شده
                </Badge>
              ) : null}
            </div>

            <div className="mt-4">
              {isShipmentStopped ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canManageShipmentStop || isSubmitting}
                  onClick={() => setShipmentAction("unlock")}
                  title="با رفع توقف، سفارش دوباره برای خروج از انبار مجاز می‌شود."
                >
                  <Unlock className="size-4" />
                  رفع توقف خروج
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canManageShipmentStop || isSubmitting}
                  onClick={() => setShipmentAction("lock")}
                  title="با فعال‌سازی این گزینه، انباردار امکان صدور حواله خروج برای این سفارش را نخواهد داشت."
                >
                  <Lock className="size-4" />
                  توقف خروج
                </Button>
              )}
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

      <ConfirmationModal
        open={shipmentAction !== null}
        title={
          shipmentAction === "lock"
            ? "توقف خروج سفارش"
            : "رفع توقف خروج سفارش"
        }
        message={
          shipmentAction === "lock"
            ? "با ثبت این مورد، انباردار امکان صدور حواله خروج برای این سفارش را نخواهد داشت."
            : "با رفع توقف، سفارش دوباره برای خروج از انبار مجاز می‌شود."
        }
        confirmText={
          shipmentAction === "lock" ? "ثبت توقف خروج" : "رفع توقف خروج"
        }
        tone={shipmentAction === "lock" ? "danger" : "success"}
        busy={isSubmitting}
        onConfirm={confirmShipmentAction}
        onCancel={() => {
          setShipmentAction(null);
          setShipmentStopReason("");
        }}
      >
        {shipmentAction === "lock" ? (
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>دلیل توقف</span>
            <Textarea
              value={shipmentStopReason}
              onChange={(event) => setShipmentStopReason(event.target.value)}
              placeholder="مثلاً: چک مشتری هنوز دریافت نشده است"
              disabled={isSubmitting}
            />
          </label>
        ) : null}
      </ConfirmationModal>
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
