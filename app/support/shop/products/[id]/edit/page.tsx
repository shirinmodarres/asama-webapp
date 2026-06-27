"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { WebsiteProductForm } from "@/components/shop/website-product-form";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  WebsiteProduct,
  WebsiteProductPayload,
} from "@/lib/models/shop.model";
import {
  getWebsiteProduct,
  updateWebsiteProduct,
} from "@/lib/services/shop-admin.service";

export default function EditWebsiteProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<WebsiteProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getWebsiteProduct(params.id);
        if (isMounted) setProduct(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const handleSubmit = async (payload: WebsiteProductPayload) => {
    if (!product) return;
    setIsSubmitting(true);
    setError("");
    try {
      const updated = await updateWebsiteProduct(product.objectId, payload);
      router.push(`/support/shop/products/${updated.objectId}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ویرایش محصول سایت">
      {isLoading ? (
        <LoadingState title="در حال دریافت محصول سایت" />
      ) : !product && error ? (
        <InlineErrorMessage message={error} />
      ) : !product ? (
        <EmptyState
          title="محصول سایت پیدا نشد"
          description="شناسه محصول معتبر نیست یا رکوردی برای آن وجود ندارد."
        />
      ) : (
        <>
          <SectionHeader
            title="ویرایش محصول سایت"
            description="اطلاعات نمایش، قیمت و موجودی محصول سایت را به‌روزرسانی کنید."
            actions={
              <Button asChild variant="outline">
                <Link href={`/support/shop/products/${product.objectId}`}>
                  بازگشت به جزئیات
                </Link>
              </Button>
            }
          />
          {error ? <InlineErrorMessage message={error} /> : null}
          <WebsiteProductForm
            product={product}
            submitLabel="ذخیره تغییرات"
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </DashboardLayout>
  );
}
