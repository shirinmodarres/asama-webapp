"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { QuotationForm } from "@/components/quotations/quotation-form";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { getErrorMessage } from "@/lib/api/api-error";
import type { SalesQuotation, UpdateSalesQuotationPayload } from "@/lib/models/sales-quotation.model";
import { finalizeSalesQuotation, getSalesQuotation, updateSalesQuotation } from "@/lib/services/sales-quotation.service";

export default function EditExpertQuotationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quotation, setQuotation] = useState<SalesQuotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadQuotation() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getSalesQuotation(params.id);
        if (mounted) setQuotation(data);
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadQuotation();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const handleSubmit = async (payload: UpdateSalesQuotationPayload) => {
    setIsSubmitting(true);
    try {
      const updated = await updateSalesQuotation(params.id, payload);
      const result = payload.status === "finalized"
        ? await finalizeSalesQuotation(updated.objectId)
        : updated;
      router.push(`/expert/quotations/${result.objectId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="expert" title="ویرایش درخواست فروش">
      {isLoading ? (
        <LoadingState title="در حال دریافت درخواست فروش" />
      ) : error ? (
        <PageErrorMessage title="دریافت درخواست فروش انجام نشد" message={error} />
      ) : !quotation ? (
        <EmptyState title="درخواست فروش یافت نشد" description="رکوردی برای این شناسه وجود ندارد." />
      ) : quotation.status !== "draft" ? (
        <PageErrorMessage title="این درخواست فروش قابل ویرایش نیست" message="فقط پیش‌نویس‌ها قابل تغییر هستند." />
      ) : (
        <QuotationForm
          mode="edit"
          initialQuotation={quotation}
          submitLabel="ذخیره پیش‌نویس"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      )}
    </DashboardLayout>
  );
}
