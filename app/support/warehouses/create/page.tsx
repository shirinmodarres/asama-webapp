"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import {
  WarehouseForm,
  type WarehouseFormInput,
} from "@/components/warehouse/warehouse-form";
import { getErrorMessage } from "@/lib/api/api-error";
import { createWarehouse } from "@/lib/services/warehouse.service";

export default function CreateWarehousePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (input: WarehouseFormInput) => {
    setError("");
    setIsSubmitting(true);
    try {
      await createWarehouse(input);
      router.push("/support/warehouses");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="تعریف انبار">
      <SectionHeader title="تعریف انبار" description="ثبت انبار جدید برای موجودی چندانباره" />
      {error ? <InlineErrorMessage message={error} /> : null}
      <WarehouseForm
        mode="create"
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onCancel={() => router.push("/support/warehouses")}
      />
    </DashboardLayout>
  );
}
