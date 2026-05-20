"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { getErrorMessage } from "@/lib/api/api-error";
import {
  ProductForm,
  type UpdateProductFormInput,
} from "@/components/support/product-form";
import type { Product } from "@/lib/models/product.model";
import { getProduct, updateProduct } from "@/lib/services/product.service";
import { toNumber } from "@/lib/utils/number-format";
import { useParams, useRouter } from "next/navigation";

export default function SupportEditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const objectId = decodeURIComponent(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      setMessage("");

      try {
        const data = await getProduct(objectId);
        if (isMounted) setProduct(data);
      } catch (error) {
        if (isMounted) {
          setMessageType("error");
          setMessage(getErrorMessage(error));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [objectId]);

  if (isLoading) {
    return (
      <DashboardLayout role="support" title="ویرایش کالا">
        <LoadingState
          title="در حال دریافت کالا"
          description="اطلاعات کالا از سرور دریافت می شود."
        />
      </DashboardLayout>
    );
  }

  if (!product && message) {
    return (
      <DashboardLayout role="support" title="ویرایش کالا">
        <InlineErrorMessage message={message} />
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout role="support" title="ویرایش کالا">
        <EmptyState title="کالا یافت نشد" description="شناسه کالا معتبر نیست." />
      </DashboardLayout>
    );
  }

  const onSubmit = async (input: UpdateProductFormInput) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      await updateProduct(objectId, {
        name: input.name.trim(),
        brand: input.brand.trim(),
        category: input.category.trim(),
        unit: input.unit.trim(),
        unitPrice: toNumber(input.unitPrice),
        description: input.description?.trim() || undefined,
        status: input.status,
      });

      setMessageType("success");
      setMessage("اطلاعات کالا به روز شد.");
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
    <DashboardLayout role="support" title="ویرایش کالا">
      <SectionHeader
        title="ویرایش اطلاعات کالا"
        description="اطلاعات پایه، موجودی و وضعیت کالا را به‌روزرسانی کنید"
      />

      {message && messageType === "success" ? (
        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">
          {message}
        </div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}
      <ProductForm
        mode="edit"
        initialValues={{
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          unit: product.unit,
          unitPrice: product.unitPrice,
          description: product.description ?? undefined,
          status: product.status,
        }}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/support/products")}
      />
    </DashboardLayout>
  );
}
