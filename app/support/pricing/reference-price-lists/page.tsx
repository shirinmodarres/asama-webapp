"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, Wand2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PricingBrand, PricingReference, SepidarPriceList } from "@/lib/models/pricing.model";
import {
  createPricingReference,
  deactivatePricingReference,
  generatePriceLists,
  listPricingBrands,
  listPricingReferences,
  listSepidarPricingLists,
} from "@/lib/services/pricing.service";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ReferencePriceListsPage() {
  const [references, setReferences] = useState<PricingReference[]>([]);
  const [saleTypes, setSaleTypes] = useState<SepidarPriceList[]>([]);
  const [brands, setBrands] = useState<PricingBrand[]>([]);
  const [brandName, setBrandName] = useState("");
  const [sourceSaleTypeObjectId, setSourceSaleTypeObjectId] = useState("");
  const [internalCode, setInternalCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState("");
  const [deactivatingId, setDeactivatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    const [referenceData, saleTypeData, brandData] = await Promise.all([
      listPricingReferences(),
      listSepidarPricingLists(),
      listPricingBrands(),
    ]);
    setReferences(referenceData);
    setSaleTypes(saleTypeData);
    setBrands(brandData);
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      listPricingReferences(),
      listSepidarPricingLists(),
      listPricingBrands(),
    ])
      .then(([referenceData, saleTypeData, brandData]) => {
        if (!mounted) return;
        setReferences(referenceData);
        setSaleTypes(saleTypeData);
        setBrands(brandData);
      })
      .catch((err) => {
        if (mounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const saleTypeOptions = useMemo(
    () =>
      saleTypes.map((row) => ({
        value: row.objectId,
        label: `${row.title || "-"} - ${row.sepidarSaleTypeId ? formatNumber(row.sepidarSaleTypeId) : "-"}`,
      })),
    [saleTypes],
  );

  const brandOptions = useMemo(
    () =>
      brands.map((brand) => ({
        value: brand.brandName,
        label: `${brand.brandName}${brand.productCount ? ` - ${formatNumber(brand.productCount)} کالا` : ""}`,
      })),
    [brands],
  );

  const saveReference = async () => {
    const errors: Record<string, string> = {};
    if (!brandName.trim()) errors.brandName = "برند را وارد کنید.";
    if (!sourceSaleTypeObjectId) errors.sourceSaleTypeObjectId = "لیست قیمت سپیدار را انتخاب کنید.";
    if (!internalCode.trim()) errors.internalCode = "کد لیست قیمت را وارد کنید.";
    if (!displayName.trim()) errors.displayName = "عنوان نمایشی را وارد کنید.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await createPricingReference({
        brandName,
        sourceSaleTypeObjectId,
        internalCode,
        displayName,
        notes,
      });
      setBrandName("");
      setSourceSaleTypeObjectId("");
      setInternalCode("");
      setDisplayName("");
      setNotes("");
      await load();
      setMessage("لیست مرجع فعال شد.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const generate = async (referenceId: string) => {
    setGeneratingId(referenceId);
    setError("");
    setMessage("");
    try {
      await generatePriceLists(referenceId);
      setMessage("لیست‌های قیمت تولید شدند.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingId("");
    }
  };

  const deactivate = async (referenceId: string) => {
    setDeactivatingId(referenceId);
    setError("");
    setMessage("");
    try {
      await deactivatePricingReference(referenceId);
      await load();
      setMessage("لیست مرجع و لیست‌های قیمت تولیدشده از آن غیرفعال شدند.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeactivatingId("");
    }
  };

  const columns: DataTableColumn<PricingReference>[] = [
    { key: "brand", header: "برند", render: (row) => row.brandName || "-" },
    { key: "display", header: "عنوان", render: (row) => row.displayName || "-" },
    { key: "code", header: "کد لیست قیمت", render: (row) => row.internalCode ? formatFaDigits(row.internalCode) : "-" },
    { key: "reference-code", header: "کد سپیدار", render: (row) => row.sepidarSaleTypeId ? formatNumber(row.sepidarSaleTypeId) : "-" },
    { key: "status", header: "وضعیت", render: (row) => row.isActive ? "فعال" : "آرشیو" },
    { key: "created", header: "ایجاد", render: (row) => row.createdAt ? formatDateTime(row.createdAt) : "-" },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/support/pricing/reference-price-lists/${row.objectId}`}>
              جزئیات
            </Link>
          </Button>
          {row.isActive ? (
            <>
              <Button size="sm" onClick={() => generate(row.objectId)} disabled={generatingId === row.objectId || deactivatingId === row.objectId}>
                <Wand2 className="size-4" />
                {generatingId === row.objectId ? "در حال تولید..." : "تولید لیست‌ها"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => deactivate(row.objectId)} disabled={deactivatingId === row.objectId || generatingId === row.objectId}>
                <Ban className="size-4" />
                {deactivatingId === row.objectId ? "در حال غیرفعال‌سازی..." : "غیرفعال"}
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="لیست‌های مرجع">
      <SectionHeader title="لیست‌های مرجع" description="انتخاب مرجع فعال هر برند و تولید قیمت‌های داخلی" />
      {message ? <div className="asama-banner mb-4 px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}
      <Card className="mb-6 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>برند</span>
            <SearchableSelect
              value={brandName || undefined}
              onValueChange={setBrandName}
              options={brandOptions}
              placeholder="انتخاب برند"
              searchPlaceholder="جستجو در برندها"
              emptyMessage={
                brands.length
                  ? "برندی با این جستجو پیدا نشد."
                  : "برندی از کالاها یا BrandMapping دریافت نشد."
              }
            />
            <FieldError message={fieldErrors.brandName} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>لیست قیمت سپیدار</span>
            <SearchableSelect
              value={sourceSaleTypeObjectId || undefined}
              onValueChange={setSourceSaleTypeObjectId}
              options={saleTypeOptions}
              placeholder="انتخاب لیست قیمت"
              searchPlaceholder="جستجو"
            />
            <FieldError message={fieldErrors.sourceSaleTypeObjectId} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>کد لیست قیمت</span>
            <Input value={internalCode} onChange={(event) => setInternalCode(event.target.value)} />
            <FieldError message={fieldErrors.internalCode} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>عنوان نمایشی</span>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            <FieldError message={fieldErrors.displayName} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
            <span>یادداشت</span>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>
        <Button className="mt-5" onClick={saveReference} disabled={isSaving}>
          {isSaving ? "در حال ذخیره..." : "ذخیره مرجع فعال"}
        </Button>
      </Card>
      {isLoading ? <LoadingState title="در حال دریافت لیست‌های مرجع" /> : references.length ? (
        <DataTable columns={columns} rows={references} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState title="مرجعی ثبت نشده است" description="برای هر برند یک لیست سپیدار را به عنوان مرجع فعال انتخاب کنید." />
      )}
    </DashboardLayout>
  );
}
