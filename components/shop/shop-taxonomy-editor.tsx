"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ShopTaxonomyForm } from "@/components/shop/shop-taxonomy-form";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  WebsiteBrand,
  WebsiteBrandPayload,
  WebsiteCategory,
  WebsiteCategoryPayload,
} from "@/lib/models/shop.model";
import {
  createWebsiteBrand,
  createWebsiteCategory,
  getWebsiteBrand,
  getWebsiteCategory,
  listWebsiteCategories,
  updateWebsiteBrand,
  updateWebsiteCategory,
} from "@/lib/services/shop-admin.service";

export function ShopTaxonomyEditor({
  kind,
  mode,
}: {
  kind: "brands" | "categories";
  mode: "new" | "edit";
}) {
  const isBrands = kind === "brands";
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<WebsiteBrand | WebsiteCategory | null>(null);
  const [categories, setCategories] = useState<WebsiteCategory[]>([]);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      !isBrands ? listWebsiteCategories(true) : Promise.resolve([]),
      mode === "edit"
        ? (isBrands ? getWebsiteBrand(params.id) : getWebsiteCategory(params.id))
        : Promise.resolve(null),
    ])
      .then(([categoryItems, current]) => {
        if (!mounted) return;
        setCategories(categoryItems);
        setItem(current);
      })
      .catch((cause) => mounted && setError(getErrorMessage(cause)))
      .finally(() => mounted && setIsLoading(false));
    return () => { mounted = false; };
  }, [isBrands, mode, params.id]);

  const submit = async (payload: WebsiteBrandPayload | WebsiteCategoryPayload) => {
    setIsSubmitting(true);
    setError("");
    try {
      if (isBrands) {
        if (mode === "new") await createWebsiteBrand(payload as WebsiteBrandPayload);
        else await updateWebsiteBrand(params.id, payload as WebsiteBrandPayload);
      } else if (mode === "new") {
        await createWebsiteCategory(payload as WebsiteCategoryPayload);
      } else {
        await updateWebsiteCategory(params.id, payload as WebsiteCategoryPayload);
      }
      router.push(`/support/shop/${kind}`);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  const label = isBrands ? "برند" : "دسته‌بندی";
  return (
    <DashboardLayout role="support" title={`${mode === "new" ? "ایجاد" : "ویرایش"} ${label}`}>
      <SectionHeader
        title={`${mode === "new" ? "ایجاد" : "ویرایش"} ${label}`}
        actions={
          <Button asChild variant="outline"><Link href={`/support/shop/${kind}`}>بازگشت</Link></Button>
        }
      />
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? (
        <LoadingState title="در حال دریافت اطلاعات" />
      ) : (
        <ShopTaxonomyForm
          kind={isBrands ? "brand" : "category"}
          item={item}
          categories={categories}
          isSubmitting={isSubmitting}
          onSubmit={submit}
        />
      )}
    </DashboardLayout>
  );
}
