"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { MagazinePostForm } from "@/components/shop/magazine-post-form";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  WebsiteMagazinePost,
  WebsiteMagazinePostPayload,
} from "@/lib/models/shop.model";
import {
  getWebsiteMagazinePost,
  updateWebsiteMagazinePost,
} from "@/lib/services/shop-admin.service";

export default function EditMagazinePostPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [post, setPost] = useState<WebsiteMagazinePost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    searchParams.get("created") ? "مقاله ایجاد شد." : "",
  );

  useEffect(() => {
    let isMounted = true;
    async function loadPost() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getWebsiteMagazinePost(params.id);
        if (isMounted) setPost(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadPost();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const handleSubmit = async (payload: WebsiteMagazinePostPayload) => {
    if (!post) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateWebsiteMagazinePost(post.objectId, payload);
      setPost(updated);
      setMessage("تغییرات مقاله ذخیره شد.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ویرایش مقاله">
      {isLoading ? (
        <LoadingState title="در حال دریافت مقاله" />
      ) : !post && error ? (
        <InlineErrorMessage message={error} />
      ) : !post ? (
        <EmptyState
          title="مقاله پیدا نشد"
          description="شناسه مقاله معتبر نیست یا رکوردی برای آن وجود ندارد."
        />
      ) : (
        <>
          <SectionHeader
            title="ویرایش مقاله"
            description="محتوا، وضعیت انتشار و فیلدهای سئوی مقاله را به‌روزرسانی کنید."
            actions={
              <Button asChild variant="outline">
                <Link href="/support/shop/magazine">بازگشت به لیست مقاله‌ها</Link>
              </Button>
            }
          />
          {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
          {error ? <InlineErrorMessage message={error} /> : null}
          <MagazinePostForm
            post={post}
            submitLabel="ذخیره تغییرات"
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </DashboardLayout>
  );
}
