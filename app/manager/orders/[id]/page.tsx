"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, getErrorMessage } from "@/lib/api/api-error";
import {
  REVIEW_REASONS,
  SHIPMENT_STOP_REASONS,
} from "@/lib/domain/order-action-reasons";
import { getFinancialApprovalStatusLabel } from "@/lib/domain/statuses";
import { formatCurrency, formatDate, formatNumber } from "@/lib/expert/utils";
import type {
  Order,
  OrderApprovalResult,
  OrderItem,
} from "@/lib/models/order.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  approveNajaOrder,
  rejectNajaOrder,
} from "@/lib/services/naja.service";
import {
  approveOrder,
  approveFinancialOrder,
  cancelOrder,
  getOrder,
  markOrderNeedsReview,
  returnFinancialOrder,
  releaseShipment,
  retryOrderQuotation,
  stopShipment,
} from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

type DecisionType = "approve" | "reject" | "cancel" | "needs_review" | null;
type ShipmentAction = "lock" | "unlock" | null;
interface StockSelectionOption {
  stockObjectId: string;
  sepidarStockId: number | string | null;
  stockTitle: string;
}

export default function ManagerOrderReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const objectId = decodeURIComponent(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetryingQuotation, setIsRetryingQuotation] = useState(false);
  const [isFinancialActionSubmitting, setIsFinancialActionSubmitting] = useState(false);
  const [decision, setDecision] = useState<DecisionType>(null);
  const [financialDecision, setFinancialDecision] = useState<"approve" | "return" | null>(null);
  const [shipmentAction, setShipmentAction] = useState<ShipmentAction>(null);
  const [reviewReasonCode, setReviewReasonCode] = useState("");
  const [najaRejectReason, setNajaRejectReason] = useState("");
  const [financialCorrectionReason, setFinancialCorrectionReason] = useState("");
  const [shipmentStopReasonCode, setShipmentStopReasonCode] = useState("");
  const [stockSelectionOptions, setStockSelectionOptions] = useState<
    StockSelectionOption[]
  >([]);
  const [selectedStockObjectId, setSelectedStockObjectId] = useState("");
  const [dialogErrors, setDialogErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "error"
  >("error");

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

  const currentRole = getStoredCurrentUser()?.role ?? null;
  const layoutRole = currentRole === "financial_control" ? "finance-control" : "manager";

  if (isLoading) {
    return (
      <DashboardLayout role={layoutRole} title="سفارش‌ها">
        <LoadingState title="در حال دریافت سفارش" />
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout role={layoutRole} title="سفارش‌ها">
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
  const isFinancialControlUser = currentRole === "financial_control";
  const isNajaOrder = order.orderType === "naja";
  const effectiveFinancialApprovalStatus =
    order.financialApprovalStatus ??
    (order.orderStatus === "pending_financial_approval" ? "pending" : null);
  const financialGateOpen =
    !effectiveFinancialApprovalStatus || effectiveFinancialApprovalStatus === "approved";
  const canManageFinancialDecision =
    isFinancialControlUser &&
    order.orderStatus === "pending_financial_approval" &&
    effectiveFinancialApprovalStatus === "pending";
  const canApprove =
    financialGateOpen &&
    (isNajaOrder
      ? order.orderStatus === "pending_manager_approval"
      : ["pending_manager_approval", "review_resolved"].includes(
          order.orderStatus,
        ));
  const canRejectNaja =
    isNajaOrder &&
    order.orderStatus === "pending_manager_approval" &&
    financialGateOpen;
  const canNeedReview = !isNajaOrder && order.orderStatus === "pending_manager_approval";
  const shouldShowNeedReviewButton =
    !isNajaOrder && (canNeedReview || order.orderStatus === "review_resolved");
  const canCancel =
    !isNajaOrder &&
    ["pending_manager_approval", "needs_review", "review_resolved", "approved"].includes(
      order.orderStatus,
    ) && !["dispatchIssued", "delivered"].includes(order.warehouseStatus) &&
    order.orderStatus !== "cancelled" &&
    order.orderStatus !== "voided";
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
  const isFinancialReadOnly =
    isFinancialControlUser && order.orderStatus !== "pending_financial_approval";
  const pageTitle = isFinancialControlUser
    ? "بررسی سفارش مالی"
    : "بررسی جزئیات سفارش";
  const pageDescription = isFinancialControlUser
    ? "ثبت تأیید یا برگشت سفارش برای اصلاح"
    : "ثبت تصمیم نهایی مدیر فروش برای شروع یا توقف فرآیند انبار";
  const managerActionVisible = !isFinancialControlUser;
  const reviewSectionVisible = !isFinancialControlUser && (isNeedsReview || isReviewResolved);
  const shipmentControlVisible = !isFinancialControlUser;

  const columns: DataTableColumn<OrderItem>[] = [
    {
      key: "name",
      header: "نام کالا",
      render: (row) => (
        <span className="font-medium text-[#1F3A5F]">
          {row.productName
            ? formatFaDigits(row.productName)
            : formatFaDigits(row.productSku || "کالای نامشخص")}
        </span>
      ),
    },
    {
      key: "brand",
      header: "برند",
      render: (row) => row.brandName || row.brand || "-",
    },
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

  const handleApproveSuccess = (result: OrderApprovalResult) => {
    setOrder((current) => {
      const refreshed = result.order ?? current;
      return refreshed
        ? {
            ...refreshed,
            orderStatus: "approved",
            orderStatusLabel: "تأیید شده",
            quotationStatus: result.quotationStatus,
          }
        : refreshed;
    });
    if (result.quotationStatus === "failed") {
      setMessageType("warning");
      setMessage(
        "سفارش با موفقیت تأیید شد، اما ثبت پیش‌فاکتور سپیدار انجام نشد.",
      );
    } else {
      setMessageType("success");
      setMessage("سفارش با موفقیت تأیید شد.");
    }
    setDecision(null);
    setStockSelectionOptions([]);
    setSelectedStockObjectId("");
    router.refresh();
    void getOrder(order.objectId)
      .then((freshOrder) => setOrder(freshOrder))
      .catch(() => undefined);
  };

  const handleApprovalError = (error: unknown) => {
    const options = extractStockSelectionOptions(error);
    if (options.length > 0) {
      setDecision(null);
      setStockSelectionOptions(options);
      setSelectedStockObjectId(options[0]?.stockObjectId ?? "");
      setMessageType("error");
      setMessage(getErrorMessage(error));
      return;
    }

    setMessageType("error");
    setMessage(getErrorMessage(error));
  };

  const confirmDecision = async () => {
    if (!decision) return;

    const currentUserName = getStoredCurrentUser()?.fullName ?? "";

    if (decision === "needs_review" && !reviewReasonCode) {
      setDialogErrors({
        reviewReasonCode: "لطفاً دلیل نیاز به بررسی را انتخاب کنید.",
      });
      return;
    }

    if (decision === "reject" && !najaRejectReason.trim()) {
      setDialogErrors({
        najaRejectReason: "لطفاً دلیل رد سفارش ناجا را وارد کنید.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setDialogErrors({});

    try {
      if (decision === "approve") {
        if (isNajaOrder) {
          const updated = await approveNajaOrder(order.objectId, {
            approvedByName: currentUserName,
          });
          setOrder(updated);
          setMessageType("success");
          setMessage("سفارش ناجا با موفقیت تأیید شد.");
          setDecision(null);
          router.refresh();
        } else {
          const result = await approveOrder(order.objectId);
          handleApproveSuccess(result);
        }
        return;
      }

      const updated =
        decision === "reject"
          ? await rejectNajaOrder(order.objectId, {
              reason: najaRejectReason.trim(),
              rejectedByName: currentUserName,
            })
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
        decision === "reject"
          ? "سفارش ناجا رد شد."
          : decision === "needs_review"
          ? "سفارش برای بررسی کارشناس ثبت شد."
          : "سفارش با موفقیت لغو شد.",
      );
      setDecision(null);
      setReviewReasonCode("");
      setNajaRejectReason("");
    } catch (error) {
      if (decision === "approve") {
        handleApprovalError(error);
      } else {
        setMessageType("error");
        setMessage(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmFinancialDecision = async () => {
    if (!financialDecision) return;

    if (financialDecision === "return" && !financialCorrectionReason.trim()) {
      setDialogErrors({
        financialCorrectionReason: "لطفاً دلیل برگشت برای اصلاح را وارد کنید.",
      });
      return;
    }

    setIsFinancialActionSubmitting(true);
    setMessage("");
    setDialogErrors({});

    try {
      const updated =
      financialDecision === "approve"
          ? await approveFinancialOrder(order.objectId, {
              approvedByName: getStoredCurrentUser()?.fullName ?? "",
            })
          : await returnFinancialOrder(order.objectId, {
              returnedByName: getStoredCurrentUser()?.fullName ?? "",
              correctionReason: financialCorrectionReason,
            });
      setOrder(updated);
      setMessageType("success");
      setMessage(
        financialDecision === "approve"
          ? "تأیید مالی با موفقیت ثبت شد."
          : "سفارش برای اصلاح به کارشناس برگردانده شد.",
      );
      setFinancialDecision(null);
      setFinancialCorrectionReason("");
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setIsFinancialActionSubmitting(false);
    }
  };

  const confirmStockSelection = async () => {
    if (!selectedStockObjectId) {
      setDialogErrors({
        stockObjectId: "لطفاً انبار خروج را انتخاب کنید.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setDialogErrors({});

    try {
      const result = await approveOrder(order.objectId, {
        stockObjectId: selectedStockObjectId,
      });
      handleApproveSuccess(result);
    } catch (error) {
      handleApprovalError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryQuotation = async () => {
    setIsRetryingQuotation(true);
    setMessage("");
    setOrder((current) =>
      current
        ? {
            ...current,
            quotationStatus: "pending",
            quotationSyncError: null,
            sepidarLastError: null,
            sepidarIntegrationStatus: null,
          }
        : current,
    );
    try {
      const result = await retryOrderQuotation(order.objectId);
      setOrder((current) =>
        result.order
          ? result.order
          : current
            ? { ...current, quotationStatus: result.quotationStatus }
            : current,
      );
      if (result.quotationStatus === "success") {
        setMessageType("success");
        setMessage("پیش‌فاکتور سپیدار با موفقیت ثبت شد.");
      } else {
        setMessageType("warning");
        setMessage("ثبت پیش‌فاکتور سپیدار انجام نشد.");
      }
      router.refresh();
      void getOrder(order.objectId)
        .then((freshOrder) => setOrder(freshOrder))
        .catch(() => undefined);
    } catch (retryError) {
      setMessageType("error");
      setMessage(getErrorMessage(retryError));
      router.refresh();
      await getOrder(order.objectId)
        .then((freshOrder) => setOrder(freshOrder))
        .catch(() => undefined);
    } finally {
      setIsRetryingQuotation(false);
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
    <DashboardLayout role={layoutRole} title={isFinancialControlUser ? "کنترل مالی" : "سفارش‌ها"}>
      <SectionHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {order.canEdit && !isFinancialControlUser ? (
              <Link
                href={`/manager/orders/${order.objectId}/edit`}
                className="rounded-xl bg-[#1F3A5F] px-4 py-2 text-sm font-semibold text-white hover:text-white"
              >
                ویرایش سفارش
              </Link>
            ) : null}
            <Link
              href={isFinancialControlUser ? "/finance-control/orders" : "/manager/order-tracking"}
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155] hover:border-[#CBD5E1]"
            >
              بازگشت به لیست
            </Link>
          </div>
        }
      />

      {message && messageType === "success" ? (
        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">
          {message}
        </div>
      ) : null}
      {message && messageType === "warning" ? (
        <div className="rounded-xl border border-[#F1D7AA] bg-[#FFF8EB] p-3 text-sm text-[#8A5A00]">
          {message}
        </div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}

      {isFinancialControlUser && isFinancialReadOnly ? (
        <div className="rounded-xl border border-[#D7E5F0] bg-[#F8FBFF] px-4 py-3 text-sm leading-7 text-[#1F3A5F]">
          این سفارش قبلاً در کنترل مالی بررسی شده است؛ در این صفحه فقط می‌توانید جزئیات را مشاهده کنید.
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#1F3A5F]">
              مشخصات سفارش
            </h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="کد سفارش"
                value={formatFaDigits(order.code || "-")}
              />
              <InfoItem
                label="منبع سفارش"
                value={order.orderType === "naja" ? "ناجا" : "بازار"}
              />
              <InfoItem label="مشتری" value={order.customerName ?? "-"} />
              <InfoItem
                label="روش پرداخت"
                value={order.salesTypeTitle || "-"}
              />
              <InfoItem
                label="لیست قیمت"
                value={order.priceListTitle || order.priceList?.title || "-"}
              />
              <InfoItem
                label="وضعیت تأیید مالی"
                value={
                  order.financialApprovalStatusLabel ||
                  getFinancialApprovalStatusLabel(effectiveFinancialApprovalStatus) ||
                  "-"
                }
              />
              {order.orderType === "naja" ? (
                <>
                  <InfoItem
                    label="کد مشتری سپیدار"
                    value={
                      order.sepidarCustomerCode
                        ? formatFaDigits(order.sepidarCustomerCode)
                        : "-"
                    }
                  />
                  {order.salesTypeTitle ? (
                    <div className="sm:col-span-2 rounded-xl border border-[#D7E5F0] bg-[#F8FBFF] px-4 py-3 text-sm leading-7 text-[#1F3A5F]">
                      این سفارش با روش پرداخت <strong>{order.salesTypeTitle}</strong> ثبت شده است.
                    </div>
                  ) : null}
                  {hasRecipientInfo(order) ? (
                    <>
                      <InfoItem
                        label="نام و نام خانوادگی تحویل‌گیرنده"
                        value={
                          [order.recipientFirstName, order.recipientLastName]
                            .filter(Boolean)
                            .join(" ") || "-"
                        }
                      />
                      <InfoItem
                        label="کد ملی تحویل‌گیرنده"
                        value={
                          order.recipientNationalId
                            ? formatFaDigits(order.recipientNationalId)
                            : "-"
                        }
                      />
                      <InfoItem
                        label="شماره موبایل تحویل‌گیرنده"
                        value={
                          order.recipientMobile
                            ? formatFaDigits(order.recipientMobile)
                            : "-"
                        }
                      />
                    </>
                  ) : null}
                  <InfoItem
                    label="شماره سفارش"
                    value={
                      order.najaOrderNumber
                        ? formatFaDigits(order.najaOrderNumber)
                        : "-"
                    }
                  />
                </>
              ) : null}
              <InfoItem label="انبار خروج" value={order.stockTitle || "-"} />
              <InfoItem label="ثبت کننده" value={order.createdByName || "-"} />
              <InfoItem label="تاریخ ثبت" value={formatDate(order.createdAt)} />
              <InfoItem
                label="وضعیت سفارش"
                value={
                  <StatusBadge
                    type="order"
                    status={order.orderStatus}
                    warehouseStatus={order.warehouseStatus}
                  />
                }
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

          {reviewSectionVisible ? (
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

          {shipmentControlVisible && isShipmentStopped ? (
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

          {shipmentControlVisible && isCancelled ? (
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

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#1F3A5F]">
                  وضعیت پیش‌فاکتور سپیدار
                </h3>
                <div className="mt-3">{getQuotationStatusBadge(order)}</div>
              </div>
              {order.quotationStatus === "failed" && !isFinancialControlUser ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isRetryingQuotation}
                  onClick={retryQuotation}
                >
                  <RefreshCw
                    className={
                      isRetryingQuotation ? "size-4 animate-spin" : "size-4"
                    }
                  />
                  {isRetryingQuotation
                    ? "در حال تلاش مجدد..."
                    : "تلاش مجدد برای ثبت پیش‌فاکتور"}
                </Button>
              ) : null}
            </div>
          </div>

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
            <p className="text-sm font-semibold text-[#1F3A5F]">
              اطلاعات فروش
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <InfoItem
                label="روش پرداخت"
                value={order.salesTypeTitle || "-"}
              />
              <InfoItem
                label="لیست قیمت"
                value={order.priceListTitle || order.priceList?.title || "-"}
              />
            </div>
          </div>

          {isFinancialControlUser ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#1F3A5F]">
                کنترل مالی
              </p>
              <p className="mt-2 text-sm leading-7 text-[#64748B]">
                وضعیت فعلی: {order.financialApprovalStatusLabel || getFinancialApprovalStatusLabel(effectiveFinancialApprovalStatus) || "-"}
              </p>
              {canManageFinancialDecision ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={isFinancialActionSubmitting || order.financialApprovalStatus === "approved"}
                    onClick={() => setFinancialDecision("approve")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="size-4" />
                    تأیید مالی
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      isFinancialActionSubmitting ||
                      order.financialApprovalStatus === "needs_correction" ||
                      order.financialApprovalStatus === "approved"
                    }
                    onClick={() => setFinancialDecision("return")}
                    className="gap-2"
                  >
                    <AlertTriangle className="size-4" />
                    برگشت برای اصلاح
                  </Button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm leading-7 text-[#64748B]">
                  این سفارش قبلاً در کنترل مالی بررسی شده است و فقط برای مشاهده در دسترس است.
                </div>
              )}
            </div>
          ) : null}

          {managerActionVisible ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm leading-7 text-[#6B7280]">
              {isFinancialControlUser
                ? "سفارش را در این مرحله تأیید یا برای اصلاح برگردانید."
                : canApprove || canRejectNaja || canCancel || canNeedReview
                ? "وضعیت سفارش را مشخص کنید."
                : null}
            </p>
            {!isFinancialControlUser &&
            effectiveFinancialApprovalStatus &&
            effectiveFinancialApprovalStatus !== "approved" ? (
              <p className="mt-3 rounded-xl border border-[#F1D7AA] bg-[#FFF8EB] px-3 py-2 text-sm text-[#8A5A00]">
                این سفارش هنوز در انتظار تأیید کنترل مالی است.
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {canApprove && !isFinancialControlUser ? (
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

              {canRejectNaja ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting}
                  onClick={() => setDecision("reject")}
                  className="w-full justify-center gap-2 sm:col-span-2"
                >
                  <XCircle className="size-4" />
                  رد سفارش ناجا
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
          ) : null}

          {shipmentControlVisible ? (
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
          ) : null}
        </div>
      </section>

      <ConfirmationModal
        open={decision !== null}
        title={
          decision === "approve"
            ? "تایید سفارش"
            : decision === "reject"
              ? "رد سفارش ناجا"
            : decision === "needs_review"
              ? "ارسال برای بررسی"
              : "لغو سفارش"
        }
        message={
          decision === "approve"
            ? "با تایید، سفارش وارد فرآیند انبار می شود."
            : decision === "reject"
              ? "با رد سفارش، رزرو احتمالی آن طبق منطق فعلی سفارش آزاد می‌شود."
            : decision === "needs_review"
              ? "در این وضعیت موجودی سفارش تا ۴۸ ساعت رزرو می‌ماند و کارشناس باید مشکل را برطرف کند."
              : order.quotationStatus === "success"
                ? "برای این سفارش پیش‌فاکتور در سپیدار ثبت شده است. با لغو سفارش، پیش‌فاکتور سپیدار حذف نخواهد شد. آیا از ادامه مطمئن هستید؟"
                : "آیا از لغو این سفارش مطمئن هستید؟"
        }
        confirmText={
          decision === "approve"
            ? "تایید نهایی"
            : decision === "reject"
              ? "ثبت رد سفارش"
            : decision === "needs_review"
              ? "ثبت نیاز به بررسی"
              : "ثبت لغو سفارش"
        }
        tone={decision === "cancel" || decision === "reject" ? "danger" : "success"}
        busy={isSubmitting}
        onConfirm={confirmDecision}
        onCancel={() => {
          setDecision(null);
          setReviewReasonCode("");
          setNajaRejectReason("");
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
        {decision === "reject" ? (
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>دلیل رد سفارش</span>
            <Textarea
              value={najaRejectReason}
              onChange={(event) => {
                setNajaRejectReason(event.target.value);
                setDialogErrors((current) => ({
                  ...current,
                  najaRejectReason: "",
                }));
              }}
              placeholder="دلیل رد سفارش ناجا را وارد کنید"
              rows={4}
              disabled={isSubmitting}
            />
            <FieldError message={dialogErrors.najaRejectReason} />
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

      <ConfirmationModal
        open={financialDecision !== null}
        title={
          financialDecision === "approve"
            ? "تأیید مالی"
            : "برگشت برای اصلاح"
        }
        message={
          financialDecision === "approve"
            ? "سفارش وارد مرحله تأیید مدیر فروش می‌شود."
            : "لطفاً دلیل برگشت برای اصلاح را وارد کنید."
        }
        confirmText={
          financialDecision === "approve"
            ? "تأیید مالی"
            : "ثبت برگشت"
        }
        tone={financialDecision === "return" ? "danger" : "success"}
        busy={isFinancialActionSubmitting}
        onConfirm={confirmFinancialDecision}
        onCancel={() => {
          setFinancialDecision(null);
          setFinancialCorrectionReason("");
          setDialogErrors({});
        }}
      >
        {financialDecision === "return" ? (
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>دلیل برگشت</span>
            <Textarea
              value={financialCorrectionReason}
              onChange={(event) => {
                setFinancialCorrectionReason(event.target.value);
                setDialogErrors((current) => ({
                  ...current,
                  financialCorrectionReason: "",
                }));
              }}
              placeholder="مثلاً: نیاز به اصلاح تعداد یا اطلاعات مشتری"
              rows={4}
              disabled={isFinancialActionSubmitting}
            />
            <FieldError message={dialogErrors.financialCorrectionReason} />
          </label>
        ) : null}
      </ConfirmationModal>

      <ConfirmationModal
        open={stockSelectionOptions.length > 0}
        title="انتخاب انبار خروج"
        message="چند انبار مجاز موجودی کافی دارند؛ لطفاً انبار خروج را انتخاب کنید."
        confirmText="تایید و ادامه"
        tone="success"
        busy={isSubmitting}
        onConfirm={confirmStockSelection}
        onCancel={() => {
          setStockSelectionOptions([]);
          setSelectedStockObjectId("");
          setDialogErrors({});
        }}
      >
        <label className="grid gap-2 text-sm font-medium text-[#334155]">
          <span>انبار خروج</span>
          <Select
            value={selectedStockObjectId}
            onValueChange={(value) => {
              setSelectedStockObjectId(value);
              setDialogErrors((current) => ({
                ...current,
                stockObjectId: "",
              }));
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger
              className={
                dialogErrors.stockObjectId
                  ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                  : undefined
              }
              aria-invalid={Boolean(dialogErrors.stockObjectId)}
            >
              <SelectValue placeholder="انتخاب انبار خروج" />
            </SelectTrigger>
            <SelectContent>
              {stockSelectionOptions.map((option) => (
                <SelectItem
                  key={option.stockObjectId}
                  value={option.stockObjectId}
                >
                  {formatStockOptionLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={dialogErrors.stockObjectId} />
        </label>
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

function extractStockSelectionOptions(error: unknown): StockSelectionOption[] {
  if (!(error instanceof ApiError) || error.code !== "WAREHOUSE_SELECTION_REQUIRED") {
    return [];
  }

  const details = error.details;
  if (!details || typeof details !== "object" || !("options" in details)) {
    return [];
  }

  const options = (details as { options?: unknown }).options;
  if (!Array.isArray(options)) return [];

  return options
    .map((option) => {
      if (!option || typeof option !== "object") return null;
      const record = option as Record<string, unknown>;
      const stockObjectId =
        typeof record.stockObjectId === "string" ? record.stockObjectId : "";
      if (!stockObjectId) return null;
      return {
        stockObjectId,
        sepidarStockId:
          typeof record.sepidarStockId === "string" ||
          typeof record.sepidarStockId === "number"
            ? record.sepidarStockId
            : null,
        stockTitle:
          typeof record.stockTitle === "string" ? record.stockTitle : "",
      };
    })
    .filter((option): option is StockSelectionOption => Boolean(option));
}

function formatStockOptionLabel(option: StockSelectionOption): string {
  const stockId =
    option.sepidarStockId !== null && option.sepidarStockId !== undefined
      ? formatFaDigits(option.sepidarStockId)
      : "";
  return [stockId, option.stockTitle].filter(Boolean).join(" - ") || "انبار";
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

function hasRecipientInfo(order: Order): boolean {
  return Boolean(
    order.recipientFirstName ||
      order.recipientLastName ||
      order.recipientNationalId ||
      order.recipientMobile,
  );
}

function getQuotationStatusBadge(order: Order): ReactNode {
  if (order.quotationStatus === "failed") {
    return (
      <Badge variant="destructive" dot>
        پیش‌فاکتور سپیدار ثبت نشده
      </Badge>
    );
  }
  if (order.quotationStatus === "success") {
    return (
      <Badge variant="success" dot>
        پیش‌فاکتور سپیدار ثبت شده
      </Badge>
    );
  }
  return (
    <Badge variant="warning" dot>
      در انتظار ارسال به سپیدار
    </Badge>
  );
}
