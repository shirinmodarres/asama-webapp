"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NajaCenterInfoCard } from "@/components/naja/naja-center-info-card";
import { NajaReturnActionRemote } from "@/components/naja/naja-return-action-remote";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Order } from "@/lib/models/order.model";
import { completeNajaWarehouseInfo } from "@/lib/services/naja.service";
import { getOrder } from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function WarehouseNajaDetailsPage() {
  const params = useParams<{ id: string }>();
  const objectId = decodeURIComponent(params.id);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [productIdentifier, setProductIdentifier] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
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
        if (!isMounted) return;
        setOrder(data);
        setProductIdentifier(formatFaDigits(data.items[0]?.productIdentifier ?? ""));
        setTrackingCode(formatFaDigits(data.items[0]?.trackingCode ?? ""));
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

  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const updated = await completeNajaWarehouseInfo(order.objectId, {
        productIdentifier: productIdentifier.trim(),
        trackingCode: trackingCode.trim(),
        completedByName: "رضا احمدی",
      });
      setOrder(updated);
      setMessage("اطلاعات انبار ناجا ثبت شد.");
      setTimeout(() => {
        router.push("/finance/ready");
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
      <DashboardLayout role="warehouse" title="تکمیل اطلاعات انبار ناجا">
        <LoadingState title="در حال دریافت سفارش ناجا" />
      </DashboardLayout>
    );
  }

  if (error && !order) {
    return (
      <DashboardLayout role="warehouse" title="تکمیل اطلاعات انبار ناجا">
        <PageErrorMessage title="دریافت سفارش ناجا انجام نشد" message={error} />
      </DashboardLayout>
    );
  }

  if (!order || order.orderType !== "naja") {
    return (
      <DashboardLayout role="warehouse" title="تکمیل اطلاعات انبار ناجا">
        <EmptyState title="سفارش ناجا یافت نشد" description="این شناسه مربوط به جریان ناجا نیست." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="warehouse" title="تکمیل اطلاعات انبار ناجا">
      <SectionHeader
        title={`تکمیل اطلاعات ${order.code}`}
        description="برای سفارش های ناجا، شناسه کالا و کد رهگیری باید قبل از ارسال به مالی ثبت شوند."
        actions={<Badge variant="warning">سفارش ناجا</Badge>}
      />

      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error && order ? <InlineErrorMessage message={error} /> : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>شناسه کالا</span>
                <Input value={productIdentifier} onChange={(event) => setProductIdentifier(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کد رهگیری</span>
                <Input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "در حال ثبت..." : "ثبت اطلاعات انبار"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/warehouse/orders/${order.objectId}`}>بازگشت</Link>
              </Button>
            </div>
          </Card>

          <NajaCenterInfoCard center={order.najaCenter} />
        </div>

        <div className="space-y-4">
          <Card className="p-5 text-sm leading-7 text-[#6B7280]">
            <p className="font-semibold text-[#102034]">خلاصه سفارش</p>
            <p className="mt-2">مشتری: {order.customerName ?? "-"}</p>
            <p>ثبت کننده: {order.createdByName || "-"}</p>
            <div className="flex items-center gap-2">
              <span>وضعیت فعلی:</span>
              <StatusBadge type="warehouse" status={order.warehouseStatus} />
            </div>
          </Card>

          <NajaReturnActionRemote order={order} actorName="رضا احمدی" onReturned={(updatedOrder) => setOrder(updatedOrder)} />
        </div>
      </section>
    </DashboardLayout>
  );
}
