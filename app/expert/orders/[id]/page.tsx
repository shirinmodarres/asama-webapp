"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { getOrder, resolveOrderReview } from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ExpertOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

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

  const detailRows = useMemo(
    () =>
      order?.items.map((item) => ({
        id: item.objectId || item.productId,
        name: item.productName || item.productSku || "کالای نامشخص",
        brand: item.brand || "-",
        productSku: item.productSku || "-",
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })) ?? [],
    [order],
  );

  const totalAmount = detailRows.reduce(
    (sum, row) => sum + row.quantity * row.unitPrice,
    0,
  );

  const handleResolveReview = async () => {
    if (!order) return;

    setIsSubmitting(true);
    setActionError("");
    setActionMessage("");

    try {
      const updated = await resolveOrderReview(order.objectId, {
        resolvedByName: getStoredCurrentUser()?.fullName ?? "",
      });
      setOrder(updated);
      setActionMessage("سفارش برای تصمیم نهایی مدیر فروش ارسال شد.");
    } catch (resolveError) {
      setActionError(getErrorMessage(resolveError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<(typeof detailRows)[number]>[] = [
    {
      key: "name",
      header: "نام کالا",
      render: (row) => (
        <span className="font-medium text-[#1F3A5F]">{row.name}</span>
      ),
    },
    { key: "brand", header: "برند", render: (row) => row.brand },
    {
      key: "sku",
      header: "شناسه کالا",
      render: (row) => formatFaDigits(row.productSku),
    },
    {
      key: "unitPrice",
      header: "قیمت واحد",
      render: (row) => formatCurrency(row.unitPrice),
    },
    {
      key: "quantity",
      header: "تعداد",
      render: (row) => formatNumber(row.quantity),
    },
    {
      key: "lineTotal",
      header: "مبلغ",
      render: (row) => formatCurrency(row.quantity * row.unitPrice),
    },
  ];

  return (
    <DashboardLayout role="expert" title="جزئیات سفارش">
      {isLoading ? (
        <LoadingState
          title="در حال دریافت جزئیات سفارش"
          description="اطلاعات سفارش از سرور دریافت می شود."
        />
      ) : error ? (
        <PageErrorMessage
          title="دریافت جزئیات سفارش انجام نشد"
          message={error}
        />
      ) : !order ? (
        <EmptyState
          title="سفارش یافت نشد"
          description="شناسه سفارش معتبر نیست یا رکوردی برای آن وجود ندارد."
        />
      ) : (
        <>
          <SectionHeader
            title={`سفارش ${formatFaDigits(order.code)}`}
            description="جزئیات وضعیت سفارش، انبار و اقلام ثبت شده"
            actions={
              order.canEdit ? (
                <Link
                  href={`/expert/orders/${order.objectId}/edit`}
                  className="btn-primary rounded-xl px-4 py-2 text-sm font-medium text-white visited:text-white hover:text-white focus:text-white"
                >
                  ویرایش سفارش
                </Link>
              ) : null
            }
          />

          {actionMessage ? (
            <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">
              {actionMessage}
            </div>
          ) : null}

          {actionError ? (
            <PageErrorMessage
              title="انجام عملیات سفارش ممکن نشد"
              message={actionError}
            />
          ) : null}

          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-[#1F3A5F]">
                  اطلاعات سفارش
                </h3>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoItem
                    label="کد سفارش"
                    value={formatFaDigits(order.code)}
                  />
                  <InfoItem label="مشتری" value={order.customerName || "-"} />
                  <InfoItem label="ثبت کننده" value={order.createdByName} />
                  <InfoItem
                    label="تاریخ ثبت"
                    value={formatDate(order.createdAt)}
                  />
                  <InfoItem
                    label="وضعیت سفارش"
                    value={
                      <StatusBadge type="order" status={order.orderStatus} />
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
                </dl>
              </div>

              {order.orderStatus === "needs_review" ||
              order.orderStatus === "review_resolved" ? (
                <div className="rounded-xl border border-[#F1D7AA] bg-[#FFF8EB] p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[#9A6C18]">
                    <AlertTriangle className="size-4" />
                    <h3 className="text-base font-semibold">
                      {order.orderStatus === "review_resolved"
                        ? "مشکل این سفارش برطرف شده است."
                        : "این سفارش نیازمند بررسی است."}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#5F4320]">
                    {order.reviewReasonLabel || "دلیلی ثبت نشده است."}
                  </p>
                  <div className="mt-3 space-y-1 text-xs leading-6 text-[#8A6A3A]">
                    {order.reviewExpiresAt ? (
                      <p>مهلت بررسی تا: {formatDate(order.reviewExpiresAt)}</p>
                    ) : null}
                    {order.reviewRemainingMs !== null ? (
                      <p>{formatReviewRemaining(order.reviewRemainingMs)}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 border-[#D9A441] bg-white text-[#9A6C18] hover:bg-[#FFF1D6] hover:text-[#7A520F] disabled:border-[#E5E7EB] disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                    disabled={
                      isSubmitting || order.orderStatus === "review_resolved"
                    }
                    onClick={handleResolveReview}
                  >
                    {order.orderStatus === "review_resolved"
                      ? "مشکل برطرف شده"
                      : "مشکل برطرف شد"}
                  </Button>
                </div>
              ) : null}

              <CustomerInfoCard order={order} />

              <DataTable
                columns={columns}
                rows={detailRows}
                rowKey={(row) => row.id}
              />
            </div>

            <OrderSummaryCard
              customerName={order.customerName}
              itemCount={detailRows.length}
              totalQuantity={detailRows.reduce(
                (sum, row) => sum + row.quantity,
                0,
              )}
              totalAmount={totalAmount}
              status={order.orderStatus}
              warehouseStatus={order.warehouseStatus}
            />
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#1F3A5F]">{value}</dd>
    </div>
  );
}

function formatReviewRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return "مهلت بررسی پایان یافته است.";

  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  return `مهلت باقی‌مانده: ${formatNumber(hours)} ساعت و ${formatNumber(minutes)} دقیقه`;
}
