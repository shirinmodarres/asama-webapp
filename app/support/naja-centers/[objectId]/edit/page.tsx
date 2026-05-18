"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  NajaCenterForm,
  type NajaCenterFormInput,
} from "@/components/naja/naja-center-form";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { getErrorMessage } from "@/lib/api/api-error";
import type { NajaCenter } from "@/lib/models/naja-center.model";
import {
  getNajaCenter,
  updateNajaCenter,
} from "@/lib/services/naja-center.service";

export default function SupportEditNajaCenterPage() {
  const params = useParams<{ objectId: string }>();
  const router = useRouter();
  const [center, setCenter] = useState<NajaCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadCenter() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getNajaCenter(params.objectId);
        if (isMounted) setCenter(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCenter();
    return () => {
      isMounted = false;
    };
  }, [params.objectId]);

  const submit = async (input: NajaCenterFormInput) => {
    if (!center) return;
    setError("");
    setIsSubmitting(true);
    try {
      await updateNajaCenter(center.objectId, {
        name: input.name.trim(),
        responsibleName: input.responsibleName.trim(),
        phone: input.phone.trim(),
        secondaryPhone: input.secondaryPhone?.trim() || null,
        landlinePhone: input.landlinePhone?.trim() || null,
        province: input.province.trim(),
        city: input.city.trim(),
        county: input.county.trim(),
        centerCode: input.centerCode.trim(),
        fullAddress: input.fullAddress.trim(),
        status: input.status,
      });
      router.push("/support/naja-centers");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ویرایش مرکز ناجا">
      {isLoading ? (
        <LoadingState title="در حال دریافت مرکز ناجا" />
      ) : error && !center ? (
        <PageErrorMessage title="دریافت مرکز انجام نشد" message={error} />
      ) : !center ? (
        <EmptyState title="مرکز یافت نشد" description="شناسه مرکز معتبر نیست." />
      ) : (
        <>
          {error ? <InlineErrorMessage message={error} /> : null}
          <NajaCenterForm
            mode="edit"
            initialValues={{
              name: center.name,
              responsibleName: center.responsibleName,
              phone: center.phone,
              secondaryPhone: center.secondaryPhone,
              landlinePhone: center.landlinePhone,
              province: center.province,
              city: center.city,
              county: center.county,
              centerCode: center.centerCode,
              fullAddress: center.fullAddress,
              status: center.status,
            }}
            onSubmit={submit}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/support/naja-centers")}
          />
        </>
      )}
    </DashboardLayout>
  );
}
