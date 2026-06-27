"use client";

import { useEffect, useMemo, useState } from "react";
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
  WebsiteCategory,
  WebsiteProduct,
  WebsiteProductPayload,
} from "@/lib/models/shop.model";
import {
  listWebsiteBrands,
  listWebsiteCategories,
  normalizeSlug,
} from "@/lib/services/shop-admin.service";
import { toNumber } from "@/lib/utils/number-format";

interface WebsiteProductFormProps {
  product?: WebsiteProduct | null;
  isSubmitting?: boolean;
  submitLabel: string;
  onSubmit: (payload: WebsiteProductPayload) => Promise<void>;
}

type ProductFormState = {
  productRef: string;
  title: string;
  slug: string;
  sku: string;
  accountingItemCode: string;
  description: string;
  shortDescription: string;
  keyFeaturesForSite: string;
  technicalSpecsNote: string;
  price: string;
  salePrice: string;
  images: string;
  brandId: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  websiteStock: string;
  reservedStock: string;
  maxOrderQuantity: string;
  weight: string;
  length: string;
  width: string;
  height: string;
};

type SpecificationDraft = {
  rowId: string;
  title: string;
  value: string;
  unit: string;
  sortOrder: string;
};

export function WebsiteProductForm({
  product,
  isSubmitting = false,
  submitLabel,
  onSubmit,
}: WebsiteProductFormProps) {
  const [form, setForm] = useState<ProductFormState>(() =>
    createInitialState(product),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [specifications, setSpecifications] = useState<SpecificationDraft[]>(
    () => createInitialSpecifications(product),
  );
  const [brands, setBrands] = useState<WebsiteBrand[]>([]);
  const [categories, setCategories] = useState<WebsiteCategory[]>([]);
  const [taxonomyError, setTaxonomyError] = useState("");
  const imageLines = useMemo(
    () =>
      form.images
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [form.images],
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([listWebsiteBrands(true), listWebsiteCategories(true)])
      .then(([brandItems, categoryItems]) => {
        if (!mounted) return;
        setBrands(brandItems);
        setCategories(categoryItems);
      })
      .catch(() => mounted && setTaxonomyError("دریافت برندها و دسته‌بندی‌ها ناموفق بود."));
    return () => { mounted = false; };
  }, []);

  const updateField = <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !current.slug.trim()) {
        next.slug = normalizeSlug(String(value));
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm(form, specifications);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      productRef: form.productRef.trim() || null,
      title: form.title.trim(),
      slug: normalizeSlug(form.slug || form.title),
      sku: form.sku.trim(),
      accountingItemCode: form.accountingItemCode.trim(),
      description: form.description.trim() || null,
      shortDescription: form.shortDescription.trim() || null,
      keyFeaturesForSite: form.keyFeaturesForSite
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      technicalSpecsNote: form.technicalSpecsNote.trim() || null,
      price: toNumber(form.price),
      salePrice: form.salePrice.trim() ? toNumber(form.salePrice) : null,
      images: imageLines,
      brandId: form.brandId,
      categoryId: form.categoryId,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      websiteStock: toNumber(form.websiteStock),
      reservedStock: toNumber(form.reservedStock),
      maxOrderQuantity: form.maxOrderQuantity.trim()
        ? toNumber(form.maxOrderQuantity)
        : null,
      weight: form.weight.trim() ? toNumber(form.weight) : null,
      dimensions: {
        length: form.length.trim() ? toNumber(form.length) : null,
        width: form.width.trim() ? toNumber(form.width) : null,
        height: form.height.trim() ? toNumber(form.height) : null,
      },
      specifications: specifications
        .map((item, index) => ({
          title: item.title.trim(),
          value: item.value.trim(),
          unit: item.unit.trim() || null,
          sortOrder: item.sortOrder.trim()
            ? toNumber(item.sortOrder)
            : index + 1,
        }))
        .filter((item) => item.title && item.value),
    });
  };

  const updateSpecification = (
    rowId: string,
    key: keyof Omit<SpecificationDraft, "rowId">,
    value: string,
  ) => {
    setSpecifications((current) =>
      current.map((item) =>
        item.rowId === rowId ? { ...item, [key]: value } : item,
      ),
    );
    setErrors((current) => ({ ...current, specifications: "" }));
  };

  const addSpecification = () => {
    setSpecifications((current) => [
      ...current,
      {
        rowId: `new-${Date.now()}`,
        title: "",
        value: "",
        unit: "",
        sortOrder: String(current.length + 1),
      },
    ]);
  };

  return (
    <Card className="p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="مرجع کالا" error={errors.productRef}>
          <Input
            value={form.productRef}
            onChange={(event) => updateField("productRef", event.target.value)}
            placeholder="objectId یا شناسه مرجع کالا"
            aria-invalid={Boolean(errors.productRef)}
          />
        </Field>

        <Field label="عنوان" error={errors.title}>
          <Input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            aria-invalid={Boolean(errors.title)}
          />
        </Field>

        <Field label="اسلاگ" error={errors.slug}>
          <Input
            dir="ltr"
            value={form.slug}
            onChange={(event) => updateField("slug", event.target.value)}
            onBlur={() =>
              updateField("slug", normalizeSlug(form.slug || form.title))
            }
            aria-invalid={Boolean(errors.slug)}
          />
        </Field>

        <Field label="SKU" error={errors.sku}>
          <Input
            value={form.sku}
            onChange={(event) => updateField("sku", event.target.value)}
            aria-invalid={Boolean(errors.sku)}
          />
        </Field>

        <Field label="کد کالا" error={errors.accountingItemCode}>
          <Input
            value={form.accountingItemCode}
            onChange={(event) => updateField("accountingItemCode", event.target.value)}
            aria-invalid={Boolean(errors.accountingItemCode)}
          />
        </Field>

        <Field label="برند" error={errors.brandId}>
          <Select value={form.brandId} onValueChange={(value) => updateField("brandId", value)}>
            <SelectTrigger aria-invalid={Boolean(errors.brandId)}>
              <SelectValue placeholder="انتخاب برند" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.objectId} value={brand.objectId}>{brand.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="دسته‌بندی" error={errors.categoryId}>
          <Select value={form.categoryId} onValueChange={(value) => updateField("categoryId", value)}>
            <SelectTrigger aria-invalid={Boolean(errors.categoryId)}>
              <SelectValue placeholder="انتخاب دسته‌بندی" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.objectId} value={category.objectId}>{category.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="قیمت سایت (ریال)" error={errors.price}>
          <Input
            inputMode="numeric"
            value={form.price}
            onChange={(event) => updateField("price", event.target.value)}
            aria-invalid={Boolean(errors.price)}
          />
        </Field>

        <Field label="قیمت فروش ویژه (ریال)" error={errors.salePrice}>
          <Input
            inputMode="numeric"
            value={form.salePrice}
            onChange={(event) => updateField("salePrice", event.target.value)}
            aria-invalid={Boolean(errors.salePrice)}
          />
        </Field>

        <Field label="موجودی سایت" error={errors.websiteStock}>
          <Input
            inputMode="numeric"
            value={form.websiteStock}
            onChange={(event) =>
              updateField("websiteStock", event.target.value)
            }
            aria-invalid={Boolean(errors.websiteStock)}
          />
        </Field>

        <Field label="موجودی رزروشده" error={errors.reservedStock}>
          <Input
            inputMode="numeric"
            value={form.reservedStock}
            onChange={(event) =>
              updateField("reservedStock", event.target.value)
            }
            aria-invalid={Boolean(errors.reservedStock)}
          />
        </Field>

        <Field label="حداکثر تعداد سفارش" error={errors.maxOrderQuantity}>
          <Input
            inputMode="numeric"
            value={form.maxOrderQuantity}
            onChange={(event) =>
              updateField("maxOrderQuantity", event.target.value)
            }
            aria-invalid={Boolean(errors.maxOrderQuantity)}
          />
        </Field>

        <Field label="وزن (گرم)" error={errors.weight}>
          <Input
            inputMode="numeric"
            value={form.weight}
            onChange={(event) => updateField("weight", event.target.value)}
            aria-invalid={Boolean(errors.weight)}
          />
        </Field>

        <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
          <Field label="طول (سانتی‌متر)" error={errors.length}>
            <Input
              inputMode="numeric"
              value={form.length}
              onChange={(event) => updateField("length", event.target.value)}
              aria-invalid={Boolean(errors.length)}
            />
          </Field>
          <Field label="عرض (سانتی‌متر)" error={errors.width}>
            <Input
              inputMode="numeric"
              value={form.width}
              onChange={(event) => updateField("width", event.target.value)}
              aria-invalid={Boolean(errors.width)}
            />
          </Field>
          <Field label="ارتفاع (سانتی‌متر)" error={errors.height}>
            <Input
              inputMode="numeric"
              value={form.height}
              onChange={(event) => updateField("height", event.target.value)}
              aria-invalid={Boolean(errors.height)}
            />
          </Field>
        </div>

        <Field label="توضیح کوتاه" error={errors.shortDescription}>
          <Textarea
            value={form.shortDescription}
            onChange={(event) =>
              updateField("shortDescription", event.target.value)
            }
            aria-invalid={Boolean(errors.shortDescription)}
          />
        </Field>

        <Field label="توضیحات" error={errors.description}>
          <Textarea
            value={form.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            aria-invalid={Boolean(errors.description)}
          />
        </Field>

        <Field label="ویژگی‌های کلیدی سایت" error={errors.keyFeaturesForSite}>
          <Textarea
            value={form.keyFeaturesForSite}
            onChange={(event) =>
              updateField("keyFeaturesForSite", event.target.value)
            }
            placeholder="هر ویژگی در یک خط"
            aria-invalid={Boolean(errors.keyFeaturesForSite)}
          />
        </Field>

        <Field label="یادداشت مشخصات فنی" error={errors.technicalSpecsNote}>
          <Textarea
            value={form.technicalSpecsNote}
            onChange={(event) =>
              updateField("technicalSpecsNote", event.target.value)
            }
            aria-invalid={Boolean(errors.technicalSpecsNote)}
          />
        </Field>

        <Field label="تصاویر" error={errors.images}>
          <Textarea
            dir="ltr"
            value={form.images}
            onChange={(event) => updateField("images", event.target.value)}
            placeholder="هر URL تصویر در یک خط"
            aria-invalid={Boolean(errors.images)}
          />
        </Field>

        <div className="grid content-start gap-3 text-sm font-medium text-[#334155]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateField("isActive", event.target.checked)
              }
              className="size-4"
            />
            فعال در سایت
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) =>
                updateField("isFeatured", event.target.checked)
              }
              className="size-4"
            />
            محصول ویژه
          </label>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#102034]">
              جدول مشخصات محصول
            </h3>
            <p className="mt-1 text-xs leading-6 text-[#64748B]">
              این ردیف‌ها در صفحه جزئیات محصول سایت نمایش داده می‌شوند.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addSpecification}>
            افزودن مشخصه
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {specifications.map((item, index) => (
            <div
              key={item.rowId}
              className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 md:grid-cols-[1fr_1fr_120px_100px_auto]"
            >
              <Input
                value={item.title}
                onChange={(event) =>
                  updateSpecification(item.rowId, "title", event.target.value)
                }
                placeholder="عنوان مشخصه"
                aria-label="عنوان مشخصه"
              />
              <Input
                value={item.value}
                onChange={(event) =>
                  updateSpecification(item.rowId, "value", event.target.value)
                }
                placeholder="مقدار"
                aria-label="مقدار مشخصه"
              />
              <Input
                value={item.unit}
                onChange={(event) =>
                  updateSpecification(item.rowId, "unit", event.target.value)
                }
                placeholder="واحد"
                aria-label="واحد مشخصه"
              />
              <Input
                inputMode="numeric"
                value={item.sortOrder}
                onChange={(event) =>
                  updateSpecification(
                    item.rowId,
                    "sortOrder",
                    event.target.value,
                  )
                }
                placeholder="ترتیب"
                aria-label="ترتیب مشخصه"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSpecifications((current) =>
                    current.filter((entry) => entry.rowId !== item.rowId),
                  )
                }
              >
                حذف
              </Button>
              <span className="sr-only">ردیف {index + 1}</span>
            </div>
          ))}
          {specifications.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#D7DEE6] bg-white p-4 text-sm text-[#64748B]">
              هنوز مشخصه‌ای برای این محصول ثبت نشده است.
            </p>
          ) : null}
        </div>
        <FieldError message={errors.specifications} />
      </div>
      {taxonomyError ? <p className="mt-4 text-sm text-red-600">{taxonomyError}</p> : null}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "در حال ذخیره..." : submitLabel}
        </Button>
      </div>
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

function createInitialState(product?: WebsiteProduct | null): ProductFormState {
  return {
    productRef: product?.productRef ?? "",
    title: product?.title ?? "",
    slug: product?.slug ?? "",
    sku: product?.sku ?? "",
    accountingItemCode: product?.accountingItemCode ?? "",
    description: product?.description ?? "",
    shortDescription: product?.shortDescription ?? "",
    keyFeaturesForSite: product?.keyFeaturesForSite.join("\n") ?? "",
    technicalSpecsNote: product?.technicalSpecsNote ?? "",
    price: product?.price ? String(product.price) : "",
    salePrice: product?.salePrice ? String(product.salePrice) : "",
    images: product?.images.join("\n") ?? "",
    brandId: product?.brandId ?? "",
    categoryId: product?.categoryId ?? "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    websiteStock:
      product?.websiteStock === undefined ? "0" : String(product.websiteStock),
    reservedStock:
      product?.reservedStock === undefined ? "0" : String(product.reservedStock),
    maxOrderQuantity:
      product?.maxOrderQuantity === null ||
      product?.maxOrderQuantity === undefined
        ? ""
        : String(product.maxOrderQuantity),
    weight:
      product?.weight === null || product?.weight === undefined
        ? ""
        : String(product.weight),
    length:
      product?.dimensions.length === null ||
      product?.dimensions.length === undefined
        ? ""
        : String(product.dimensions.length),
    width:
      product?.dimensions.width === null ||
      product?.dimensions.width === undefined
        ? ""
        : String(product.dimensions.width),
    height:
      product?.dimensions.height === null ||
      product?.dimensions.height === undefined
        ? ""
        : String(product.dimensions.height),
  };
}

function createInitialSpecifications(
  product?: WebsiteProduct | null,
): SpecificationDraft[] {
  return (product?.specifications ?? []).map((item, index) => ({
    rowId: `existing-${index}`,
    title: item.title,
    value: item.value,
    unit: item.unit ?? "",
    sortOrder: String(item.sortOrder || index + 1),
  }));
}

function validateForm(
  form: ProductFormState,
  specifications: SpecificationDraft[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "این فیلد الزامی است.";
  if (!form.sku.trim()) errors.sku = "این فیلد الزامی است.";
  if (!form.accountingItemCode.trim()) errors.accountingItemCode = "این فیلد الزامی است.";
  if (!form.brandId) errors.brandId = "انتخاب برند الزامی است.";
  if (!form.categoryId) errors.categoryId = "انتخاب دسته‌بندی الزامی است.";
  if (!normalizeSlug(form.slug || form.title)) {
    errors.slug = "اسلاگ معتبر نیست.";
  }
  validateNonNegativeNumber(form.price, "price", errors, true);
  validateNonNegativeNumber(form.salePrice, "salePrice", errors);
  validateNonNegativeNumber(form.websiteStock, "websiteStock", errors, true);
  validateNonNegativeNumber(form.reservedStock, "reservedStock", errors, true);
  validateNonNegativeNumber(form.maxOrderQuantity, "maxOrderQuantity", errors);
  validateNonNegativeNumber(form.weight, "weight", errors);
  validateNonNegativeNumber(form.length, "length", errors);
  validateNonNegativeNumber(form.width, "width", errors);
  validateNonNegativeNumber(form.height, "height", errors);
  const hasIncompleteSpecification = specifications.some(
    (item) =>
      (item.title.trim() || item.value.trim() || item.unit.trim()) &&
      (!item.title.trim() || !item.value.trim()),
  );
  if (hasIncompleteSpecification) {
    errors.specifications = "عنوان و مقدار هر مشخصه باید کامل باشد.";
  }
  return errors;
}

function validateNonNegativeNumber(
  value: string,
  key: string,
  errors: Record<string, string>,
  required = false,
) {
  if (!value.trim()) {
    if (required) errors[key] = "این فیلد الزامی است.";
    return;
  }
  const numberValue = toNumber(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    errors[key] = "عدد واردشده معتبر نیست.";
  }
}
