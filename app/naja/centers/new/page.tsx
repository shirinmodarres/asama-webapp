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

export default function NajaCreateCenterPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (input: NajaCenterFormInput) => {
    setIsSubmitting(true);
    setMessage("");
    setMessageType("error");

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

      setMessageType("success");
      setMessage("مرکز ناجا با موفقیت ثبت شد.");
      setTimeout(() => {
        router.push("/naja/centers");
        router.refresh();
      }, 700);
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="naja" title="تعریف مرکز">
      {message && messageType === "success" ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}
      <NajaCenterForm
        mode="create"
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/naja/centers")}
      />
    </DashboardLayout>
  );
}
