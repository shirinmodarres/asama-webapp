"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { WebsiteProductForm } from "@/components/shop/website-product-form";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { WebsiteProductPayload } from "@/lib/models/shop.model";
import { createWebsiteProduct } from "@/lib/services/shop-admin.service";

export default function NewWebsiteProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (payload: WebsiteProductPayload) => {
    setIsSubmitting(true);
    setError("");
    try {
      const product = await createWebsiteProduct(payload);
      router.push(`/support/shop/products/${product.objectId}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ایجاد محصول سایت">
      <SectionHeader
        title="ایجاد محصول سایت"
        description="اطلاعات محصولی را که در فروشگاه عمومی نمایش داده می‌شود وارد کنید."
        actions={
          <Button asChild variant="outline">
            <Link href="/support/shop/products">بازگشت به محصولات سایت</Link>
          </Button>
        }
      />
      {error ? <InlineErrorMessage message={error} /> : null}
      <WebsiteProductForm
        submitLabel="ایجاد محصول سایت"
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
}
