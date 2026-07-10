"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { MagazinePostForm } from "@/components/shop/magazine-post-form";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { WebsiteMagazinePostPayload } from "@/lib/models/shop.model";
import { createWebsiteMagazinePost } from "@/lib/services/shop-admin.service";

export default function NewMagazinePostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (payload: WebsiteMagazinePostPayload) => {
    setIsSubmitting(true);
    setError("");
    try {
      const post = await createWebsiteMagazinePost(payload);
      router.push(`/support/shop/magazine/${post.objectId}/edit?created=1`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ایجاد مقاله">
      <SectionHeader
        title="ایجاد مقاله"
        description="مقاله مجله سایت را با محتوای RTL و فیلدهای آماده سئو ثبت کنید."
        actions={
          <Button asChild variant="outline">
            <Link href="/support/shop/magazine">بازگشت به لیست مقاله‌ها</Link>
          </Button>
        }
      />
      {error ? <InlineErrorMessage message={error} /> : null}
      <MagazinePostForm
        submitLabel="ایجاد مقاله"
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
}
