"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { getErrorMessage } from "@/lib/api/api-error";
import {
  NajaCenterForm,
  type NajaCenterFormInput,
} from "@/components/naja/naja-center-form";
import type { NajaCenter } from "@/lib/models/naja-center.model";
import { getNajaCenter, updateNajaCenter } from "@/lib/services/naja-center.service";

export default function NajaEditCenterPage() {
  const params = useParams<{ objectId: string }>();
  const router = useRouter();
  const objectId = decodeURIComponent(params.objectId);
  const [center, setCenter] = useState<NajaCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  useEffect(() => {
    let isMounted = true;

    async function loadCenter() {
      setIsLoading(true);
      setMessage("");

      try {
        const data = await getNajaCenter(objectId);
        if (isMounted) setCenter(data);
      } catch (error) {
        if (isMounted) {
          setMessageType("error");
          setMessage(getErrorMessage(error));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCenter();

    return () => {
      isMounted = false;
    };
  }, [objectId]);

  if (isLoading) {
    return (
      <DashboardLayout role="naja" title="ویرایش مرکز ناجا">
        <LoadingState title="در حال دریافت مرکز ناجا" description="اطلاعات مرکز از سرور دریافت می شود." />
      </DashboardLayout>
    );
  }

  if (!center && message) {
    return (
      <DashboardLayout role="naja" title="ویرایش مرکز ناجا">
        <InlineErrorMessage message={message} />
      </DashboardLayout>
    );
  }

  if (!center) {
    return (
      <DashboardLayout role="naja" title="ویرایش مرکز ناجا">
        <EmptyState title="مرکز ناجا یافت نشد" description="شناسه مرکز معتبر نیست." />
      </DashboardLayout>
    );
  }

  const onSubmit = async (input: NajaCenterFormInput) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      await updateNajaCenter(objectId, {
        name: input.name.trim(),
        responsibleName: input.responsibleName.trim(),
        phone: input.phone.trim(),
        province: input.province.trim(),
        city: input.city.trim(),
        county: input.county.trim(),
        centerCode: input.centerCode.trim(),
        fullAddress: input.fullAddress.trim(),
        status: input.status,
      });

      setMessageType("success");
      setMessage("اطلاعات مرکز ناجا به روز شد.");
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
    <DashboardLayout role="naja" title="ویرایش مرکز ناجا">
      {message && messageType === "success" ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}
      <NajaCenterForm
        mode="edit"
        initialValues={{
          name: center.name,
          responsibleName: center.responsibleName,
          phone: center.phone,
          province: center.province,
          city: center.city,
          county: center.county,
          centerCode: center.centerCode,
          fullAddress: center.fullAddress,
          status: center.status,
        }}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/naja/centers")}
      />
    </DashboardLayout>
  );
}
