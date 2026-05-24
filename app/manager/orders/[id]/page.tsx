"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import { ConfirmationModal } from "@/components/manager/confirmation-modal";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/api-error";
import {
  REVIEW_REASONS,
  SHIPMENT_STOP_REASONS,
} from "@/lib/domain/order-action-reasons";
import { formatCurrency, formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order, OrderItem } from "@/lib/models/order.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  approveOrder,
  cancelOrder,
  getOrder,
  markOrderNeedsReview,
  releaseShipment,
  stopShipment,
} from "@/lib/services/order.service";

type DecisionType = "approve" | "cancel" | "needs_review" | null;
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
  const [reviewReasonCode, setReviewReasonCode] = useState("");
  const [shipmentStopReasonCode, setShipmentStopReasonCode] = useState("");
  const [dialogErrors, setDialogErrors] = useState<Record<string, string>>({});
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
      <DashboardLayout role="manager" title="سفارش‌ها">
        <LoadingState title="در حال دریافت سفارش" />
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout role="manager" title="سفارش‌ها">
        {message ? <InlineErrorMessage message={message} /> : null}
        <EmptyState
          title="سفارش یافت نشد"
          description="شناسه سفارش معتبر نیست."
        />
      </DashboardLayout>
    );
  }

  const totalAmount = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const canApprove = ["pending", "review_resolved"].includes(order.orderStatus);
  const canNeedReview = order.orderStatus === "pending";
  const shouldShowNeedReviewButton =
    canNeedReview || order.orderStatus === "review_resolved";
  const canCancel =
    ["pending", "needs_review", "review_resolved"].includes(
      order.orderStatus,
    ) && !["dispatchIssued", "delivered"].includes(order.warehouseStatus);
  const shipmentActionBlockedStatuses = ["cancelled", "invoiced"];
  const shipmentActionBlockedWarehouseStatuses = [
    "dispatchIssued",
    "delivered",
  ];
  const canManageShipmentStop =
    order.orderType === "normal" &&
    order.orderStatus === "approved" &&
    !shipmentActionBlockedStatuses.includes(order.orderStatus) &&
    !shipmentActionBlockedWarehouseStatuses.includes(order.warehouseStatus);
  const isShipmentStopped = order.fulfillmentStatus === "onHold";
  const isCancelled = order.orderStatus === "cancelled";
  const isNeedsReview = order.orderStatus === "needs_review";
  const isReviewResolved = order.orderStatus === "review_resolved";
  const isVoided = order.orderStatus === "voided";

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

    const currentUserName = getStoredCurrentUser()?.fullName ?? "";

    if (decision === "needs_review" && !reviewReasonCode) {
      setDialogErrors({
        reviewReasonCode: "لطفاً دلیل نیاز به بررسی را انتخاب کنید.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setDialogErrors({});

    try {
      const updated =
        decision === "approve"
          ? await approveOrder(order.objectId)
          : decision === "needs_review"
            ? await markOrderNeedsReview(order.objectId, {
                reasonCode: reviewReasonCode,
                requestedByName: currentUserName,
              })
            : await cancelOrder(order.objectId, {
                cancelledByName: currentUserName,
              });
      setOrder(updated);
      setMessageType("success");
      setMessage(
        decision === "approve"
          ? "سفارش با موفقیت تأیید شد."
          : decision === "needs_review"
            ? "سفارش برای بررسی کارشناس ثبت شد."
            : "سفارش با موفقیت لغو شد.",
      );
      setDecision(null);
      setReviewReasonCode("");
      if (decision === "approve") {
        setTimeout(() => router.push("/manager/order-tracking"), 700);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmShipmentAction = async () => {
    if (!shipmentAction) return;

    const currentUserName = getStoredCurrentUser()?.fullName ?? "";

    if (shipmentAction === "lock" && !shipmentStopReasonCode) {
      setDialogErrors({
        shipmentStopReasonCode: "لطفاً دلیل توقف خروج را انتخاب کنید.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setDialogErrors({});

    try {
      const updated =
        shipmentAction === "lock"
          ? await stopShipment(order.objectId, {
              reasonCode: shipmentStopReasonCode,
              stoppedByName: currentUserName,
            })
          : await releaseShipment(order.objectId, {
              releasedByName: currentUserName,
            });
      setOrder(updated);
      setMessageType("success");
      setMessage(
        shipmentAction === "lock"
          ? "خروج سفارش از انبار متوقف شد."
          : "توقف خروج سفارش رفع شد.",
      );
      setShipmentAction(null);
      setShipmentStopReasonCode("");
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="manager" title="سفارش‌ها">
      <SectionHeader
        title="بررسی جزئیات سفارش"
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
              <InfoItem
                label="منبع سفارش"
                value={order.orderType === "naja" ? "ناجا" : "عادی"}
              />
              <InfoItem label="مشتری" value={order.customerName ?? "-"} />
              <InfoItem label="ثبت کننده" value={order.createdByName || "-"} />
              <InfoItem label="تاریخ ثبت" value={formatDate(order.createdAt)} />
              <InfoItem
                label="وضعیت سفارش"
                value={<StatusBadge type="order" status={order.orderStatus} />}
              />
              <InfoItem
                label="وضعیت انبار"
                value={
                  <StatusBadge
                    type="warehouse"
                    status={order.warehouseStatus}
                  />
                }
              />
              <InfoItem
                label="ممنوعیت خروج از انبار"
                value={
                  order.fulfillmentStatus === "onHold" ? (
                    <Badge variant="warning">
                      <Lock className="size-3.5" />
                      خروج متوقف شده
                    </Badge>
                  ) : (
                    order.fulfillmentStatusLabel
                  )
                }
              />
              <InfoItem
                label="آخرین تغییر"
                value={formatDate(order.updatedAt)}
              />
            </dl>
          </div>

          {isNeedsReview || isReviewResolved ? (
            <div className="rounded-xl border border-[#F1D7AA] bg-[#FFF8EB] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#9A6C18]">
                <AlertTriangle className="size-4" />
                <h3 className="text-base font-semibold">
                  {isReviewResolved ? "سوابق بررسی سفارش" : "دلیل بررسی"}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#5F4320]">
                {order.reviewReasonLabel || "دلیلی ثبت نشده است."}
              </p>
              <div className="mt-3 space-y-1 text-xs leading-6 text-[#8A6A3A]">
                <MetaLine
                  label="ثبت‌کننده"
                  value={order.reviewRequestedByName}
                />
                <MetaLine
                  label="زمان ثبت"
                  value={
                    order.reviewRequestedAt
                      ? formatDate(order.reviewRequestedAt)
                      : null
                  }
                />
                {isNeedsReview ? (
                  <MetaLine
                    label="مهلت باقی‌مانده"
                    value={formatReviewRemaining(order)}
                  />
                ) : null}
                {isReviewResolved ? (
                  <>
                    <MetaLine
                      label="برطرف‌کننده"
                      value={order.reviewResolvedByName}
                    />
                    <MetaLine
                      label="زمان رفع مشکل"
                      value={
                        order.reviewResolvedAt
                          ? formatDate(order.reviewResolvedAt)
                          : null
                      }
                    />
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {isVoided ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#475569]">
                <XCircle className="size-4" />
                <h3 className="text-base font-semibold">سفارش باطل شده</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#475569]">
                {order.voidReason || "مهلت ۴۸ ساعته بررسی سفارش به پایان رسید."}
              </p>
              {order.voidedAt ? (
                <p className="mt-3 text-xs text-[#64748B]">
                  زمان ابطال: {formatDate(order.voidedAt)}
                </p>
              ) : null}
            </div>
          ) : null}

          {isShipmentStopped ? (
            <div className="rounded-xl border border-[#F1D7AA] bg-[#FFF8EB] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#9A6C18]">
                <Lock className="size-4" />
                <h3 className="text-base font-semibold">دلیل توقف خروج</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#5F4320]">
                {order.shipmentStopReasonLabel || "دلیلی ثبت نشده است."}
              </p>
              {order.shipmentStoppedByName || order.shipmentStoppedAt ? (
                <p className="mt-3 text-xs leading-6 text-[#8A6A3A]">
                  {order.shipmentStoppedByName
                    ? `ثبت کننده: ${order.shipmentStoppedByName}`
                    : ""}
                  {order.shipmentStoppedByName && order.shipmentStoppedAt
                    ? " • "
                    : ""}
                  {order.shipmentStoppedAt
                    ? `زمان ثبت: ${formatDate(order.shipmentStoppedAt)}`
                    : ""}
                </p>
              ) : null}
            </div>
          ) : null}

          {isCancelled ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#B91C1C]">
                <XCircle className="size-4" />
                <h3 className="text-base font-semibold">لغو سفارش</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#7F1D1D]">
                {order.cancelReasonLabel || "سفارش لغو شده است."}
              </p>
              {order.cancelledByName || order.cancelledAt ? (
                <p className="mt-3 text-xs leading-6 text-[#991B1B]">
                  {order.cancelledByName
                    ? `ثبت کننده: ${order.cancelledByName}`
                    : ""}
                  {order.cancelledByName && order.cancelledAt ? " • " : ""}
                  {order.cancelledAt
                    ? `زمان ثبت: ${formatDate(order.cancelledAt)}`
                    : ""}
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
              {canApprove || canCancel || canNeedReview
                ? "وضعیت سفارش را مشخص کنید."
                : "این سفارش در وضعیت فعلی قابل تایید یا لغو نیست."}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {canApprove ? (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setDecision("approve")}
                  className="w-full justify-center gap-2 sm:col-span-2"
                >
                  <CheckCircle2 className="size-4" />
                  تایید سفارش
                </Button>
              ) : null}

              {shouldShowNeedReviewButton ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting || !canNeedReview}
                  onClick={() => setDecision("needs_review")}
                  className="w-full justify-center gap-2 disabled:opacity-60"
                  title={
                    canNeedReview
                      ? "ارسال سفارش برای بررسی کارشناس"
                      : "مشکل این سفارش قبلاً برطرف شده است."
                  }
                >
                  <AlertTriangle className="size-5 shrink-0" /> نیازمند بررسی
                </Button>
              ) : null}

              {canCancel ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting}
                  onClick={() => setDecision("cancel")}
                  className="w-full justify-center gap-2"
                >
                  <XCircle className="size-4" />
                  لغو سفارش
                </Button>
              ) : null}
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
                  خروج متوقف شده
                </Badge>
              ) : null}
            </div>

            <div className="mt-4 flex">
              {isShipmentStopped ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canManageShipmentStop || isSubmitting}
                  onClick={() => setShipmentAction("unlock")}
                  title="با رفع توقف، سفارش دوباره برای خروج از انبار مجاز می‌شود."
                  className="w-full justify-center gap-2"
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
                  className="w-full justify-center gap-2"
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
        title={
          decision === "approve"
            ? "تایید سفارش"
            : decision === "needs_review"
              ? "ارسال برای بررسی"
              : "لغو سفارش"
        }
        message={
          decision === "approve"
            ? "با تایید، سفارش وارد فرآیند انبار می شود."
            : decision === "needs_review"
              ? "در این وضعیت موجودی سفارش تا ۴۸ ساعت رزرو می‌ماند و کارشناس باید مشکل را برطرف کند."
              : "آیا از لغو این سفارش مطمئن هستید؟"
        }
        confirmText={
          decision === "approve"
            ? "تایید نهایی"
            : decision === "needs_review"
              ? "ثبت نیاز به بررسی"
              : "ثبت لغو سفارش"
        }
        tone={decision === "cancel" ? "danger" : "success"}
        busy={isSubmitting}
        onConfirm={confirmDecision}
        onCancel={() => {
          setDecision(null);
          setReviewReasonCode("");
          setDialogErrors({});
        }}
      >
        {decision === "needs_review" ? (
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>دلیل نیاز به بررسی</span>
            <Select
              value={reviewReasonCode}
              onValueChange={(value) => {
                setReviewReasonCode(value);
                setDialogErrors((current) => ({
                  ...current,
                  reviewReasonCode: "",
                }));
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger
                className={
                  dialogErrors.reviewReasonCode
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : undefined
                }
                aria-invalid={Boolean(dialogErrors.reviewReasonCode)}
              >
                <SelectValue placeholder="انتخاب دلیل نیاز به بررسی" />
              </SelectTrigger>
              <SelectContent>
                {REVIEW_REASONS.map((reason) => (
                  <SelectItem key={reason.code} value={reason.code}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={dialogErrors.reviewReasonCode} />
          </label>
        ) : null}
      </ConfirmationModal>

      <ConfirmationModal
        open={shipmentAction !== null}
        title={
          shipmentAction === "lock" ? "توقف خروج سفارش" : "رفع توقف خروج سفارش"
        }
        message={
          shipmentAction === "lock"
            ? "برای جلوگیری از خروج کالا از انبار، دلیل توقف را انتخاب کنید."
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
          setShipmentStopReasonCode("");
          setDialogErrors({});
        }}
      >
        {shipmentAction === "lock" ? (
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>دلیل توقف خروج</span>
            <Select
              value={shipmentStopReasonCode}
              onValueChange={(value) => {
                setShipmentStopReasonCode(value);
                setDialogErrors((current) => ({
                  ...current,
                  shipmentStopReasonCode: "",
                }));
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger
                className={
                  dialogErrors.shipmentStopReasonCode
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : undefined
                }
                aria-invalid={Boolean(dialogErrors.shipmentStopReasonCode)}
              >
                <SelectValue placeholder="انتخاب دلیل توقف خروج" />
              </SelectTrigger>
              <SelectContent>
                {SHIPMENT_STOP_REASONS.map((reason) => (
                  <SelectItem key={reason.code} value={reason.code}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={dialogErrors.shipmentStopReasonCode} />
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

function MetaLine({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <p>
      {label}: {value}
    </p>
  );
}

function formatReviewRemaining(order: Order): string | null {
  if (
    order.reviewRemainingMs !== null &&
    order.reviewRemainingMs !== undefined
  ) {
    if (order.reviewRemainingMs <= 0) return "مهلت بررسی پایان یافته است.";

    const hours = Math.floor(order.reviewRemainingMs / (60 * 60 * 1000));
    const minutes = Math.floor(
      (order.reviewRemainingMs % (60 * 60 * 1000)) / (60 * 1000),
    );

    return `${formatNumber(hours)} ساعت و ${formatNumber(minutes)} دقیقه`;
  }

  return order.reviewExpiresAt
    ? `مهلت بررسی تا: ${formatDate(order.reviewExpiresAt)}`
    : null;
}
