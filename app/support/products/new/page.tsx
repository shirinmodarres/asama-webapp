"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  ProductForm,
  type CreateProductFormInput,
} from "@/components/support/product-form";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { getErrorMessage } from "@/lib/api/api-error";
import { createProduct } from "@/lib/services/product.service";
import { normalizeDigits, toNumber } from "@/lib/utils/number-format";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SupportCreateProductPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (input: CreateProductFormInput) => {
    setIsSubmitting(true);
    setMessage("");
    setMessageType("error");

    try {
      await createProduct({
        id: normalizeDigits(input.id.trim()),
        name: input.name.trim(),
        brand: input.brand.trim(),
        category: input.category.trim(),
        unit: input.unit.trim(),
        unitPrice: toNumber(input.unitPrice),
        description: input.description?.trim() || undefined,
        status: input.status,
        totalStock: toNumber(input.totalStock),
      });

      setMessageType("success");
      setMessage("کالا با موفقیت ثبت شد.");
      setTimeout(() => {
        router.push("/support/products");
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
    <DashboardLayout role="support" title="تعریف کالا">
      <SectionHeader
        title="تعریف کالای جدید"
        description="اطلاعات پایه و تنظیمات اولیه کالا را وارد کنید"
      />

      {message && messageType === "success" ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}
      <ProductForm
        mode="create"
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/support/products")}
      />
    </DashboardLayout>
  );
}
