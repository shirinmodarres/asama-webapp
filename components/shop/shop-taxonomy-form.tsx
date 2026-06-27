"use client";

import { useMemo, useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  WebsiteBrand,
  WebsiteBrandPayload,
  WebsiteCategory,
  WebsiteCategoryPayload,
} from "@/lib/models/shop.model";
import { normalizeSlug } from "@/lib/services/shop-admin.service";
import { toNumber } from "@/lib/utils/number-format";

type TaxonomyKind = "brand" | "category";
type Taxonomy = WebsiteBrand | WebsiteCategory;
type TaxonomyPayload = WebsiteBrandPayload | WebsiteCategoryPayload;

export function ShopTaxonomyForm({
  kind,
  item,
  categories = [],
  isSubmitting,
  onSubmit,
}: {
  kind: TaxonomyKind;
  item?: Taxonomy | null;
  categories?: WebsiteCategory[];
  isSubmitting: boolean;
  onSubmit: (payload: TaxonomyPayload) => Promise<void>;
}) {
  const category = kind === "category" ? (item as WebsiteCategory | undefined) : undefined;
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [media, setMedia] = useState(
    kind === "brand" ? (item as WebsiteBrand | undefined)?.logo ?? "" : category?.image ?? "",
  );
  const [parentCategoryId, setParentCategoryId] = useState(category?.parentCategoryId ?? "none");
  const [sortOrder, setSortOrder] = useState(String(item?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const parentOptions = useMemo(
    () => categories.filter((entry) => entry.objectId !== item?.objectId && entry.isActive),
    [categories, item?.objectId],
  );

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = "عنوان الزامی است.";
    if (!normalizeSlug(slug || title)) nextErrors.slug = "اسلاگ معتبر نیست.";
    if (toNumber(sortOrder) < 0) nextErrors.sortOrder = "ترتیب نمایش معتبر نیست.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const base = {
      title: title.trim(),
      slug: normalizeSlug(slug || title),
      description: description.trim() || null,
      isActive,
      sortOrder: toNumber(sortOrder),
    };
    await onSubmit(
      kind === "brand"
        ? { ...base, logo: media.trim() || null }
        : {
            ...base,
            image: media.trim() || null,
            parentCategoryId: parentCategoryId === "none" ? null : parentCategoryId,
          },
    );
  };

  return (
    <Card className="p-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="عنوان" error={errors.title}>
          <Input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slug) setSlug(normalizeSlug(event.target.value));
            }}
          />
        </Field>
        <Field label="اسلاگ" error={errors.slug}>
          <Input dir="ltr" value={slug} onChange={(event) => setSlug(event.target.value)} />
        </Field>
        <Field label={kind === "brand" ? "لوگو" : "تصویر"}>
          <Input
            dir="ltr"
            value={media}
            onChange={(event) => setMedia(event.target.value)}
            placeholder="URL تصویر"
          />
        </Field>
        <Field label="ترتیب نمایش" error={errors.sortOrder}>
          <Input
            inputMode="numeric"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </Field>
        {kind === "category" ? (
          <Field label="دسته‌بندی والد">
            <Select value={parentCategoryId} onValueChange={setParentCategoryId}>
              <SelectTrigger><SelectValue placeholder="بدون والد" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون والد</SelectItem>
                {parentOptions.map((entry) => (
                  <SelectItem key={entry.objectId} value={entry.objectId}>{entry.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        <Field label="توضیحات">
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <label className="flex items-center gap-3 text-sm font-medium text-[#334155]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="size-4 accent-[#1F3A5F]"
          />
          فعال
        </label>
      </div>
      <Button type="button" className="mt-6" disabled={isSubmitting} onClick={submit}>
        {isSubmitting ? "در حال ذخیره..." : "ذخیره"}
      </Button>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      {children}
      <FieldError message={error} />
    </label>
  );
}
