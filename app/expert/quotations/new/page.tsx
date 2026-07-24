"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { QuotationForm } from "@/components/quotations/quotation-form";
import type { CreateSalesQuotationPayload } from "@/lib/models/sales-quotation.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { createSalesQuotation } from "@/lib/services/sales-quotation.service";

export default function NewExpertQuotationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: CreateSalesQuotationPayload) => {
    setIsSubmitting(true);
    try {
      const quotation = await createSalesQuotation({
        ...payload,
        status: payload.status || "draft",
      });
      router.push(`/expert/quotations/${quotation.objectId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="expert" title="پیش فاکتور جدید">
      <QuotationForm
        mode="create"
        submitLabel="ذخیره پیش نویس"
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
}

