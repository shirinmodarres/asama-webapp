"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import {
  WarehouseForm,
  type WarehouseFormInput,
} from "@/components/warehouse/warehouse-form";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Warehouse } from "@/lib/models/warehouse.model";
import { getWarehouse, updateWarehouse } from "@/lib/services/warehouse.service";

export default function EditWarehousePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadWarehouse() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getWarehouse(params.id);
        if (isMounted) setWarehouse(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadWarehouse();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const submit = async (input: WarehouseFormInput) => {
    if (!warehouse) return;
    setError("");
    setIsSubmitting(true);
    try {
      await updateWarehouse(warehouse.objectId, input);
      router.push("/support/warehouses");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ویرایش انبار">
      <SectionHeader title="ویرایش انبار" description="اصلاح نوع، وضعیت و سفارش‌های مجاز" />
      {isLoading ? (
        <LoadingState title="در حال دریافت انبار" />
      ) : error && !warehouse ? (
        <PageErrorMessage title="دریافت انبار انجام نشد" message={error} />
      ) : !warehouse ? (
        <EmptyState title="انبار یافت نشد" description="شناسه انبار معتبر نیست." />
      ) : (
        <>
          {error ? <InlineErrorMessage message={error} /> : null}
          <WarehouseForm
            mode="edit"
            initialValues={warehouse}
            isSubmitting={isSubmitting}
            onSubmit={submit}
            onCancel={() => router.push("/support/warehouses")}
          />
        </>
      )}
    </DashboardLayout>
  );
}
