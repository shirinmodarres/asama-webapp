"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NajaCenterInfoCard } from "@/components/naja/naja-center-info-card";
import { NajaReturnActionRemote } from "@/components/naja/naja-return-action-remote";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { OrderSourceBadge } from "@/components/shared/order-source-badge";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDate, formatDateTime } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { createNajaInvoice } from "@/lib/services/naja.service";
import { getOrder } from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function FinanceNajaInvoicePage() {
  const params = useParams<{ id: string }>();
  const objectId = decodeURIComponent(params.id);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getOrder(objectId);
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
  }, [objectId]);

  const handleIssue = async () => {
    if (!order) return;
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      await createNajaInvoice(order.objectId, {
        invoiceName: "ناجا",
        createdByName: "مریم نادری",
      });
      setMessage("فاکتور ناجا صادر شد.");
      setTimeout(() => {
        router.push("/finance/invoices");
        router.refresh();
      }, 700);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="finance" title="فاکتور ناجا">
        <LoadingState title="در حال دریافت سفارش ناجا" />
      </DashboardLayout>
    );
  }

  if (error && !order) {
    return (
      <DashboardLayout role="finance" title="فاکتور ناجا">
        <PageErrorMessage title="دریافت سفارش ناجا انجام نشد" message={error} />
      </DashboardLayout>
    );
  }

  if (!order || order.orderType !== "naja") {
    return (
      <DashboardLayout role="finance" title="فاکتور ناجا">
        <EmptyState title="سفارش ناجا یافت نشد" description="این رکورد مربوط به مسیر اختصاصی ناجا نیست." />
      </DashboardLayout>
    );
  }

  const firstItem = order.items[0];
  const isReturned =
    order.orderStatus === "returned" ||
    order.orderStatus === "returnedAfterInvoice";

  return (
    <DashboardLayout role="finance" title="فاکتور ناجا">
      <SectionHeader
        title={`فاکتور ناجا برای ${order.code}`}
        description="این مسیر بدون تطبیق حواله خروج، مستقیما فاکتور را به نام ناجا صادر می کند."
        actions={<OrderSourceBadge source="naja" />}
      />

      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error && order ? <InlineErrorMessage message={error} /> : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem label="نام صورتحساب" value="ناجا" />
              <InfoItem label="کارشناس ثبت کننده" value={order.createdByName || "-"} />
              <InfoItem label="نام مشتری" value={order.customerName ?? "-"} />
              <InfoItem label="کد ملی" value={order.customerNationalId ? formatFaDigits(order.customerNationalId) : "-"} />
              <InfoItem label="شماره موبایل" value={order.customerPhone ? formatFaDigits(order.customerPhone) : "-"} />
              <InfoItem label="کالا" value={firstItem?.productName ?? "-"} />
              <InfoItem label="شناسه کالا" value={firstItem?.productIdentifier ? formatFaDigits(firstItem.productIdentifier) : "-"} />
              <InfoItem label="کد رهگیری" value={firstItem?.trackingCode ? formatFaDigits(firstItem.trackingCode) : "-"} />
              <InfoItem label="تاریخ ثبت سفارش" value={formatDate(order.createdAt)} />
              <InfoItem label="آخرین تغییر" value={formatDateTime(order.updatedAt)} />
            </div>

            <div className="mt-5 flex gap-2">
              <Button type="button" onClick={handleIssue} disabled={isSubmitting || isReturned}>
                {isSubmitting ? "در حال صدور..." : isReturned ? "امکان صدور فاکتور وجود ندارد" : "صدور فاکتور به نام ناجا"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/finance/ready">بازگشت</Link>
              </Button>
            </div>
          </Card>

          <CustomerInfoCard order={order} />

          <NajaCenterInfoCard center={order.najaCenter} title="مرکز ناجا در صورتحساب" />
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <Badge variant="warning">ضمیمه مشتری ناجا</Badge>
            <p className="mt-4 text-sm leading-7 text-[#6B7280]">
              اطلاعات مشتری، کد ملی، شماره موبایل، شناسه کالا و کد رهگیری به عنوان
              ضمیمه فاکتور ذخیره می شود و نام صورتحساب روی «ناجا» قرار می گیرد.
            </p>
            {order.orderStatus === "returnedAfterInvoice" ? (
              <p className="mt-3 rounded-[14px] border border-[#F0D0D0] bg-[#FFF6F6] px-3 py-2 text-xs text-[#9C3B3B]">
                این سفارش پس از صدور فاکتور برگشت خورده و نیازمند پیگیری مالی است.
              </p>
            ) : null}
          </Card>

          <NajaReturnActionRemote order={order} actorName="مریم نادری" onReturned={(updatedOrder) => setOrder(updatedOrder)} />
        </div>
      </section>
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#1F3A5F]">{value}</p>
    </div>
  );
}
