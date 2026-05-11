"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Order } from "@/lib/models/order.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { getOrder } from "@/lib/services/order.service";
import { createExitSlip } from "@/lib/services/warehouse.service";

export default function ExitSlipCreatePage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [slipCode, setSlipCode] = useState("");
  const [exitDate, setExitDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

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

  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      await createExitSlip(order.objectId, {
        slipCode: slipCode.trim() || undefined,
        exitDate,
        issuedByName: getStoredCurrentUser()?.fullName ?? undefined,
        notes: notes.trim() || undefined,
      });
      setMessage("حواله خروج با موفقیت صادر شد.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="warehouse" title="صدور حواله خروج">
      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش انجام نشد" message={error} />
      ) : !order ? (
        <EmptyState title="سفارش یافت نشد" description="شناسه سفارش معتبر نیست." />
      ) : (
        <>
          <SectionHeader title={`صدور حواله ${order.code || order.id}`} description="آدرس تحویل از سفارش خوانده می شود و در انبار دستی وارد نمی شود." />
          {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
          {error ? <InlineErrorMessage message={error} /> : null}
          <CustomerInfoCard order={order} />
          <Card className="p-5">
            <h3 className="text-base font-semibold text-[#102034]">
              فرم صدور حواله خروج
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>شماره حواله</span>
                <Input value={slipCode} onChange={(event) => setSlipCode(event.target.value)} placeholder="در صورت خالی بودن، سرور تولید می کند" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>تاریخ خروج</span>
                <Input type="date" value={exitDate} onChange={(event) => setExitDate(event.target.value)} required />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-medium text-[#334155]">
              <span>توضیحات</span>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            <Button type="button" className="mt-5" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "در حال صدور..." : "صدور حواله خروج"}
            </Button>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
