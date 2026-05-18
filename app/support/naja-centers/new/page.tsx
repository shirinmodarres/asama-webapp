"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  NajaCenterForm,
  type NajaCenterFormInput,
} from "@/components/naja/naja-center-form";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { getErrorMessage } from "@/lib/api/api-error";
import { createNajaCenter } from "@/lib/services/naja-center.service";

export default function SupportCreateNajaCenterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (input: NajaCenterFormInput) => {
    setError("");
    setIsSubmitting(true);
    try {
      await createNajaCenter({
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
    <DashboardLayout role="support" title="تعریف مرکز ناجا">
      {error ? <InlineErrorMessage message={error} /> : null}
      <NajaCenterForm
        mode="create"
        onSubmit={submit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/support/naja-centers")}
      />
    </DashboardLayout>
  );
}
