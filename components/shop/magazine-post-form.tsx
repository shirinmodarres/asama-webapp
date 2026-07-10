"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  WebsiteMagazineCategorySummary,
  WebsiteMagazinePost,
  WebsiteMagazinePostPayload,
  WebsiteMagazinePostStatus,
  WebsiteMagazineTagSummary,
  WebsiteProduct,
} from "@/lib/models/shop.model";
import {
  listWebsiteMagazineCategories,
  listWebsiteMagazinePosts,
  listWebsiteMagazineTags,
  listWebsiteProducts,
  normalizeSlug,
} from "@/lib/services/shop-admin.service";
import { formatFaDigits, toNumber } from "@/lib/utils/number-format";

const STATUS_OPTIONS: Array<{ value: WebsiteMagazinePostStatus; label: string }> = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "archived", label: "آرشیوشده" },
];

export function MagazinePostForm({
  post,
  submitLabel,
  isSubmitting,
  onSubmit,
}: {
  post?: WebsiteMagazinePost | null;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (payload: WebsiteMagazinePostPayload) => Promise<void>;
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(post?.slug));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [tagsText, setTagsText] = useState((post?.tags ?? []).join(", "));
  const [authorName, setAuthorName] = useState(post?.authorName ?? "");
  const [status, setStatus] = useState<WebsiteMagazinePostStatus>(
    post?.status ?? "draft",
  );
  const [isFeatured, setIsFeatured] = useState(post?.isFeatured ?? false);
  const [publishedAt, setPublishedAt] = useState(toDateTimeInput(post?.publishedAt));
  const [publishedAtFa, setPublishedAtFa] = useState(toJalaliInput(post?.publishedAt));
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(
    String(post?.readingTimeMinutes ?? 1),
  );
  const [sortOrder, setSortOrder] = useState(String(post?.sortOrder ?? 0));
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>(
    post?.relatedProductIds ?? [],
  );
  const [relatedCategorySlugsText, setRelatedCategorySlugsText] = useState(
    (post?.relatedCategorySlugs ?? []).join(", "),
  );
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    post?.metaDescription ?? "",
  );
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");
  const [ogTitle, setOgTitle] = useState(post?.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(post?.ogDescription ?? "");
  const [ogImage, setOgImage] = useState(post?.ogImage ?? "");
  const [noIndex, setNoIndex] = useState(post?.noIndex ?? false);
  const [products, setProducts] = useState<WebsiteProduct[]>(post?.relatedProducts ?? []);
  const [categories, setCategories] = useState<WebsiteMagazineCategorySummary[]>([]);
  const [knownTags, setKnownTags] = useState<WebsiteMagazineTagSummary[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productLoadError, setProductLoadError] = useState("");
  const [taxonomyLoadError, setTaxonomyLoadError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const [data, categoryItems, tagItems] = await Promise.all([
          listWebsiteProducts(),
          listWebsiteMagazineCategories(),
          listWebsiteMagazineTags(),
        ]);
        if (!isMounted) return;
        setProducts((current) => mergeProducts(current, data));
        setCategories(categoryItems);
        setKnownTags(tagItems);
      } catch (loadError) {
        if (isMounted) {
          setProductLoadError(getErrorMessage(loadError));
          setTaxonomyLoadError(getErrorMessage(loadError));
        }
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.objectId,
        label: product.title || product.sku || product.objectId,
        description: product.sku ? `SKU: ${formatFaDigits(product.sku)}` : undefined,
        searchText: [product.title, product.slug, product.sku].join(" "),
      })),
    [products],
  );

  const relatedProducts = useMemo(
    () =>
      relatedProductIds.map((id) => {
        const product = products.find((item) => item.objectId === id);
        return {
          id,
          title: product?.title || id,
          sku: product?.sku ?? "",
        };
      }),
    [products, relatedProductIds],
  );

  const tags = useMemo(() => parseCommaList(tagsText), [tagsText]);

  const submit = async (nextStatus = status) => {
    const normalizedSlug = normalizeSlug(slug || title);
    const relatedCategorySlugs = parseCommaList(relatedCategorySlugsText).map(
      normalizeSlug,
    );
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) nextErrors.title = "عنوان مقاله الزامی است.";
    if (!normalizedSlug) nextErrors.slug = "اسلاگ الزامی است.";
    const nextPublishedAt = publishedAt || parseJalaliInputToIso(publishedAtFa);
    if (nextStatus === "published") {
      if (!excerpt.trim()) nextErrors.excerpt = "خلاصه برای انتشار الزامی است.";
      if (!content.trim()) nextErrors.content = "محتوا برای انتشار الزامی است.";
      if (!nextPublishedAt) nextErrors.publishedAt = "تاریخ انتشار الزامی است.";
    }
    if (publishedAtFa.trim() && !nextPublishedAt) {
      nextErrors.publishedAt = "تاریخ شمسی را با قالب ۱۴۰۳/۰۵/۱۵ ۱۲:۳۰ وارد کنید.";
    }
    if (toNumber(readingTimeMinutes) <= 0) {
      nextErrors.readingTimeMinutes = "زمان مطالعه باید بزرگ‌تر از صفر باشد.";
    }
    if (toNumber(sortOrder) < 0) {
      nextErrors.sortOrder = "ترتیب نمایش معتبر نیست.";
    }
    if (metaTitle.length > 60) {
      nextErrors.metaTitle = "پیشنهاد سئو: عنوان بهتر است حداکثر ۶۰ کاراکتر باشد.";
    }
    if (metaDescription.length > 160) {
      nextErrors.metaDescription =
        "پیشنهاد سئو: توضیح بهتر است حداکثر ۱۶۰ کاراکتر باشد.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const isUnique = await checkSlugUnique(normalizedSlug, post?.objectId);
    if (!isUnique) {
      setErrors({ slug: "این اسلاگ قبلا برای مقاله دیگری ثبت شده است." });
      return;
    }

    await onSubmit({
      title: title.trim(),
      slug: normalizedSlug,
      excerpt: excerpt.trim(),
      content: content.trim(),
      coverImage: coverImage.trim(),
      category: category.trim(),
      tags,
      authorName: authorName.trim(),
      status: nextStatus,
      isFeatured,
      publishedAt: nextPublishedAt ? new Date(nextPublishedAt).toISOString() : null,
      readingTimeMinutes: toNumber(readingTimeMinutes),
      sortOrder: toNumber(sortOrder),
      relatedProductIds,
      relatedCategorySlugs: relatedCategorySlugs.filter(Boolean),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      canonicalUrl: canonicalUrl.trim(),
      ogTitle: ogTitle.trim(),
      ogDescription: ogDescription.trim(),
      ogImage: ogImage.trim(),
      noIndex,
    });
  };

  return (
    <Card className="min-w-0 overflow-x-hidden p-5">
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Field label="عنوان مقاله" error={errors.title}>
          <Input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugEdited) setSlug(normalizeSlug(event.target.value));
            }}
          />
        </Field>
        <Field label="اسلاگ" error={errors.slug}>
          <Input
            dir="ltr"
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(normalizeSlug(event.target.value));
            }}
          />
        </Field>
        <Field label="خلاصه کوتاه" error={errors.excerpt} className="lg:col-span-2">
          <Textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            className="min-h-28"
          />
        </Field>
        <Field label="تصویر کاور">
          <Input
            dir="ltr"
            value={coverImage}
            onChange={(event) => setCoverImage(event.target.value)}
            placeholder="URL تصویر"
          />
        </Field>
        <Field label="دسته‌بندی مقاله">
          <Input
            value={category}
            list="magazine-category-options"
            onChange={(event) => setCategory(event.target.value)}
            placeholder="انتخاب یا تایپ دسته‌بندی جدید"
          />
          <datalist id="magazine-category-options">
            {categories.map((item) => (
              <option key={item.category} value={item.category} />
            ))}
          </datalist>
        </Field>
        <Field label="تگ‌ها">
          <div className="grid gap-2">
            <div className="flex min-w-0 flex-wrap gap-2 sm:flex-nowrap">
              <Input
                value={tagInput}
                list="magazine-tag-options"
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  addTag(tagInput, tags, setTagsText, setTagInput);
                }}
                placeholder="انتخاب یا تایپ تگ"
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addTag(tagInput, tags, setTagsText, setTagInput)}
              >
                افزودن
              </Button>
            </div>
            <datalist id="magazine-tag-options">
              {knownTags.map((item) => (
                <option key={item.tag} value={item.tag} />
              ))}
            </datalist>
            {tags.length ? (
              <div className="flex min-w-0 flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="neutral" className="max-w-full gap-2">
                    <span className="min-w-0 truncate">#{tag}</span>
                    <button
                      type="button"
                      aria-label="حذف تگ"
                      onClick={() =>
                        setTagsText(tags.filter((item) => item !== tag).join(", "))
                      }
                      className="rounded-full hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </Field>
        <Field label="نویسنده">
          <Input
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
          />
        </Field>
        <Field label="وضعیت انتشار">
          <SearchableSelect
            value={status}
            onValueChange={(value) => setStatus(value as WebsiteMagazinePostStatus)}
            options={STATUS_OPTIONS}
            placeholder="انتخاب وضعیت"
          />
        </Field>
        <Field label="تاریخ انتشار" error={errors.publishedAt}>
          <Input
            dir="ltr"
            value={publishedAtFa}
            placeholder="۱۴۰۳/۰۵/۱۵ ۱۲:۳۰"
            onChange={(event) => {
              setPublishedAtFa(event.target.value);
              const isoValue = parseJalaliInputToIso(event.target.value);
              setPublishedAt(isoValue ? isoValue.slice(0, 16) : "");
            }}
          />
          <Input
            dir="ltr"
            type="datetime-local"
            value={publishedAt}
            onChange={(event) => setPublishedAt(event.target.value)}
            className="sr-only"
          />
        </Field>
        <Field label="زمان مطالعه" error={errors.readingTimeMinutes}>
          <Input
            inputMode="numeric"
            value={readingTimeMinutes}
            onChange={(event) => setReadingTimeMinutes(event.target.value)}
          />
        </Field>
        <Field label="ترتیب نمایش" error={errors.sortOrder}>
          <Input
            inputMode="numeric"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm font-medium text-[#334155]">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
            className="size-4 accent-[#1F3A5F]"
          />
          مقاله ویژه
        </label>
        <Field label="محتوای مقاله" error={errors.content} className="lg:col-span-2">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[460px] leading-8"
          />
        </Field>
      </div>
      {taxonomyLoadError ? <InlineErrorMessage message={taxonomyLoadError} /> : null}

      <section className="mt-6 min-w-0 overflow-x-hidden rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-4">
        <h2 className="text-sm font-semibold text-[#102034]">ارتباط با فروشگاه</h2>
        <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Field label="محصولات مرتبط">
            <SearchableSelect
              value={selectedProductId}
              onValueChange={setSelectedProductId}
              options={productOptions}
              placeholder="انتخاب محصول"
              searchPlaceholder="جستجو در محصولات"
              emptyMessage="محصولی پیدا نشد"
              normalizeSearch
            />
          </Field>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedProductId}
            onClick={() => {
              setRelatedProductIds((current) =>
                current.includes(selectedProductId)
                  ? current
                  : [...current, selectedProductId],
              );
              setSelectedProductId("");
            }}
          >
            <PlusCircle className="size-4" />
            افزودن
          </Button>
        </div>
        {productLoadError ? (
          <InlineErrorMessage message={productLoadError} />
        ) : null}
        {relatedProducts.length ? (
          <div className="mt-4 flex min-w-0 flex-wrap gap-2">
            {relatedProducts.map((product) => (
              <Badge key={product.id} variant="brand" className="max-w-full gap-2">
                <span className="min-w-0 truncate">
                  {product.title}
                  {product.sku ? ` (${formatFaDigits(product.sku)})` : ""}
                </span>
                <button
                  type="button"
                  aria-label="حذف محصول مرتبط"
                  onClick={() =>
                    setRelatedProductIds((current) =>
                      current.filter((id) => id !== product.id),
                    )
                  }
                  className="rounded-full text-[#1F3A5F] hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-4">
          <Field label="دسته‌بندی‌های محصول مرتبط">
            <Input
              dir="ltr"
              value={relatedCategorySlugsText}
              onChange={(event) => setRelatedCategorySlugsText(event.target.value)}
              placeholder="mobile, accessories"
            />
          </Field>
        </div>
      </section>

      <section className="mt-6 min-w-0 overflow-x-hidden rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-4">
        <h2 className="text-sm font-semibold text-[#102034]">سئو</h2>
        <div className="mt-4 grid min-w-0 gap-5 lg:grid-cols-2">
          <Field label="عنوان سئو / metaTitle" error={errors.metaTitle}>
            <Input value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} />
          </Field>
          <Field label="ogTitle">
            <Input value={ogTitle} onChange={(event) => setOgTitle(event.target.value)} />
          </Field>
          <Field label="توضیح سئو / metaDescription" error={errors.metaDescription}>
            <Textarea
              value={metaDescription}
              onChange={(event) => setMetaDescription(event.target.value)}
            />
          </Field>
          <Field label="ogDescription">
            <Textarea
              value={ogDescription}
              onChange={(event) => setOgDescription(event.target.value)}
            />
          </Field>
          <Field label="canonicalUrl">
            <Input
              dir="ltr"
              value={canonicalUrl}
              onChange={(event) => setCanonicalUrl(event.target.value)}
            />
          </Field>
          <Field label="ogImage">
            <Input
              dir="ltr"
              value={ogImage}
              onChange={(event) => setOgImage(event.target.value)}
            />
          </Field>
          <label className="flex items-center gap-3 text-sm font-medium text-[#334155]">
            <input
              type="checkbox"
              checked={noIndex}
              onChange={(event) => setNoIndex(event.target.checked)}
              className="size-4 accent-[#1F3A5F]"
            />
            noIndex
          </label>
        </div>
      </section>

      <div className="mt-6 flex min-w-0 flex-wrap gap-3">
        <Button type="button" disabled={isSubmitting} onClick={() => submit(status)}>
          {isSubmitting ? "در حال ذخیره..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => submit("draft")}
        >
          ذخیره پیش‌نویس
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => submit("published")}
        >
          انتشار
        </Button>
      </div>
    </Card>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`grid min-w-0 gap-2 text-sm font-medium text-[#334155] ${className ?? ""}`}>
      <span>{label}</span>
      {children}
      <FieldError message={error} />
    </label>
  );
}

async function checkSlugUnique(slug: string, currentObjectId?: string): Promise<boolean> {
  const posts = await listWebsiteMagazinePosts({ search: slug });
  return !posts.some(
    (post) => post.slug === slug && post.objectId !== currentObjectId,
  );
}

function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function addTag(
  value: string,
  currentTags: string[],
  setTagsText: (value: string) => void,
  setTagInput: (value: string) => void,
) {
  const tag = value.trim();
  if (!tag) return;
  setTagsText(
    currentTags.includes(tag) ? currentTags.join(", ") : [...currentTags, tag].join(", "),
  );
  setTagInput("");
}

function toDateTimeInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function toJalaliInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}/${part("month")}/${part("day")} ${part("hour")}:${part("minute")}`;
}

function parseJalaliInputToIso(value: string): string | null {
  const normalized = normalizePersianDigits(value).trim();
  if (!normalized) return null;
  const match = normalized.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
  if (!match) return null;
  const [, year, month, day, hour = "0", minute = "0"] = match;
  const gregorian = jalaliToGregorian(Number(year), Number(month), Number(day));
  const date = new Date(
    gregorian.year,
    gregorian.month - 1,
    gregorian.day,
    Number(hour),
    Number(minute),
  );
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizePersianDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persian = "۰۱۲۳۴۵۶۷۸۹".indexOf(digit);
    if (persian >= 0) return String(persian);
    return String("٠١٢٣٤٥٦٧٨٩".indexOf(digit));
  });
}

function jalaliToGregorian(jy: number, jm: number, jd: number) {
  jy += 1595;
  let days =
    -355668 +
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const gd = days + 1;
  const leap =
    (gy % 4 === 0 && gy % 100 !== 0) ||
    gy % 400 === 0;
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  let dayOfMonth = gd;
  while (gm < 12 && dayOfMonth > monthDays[gm]) {
    dayOfMonth -= monthDays[gm];
    gm++;
  }
  return { year: gy, month: gm + 1, day: dayOfMonth };
}

function mergeProducts(
  existingProducts: WebsiteProduct[],
  nextProducts: WebsiteProduct[],
): WebsiteProduct[] {
  const byId = new Map<string, WebsiteProduct>();
  [...existingProducts, ...nextProducts].forEach((product) => {
    byId.set(product.objectId, product);
  });
  return Array.from(byId.values());
}
