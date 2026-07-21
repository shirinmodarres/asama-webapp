"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PackageSearch, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, getErrorMessage } from "@/lib/api/api-error";
import type { Product } from "@/lib/models/product.model";
import type { WarehouseInboundReceipt } from "@/lib/models/warehouse.model";
import { listProducts } from "@/lib/services/product.service";
import {
  getInboundReceiptEditData,
  updateInboundReceipt,
} from "@/lib/services/warehouse.service";
import {
  formatFaDigits,
  formatFaNumber,
  normalizeDigits,
  toNumber,
} from "@/lib/utils/number-format";
import type { ValidationFieldError } from "../../../import-helpers";
import { extractValidationFieldErrors } from "../../../import-helpers";

interface EditableUnit {
  rowId: string;
  objectId?: string;
  productObjectId: string;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
  quantity: string;
}

export default function WarehouseInboundReceiptEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<WarehouseInboundReceipt | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [units, setUnits] = useState<EditableUnit[]>([]);
  const [notes, setNotes] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [newProductIdentifier, setNewProductIdentifier] = useState("");
  const [newSerialNumber, setNewSerialNumber] = useState("");
  const [newTrackingCode, setNewTrackingCode] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rowFieldErrors, setRowFieldErrors] = useState<
    Record<
      string,
      Partial<Record<"productIdentifier" | "serialNumber" | "trackingCode" | "quantity" | "productObjectId", string>>
    >
  >({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReceipt() {
      setIsLoading(true);
      setError("");
      try {
        const [data, productData] = await Promise.all([
          getInboundReceiptEditData(params.id),
          listProducts("warehouse"),
        ]);
        if (!isMounted) return;
        setReceipt(data);
        setProducts(productData.filter((product) => product.isSyncedFromSepidar));
        setSelectedProductId(data.productObjectId);
        setNotes(data.notes || "");
        setSupplierName(data.supplierName || "");
        setReceiptDate(toDateInputValue(data.receiptDate));
        setUnits(
          data.units.map((unit, index) => ({
            rowId: `${unit.objectId || unit.productObjectId || "unit"}-${index}`,
            objectId: unit.objectId,
            productObjectId: unit.productObjectId || "",
            productIdentifier: unit.productIdentifier,
            serialNumber: unit.serialNumber,
            trackingCode: unit.trackingCode,
            quantity: String(unit.quantity || 1),
          })),
        );
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReceipt();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const isEditable = useMemo(
    () =>
      Boolean(
        receipt?.units.every((unit) =>
          ["available", "in_stock"].includes(String(unit.status)),
        ),
      ),
    [receipt],
  );

  const productCanBeEdited = receipt?.canEditProduct === true;
  const groupedUnits = useMemo(() => groupEditableUnits(units), [units]);

  const selectedProduct = useMemo(
    () =>
      products.find((product) => product.objectId === selectedProductId) ||
      (receipt && receipt.productObjectId === selectedProductId
        ? {
            objectId: receipt.productObjectId,
            id: receipt.productObjectId,
            sku: receipt.productSku,
            barcode: null,
            sepidarItemId: receipt.sepidarItemId,
            sepidarCode: null,
            name: receipt.productName,
            brand: "",
            model: null,
            category: "",
            unit: "",
            unitPrice: 0,
            priceNoteItemId: null,
            description: null,
            isSyncedFromSepidar: true,
            isActive: true,
            isSellable: true,
            status: "active",
            statusLabel: "",
            totalStock: 0,
            salesStock: 0,
            warehouseStock: 0,
            reservedStock: 0,
            availableStock: 0,
            availableForSale: 0,
            availableSalesQuantity: 0,
            hasAvailableSalesQuantity: false,
            availableStocks: [],
            warehouseAvailableStock: 0,
            najaInventoryQty: 0,
            inventories: [],
            createdAt: "",
            updatedAt: "",
          } satisfies Product
        : undefined),
    [products, receipt, selectedProductId],
  );

  const productOptions = useMemo(() => {
    const optionProducts =
      selectedProduct && !products.some((product) => product.objectId === selectedProduct.objectId)
        ? [selectedProduct, ...products]
        : products;

    return optionProducts.map((product) => {
      return {
        value: product.objectId,
        label: `${formatFaDigits(product.sku || product.sepidarCode || "")} - ${formatFaDigits(product.name)}`,
        description: "",
        searchText: [
          product.name,
          product.sku,
          product.sepidarCode,
          product.model,
          product.barcode,
        ]
          .filter(Boolean)
          .join(" "),
      };
    });
  }, [products, selectedProduct]);

  const totalQuantity = useMemo(
    () =>
      units.reduce((sum, unit) => {
        const quantity = toNumber(unit.quantity);
        return sum + (quantity > 0 ? quantity : 0);
      }, 0),
    [units],
  );

  const columns: DataTableColumn<EditableUnit>[] = [
    {
      key: "productIdentifier",
      header: "شناسه محصول",
      render: (row) => (
        <div data-unit-row-id={row.rowId} data-edit-field="productIdentifier">
          <Input
            value={row.productIdentifier}
            disabled={!isEditable}
            onChange={(event) =>
              updateUnit(row.rowId, { productIdentifier: event.target.value })
            }
            aria-invalid={Boolean(rowFieldErrors[row.rowId]?.productIdentifier)}
          />
          <FieldError message={rowFieldErrors[row.rowId]?.productIdentifier} />
        </div>
      ),
    },
    {
      key: "serialNumber",
      header: "سریال محصول",
      render: (row) => (
        <div data-unit-row-id={row.rowId} data-edit-field="serialNumber">
          <Input
            value={row.serialNumber}
            disabled={!isEditable}
            onChange={(event) =>
              updateUnit(row.rowId, { serialNumber: event.target.value })
            }
            aria-invalid={Boolean(rowFieldErrors[row.rowId]?.serialNumber)}
          />
          <FieldError message={rowFieldErrors[row.rowId]?.serialNumber} />
        </div>
      ),
    },
    {
      key: "trackingCode",
      header: "کد رهگیری",
      render: (row) => (
        <div data-unit-row-id={row.rowId} data-edit-field="trackingCode">
          <Input
            value={row.trackingCode}
            disabled={!isEditable}
            onChange={(event) =>
              updateUnit(row.rowId, { trackingCode: event.target.value })
            }
            aria-invalid={Boolean(rowFieldErrors[row.rowId]?.trackingCode)}
          />
          <FieldError message={rowFieldErrors[row.rowId]?.trackingCode} />
        </div>
      ),
    },
    {
      key: "quantity",
      header: "تعداد",
      render: (row) => (
        <div data-unit-row-id={row.rowId} data-edit-field="quantity">
          <Input
            inputMode="numeric"
            value={row.quantity}
            disabled={!isEditable}
            onChange={(event) =>
              updateUnit(row.rowId, { quantity: event.target.value })
            }
            aria-invalid={Boolean(rowFieldErrors[row.rowId]?.quantity)}
          />
          <FieldError message={rowFieldErrors[row.rowId]?.quantity} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="حذف"
          disabled={!isEditable}
          onClick={() =>
            setUnits((current) =>
              current.filter((unit) => unit.rowId !== row.rowId),
            )
          }
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  function updateUnit(rowId: string, patch: Partial<EditableUnit>) {
    setUnits((current) =>
      current.map((unit) =>
        unit.rowId === rowId ? { ...unit, ...patch } : unit,
      ),
    );
  }

  const addUnit = () => {
    setError("");
    setFieldErrors({});
    const unit = {
      rowId: `new-${Date.now()}`,
      productObjectId: selectedProductId,
      productIdentifier: normalizeDigits(newProductIdentifier.trim()),
      serialNumber: normalizeDigits(newSerialNumber.trim()),
      trackingCode: normalizeDigits(newTrackingCode.trim()),
      quantity: normalizeDigits(newQuantity.trim()),
    };
    const quantity = toNumber(unit.quantity);
    if (
      !unit.productIdentifier ||
      !unit.serialNumber ||
      !unit.trackingCode ||
      quantity <= 0
    ) {
      setFieldErrors({
        newProductIdentifier: unit.productIdentifier
          ? ""
          : "این فیلد الزامی است.",
        newSerialNumber: unit.serialNumber ? "" : "این فیلد الزامی است.",
        newTrackingCode: unit.trackingCode ? "" : "این فیلد الزامی است.",
        newQuantity: quantity > 0 ? "" : "تعداد باید بیشتر از صفر باشد.",
      });
      return;
    }
    const duplicateField = findDuplicateUnitField(units, unit);
    if (duplicateField) {
      setFieldErrors({
        [duplicateField]: duplicateMessage(
          duplicateField,
          duplicateField === "newSerialNumber" ? unit.serialNumber : unit.trackingCode,
        ),
      });
      return;
    }
    setUnits((current) => [...current, unit]);
    setNewProductIdentifier("");
    setNewSerialNumber("");
    setNewTrackingCode("");
    setNewQuantity("1");
  };

  const handleSubmit = async () => {
    if (!receipt || !isEditable) return;
    setError("");
    setMessage("");
    setFieldErrors({});
    setRowFieldErrors({});

    if (productCanBeEdited && !selectedProductId) {
      setFieldErrors({ selectedProductId: "لطفاً یک گزینه انتخاب کنید." });
      return;
    }

    const normalizedUnits = units.map((unit) => ({
      objectId: unit.objectId,
      productObjectId: unit.productObjectId,
      productIdentifier: normalizeDigits(unit.productIdentifier.trim()),
      serialNumber: normalizeDigits(unit.serialNumber.trim()),
      trackingCode: normalizeDigits(unit.trackingCode.trim()),
      quantity: toNumber(unit.quantity),
    }));

    if (
      normalizedUnits.length === 0 ||
      normalizedUnits.some(
        (unit) =>
        !unit.productObjectId ||
        !unit.productIdentifier ||
        !unit.serialNumber ||
        !unit.trackingCode ||
        unit.quantity <= 0,
      )
    ) {
      setError(
        "همه ردیف‌ها باید شناسه محصول، سریال محصول، کد رهگیری و تعداد معتبر داشته باشند.",
      );
      return;
    }

    const serials = new Set<string>();
    const trackingCodes = new Set<string>();
    for (const unit of normalizedUnits) {
      if (serials.has(unit.serialNumber)) {
        setError("سریال کالا قبلاً ثبت شده است.");
        return;
      }
      if (trackingCodes.has(unit.trackingCode)) {
        setError("کد رهگیری قبلاً ثبت شده است.");
        return;
      }
      serials.add(unit.serialNumber);
      trackingCodes.add(unit.trackingCode);
    }

    setIsSubmitting(true);
    try {
      const updated = await updateInboundReceipt(receipt.objectId, {
        productObjectId: productCanBeEdited && groupedUnits.length === 1 ? selectedProductId : undefined,
        sepidarItemId: productCanBeEdited && groupedUnits.length === 1
          ? selectedProduct?.sepidarItemId ?? null
          : undefined,
        supplierName: supplierName.trim() || null,
        receiptDate: receiptDate || null,
        notes: notes.trim() || null,
        units: normalizedUnits,
      });
      const refreshedProducts = await listProducts("warehouse");
      setProducts(
        refreshedProducts.filter((product) => product.isSyncedFromSepidar),
      );
      setMessage("رسید ورود با موفقیت ویرایش شد.");
      router.refresh();
      router.push(`/warehouse/inbound/receipts/${updated.objectId || updated.id}`);
    } catch (submitError) {
      const validationErrors = extractInboundValidationFieldErrors(submitError);
      if (validationErrors.length) {
        const nextRowFieldErrors = buildEditRowFieldErrors(validationErrors, units);
        setRowFieldErrors(nextRowFieldErrors);
        setError("");
        focusFirstEditFieldError(units, nextRowFieldErrors);
        return;
      }
      setError(formatInboundSubmitError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="warehouse" title="ویرایش رسید">
      {isLoading ? (
        <LoadingState title="در حال دریافت رسید ورود" />
      ) : error && !receipt ? (
        <PageErrorMessage title="دریافت رسید انجام نشد" message={error} />
      ) : !receipt ? (
        <EmptyState title="رسید یافت نشد" description="شناسه رسید معتبر نیست." />
      ) : (
        <div className="space-y-5">
          <SectionHeader
            title={`ویرایش رسید ${formatFaDigits(receipt.receiptCode)}`}
            description="اطلاعات قابل ویرایش رسید ورود"
            actions={
              <Link
                href={`/warehouse/inbound/receipts/${receipt.objectId}`}
                className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155]"
              >
                بازگشت به جزئیات
              </Link>
            }
          />
          {message ? (
            <div className="asama-banner px-4 py-3 text-sm">{message}</div>
          ) : null}
          {error ? <InlineErrorMessage message={error} /> : null}

          <Card className="p-5">
            <dl className="grid gap-3 sm:grid-cols-4">
              <InfoItem
                label="کالاهای فعلی"
                value={
                  groupedUnits
                    .map((group) => {
                      const product = products.find((item) => item.objectId === group.productObjectId);
                      return product?.name || group.productObjectId || "-";
                    })
                    .join("، ") || receipt.productName || "-"
                }
              />
              <InfoItem
                label="کد کالاهای فعلی"
                value={
                  groupedUnits
                    .map((group) => {
                      const product = products.find((item) => item.objectId === group.productObjectId);
                      return product?.sku || product?.sepidarCode || group.productObjectId || "-";
                    })
                    .join("، ") || formatFaDigits(receipt.productSku || receipt.productObjectId)
                }
              />
              <InfoItem label="انبار" value={receipt.stockTitle || "-"} />
              <InfoItem label="تعداد فعلی" value={formatFaNumber(totalQuantity)} />
            </dl>
            {!isEditable ? (
              <div className="mt-4 rounded-xl border border-[#F7D7A8] bg-[#FFF8ED] px-4 py-3 text-sm leading-7 text-[#8A5A12]">
                این رسید به دلیل خروج کالا قابل ویرایش نیست. برخی کالاهای این رسید از وضعیت موجود در انبار خارج شده‌اند.
              </div>
            ) : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
                <span>کالا</span>
                {groupedUnits.length > 1 ? (
                  <div className="rounded-xl border border-[#D1D5DB] bg-[#F8FAFC] px-4 py-3 text-sm leading-7 text-[#334155]">
                    این رسید چندکالاست. ردیف‌ها زیر کالای مربوط به خودشان نمایش داده می‌شوند.
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#F7D7A8] bg-[#FFF8ED] px-4 py-3 text-sm leading-7 text-[#8A5A12]">
                    تغییر کالا روی تمام واحدهای این رسید اعمال می‌شود.
                  </div>
                )}
                <div className="relative">
                  <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                  <SearchableSelect
                    value={selectedProductId || undefined}
                    onValueChange={(value) => {
                      setSelectedProductId(value);
                      setFieldErrors((current) => ({
                        ...current,
                        selectedProductId: "",
                      }));
                    }}
                    options={productOptions}
                    placeholder="انتخاب کالا"
                    searchPlaceholder="جستجو در کالاها"
                    emptyMessage="کالایی پیدا نشد"
                    disabled={!productCanBeEdited}
                    triggerClassName="pr-10"
                    invalid={Boolean(fieldErrors.selectedProductId)}
                    normalizeSearch
                    highlightMatches
                  />
                </div>
                <FieldError message={fieldErrors.selectedProductId} />
                {!productCanBeEdited && receipt.productEditDisabledReason ? (
                  <p className="text-xs leading-6 text-[#B45309]">
                    {receipt.productEditDisabledReason}
                  </p>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>تأمین‌کننده</span>
                <Input
                  value={supplierName}
                  disabled={!isEditable}
                  onChange={(event) => setSupplierName(event.target.value)}
                  placeholder="نام تأمین‌کننده"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>تاریخ رسید</span>
                <Input
                  type="date"
                  value={receiptDate}
                  disabled={!isEditable}
                  onChange={(event) => setReceiptDate(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
                <span>توضیحات</span>
                <Textarea
                  value={notes}
                  disabled={!isEditable}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-4 text-sm text-[#64748B]">
              شناسه کالا، سریال کالا و کد رهگیری نباید در رسید تکراری باشند.
            </p>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <Input
                  value={newProductIdentifier}
                  disabled={!isEditable}
                  onChange={(event) => {
                    setNewProductIdentifier(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      newProductIdentifier: "",
                    }));
                  }}
                  placeholder="شناسه محصول"
                  aria-invalid={Boolean(fieldErrors.newProductIdentifier)}
                />
                <FieldError message={fieldErrors.newProductIdentifier} />
              </div>
              <div>
                <Input
                  value={newSerialNumber}
                  disabled={!isEditable}
                  onChange={(event) => {
                    setNewSerialNumber(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      newSerialNumber: "",
                    }));
                  }}
                  placeholder="سریال محصول"
                  aria-invalid={Boolean(fieldErrors.newSerialNumber)}
                />
                <FieldError message={fieldErrors.newSerialNumber} />
              </div>
              <div>
                <Input
                  value={newTrackingCode}
                  disabled={!isEditable}
                  onChange={(event) => {
                    setNewTrackingCode(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      newTrackingCode: "",
                    }));
                  }}
                  placeholder="کد رهگیری"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addUnit();
                  }}
                  aria-invalid={Boolean(fieldErrors.newTrackingCode)}
                />
                <FieldError message={fieldErrors.newTrackingCode} />
              </div>
              <div>
                <Input
                  inputMode="numeric"
                  value={newQuantity}
                  disabled={!isEditable}
                  onChange={(event) => {
                    setNewQuantity(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      newQuantity: "",
                    }));
                  }}
                  placeholder="تعداد"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addUnit();
                  }}
                  aria-invalid={Boolean(fieldErrors.newQuantity)}
                />
                <FieldError message={fieldErrors.newQuantity} />
              </div>
            </div>
            <Button
              type="button"
              className="mt-4"
              onClick={addUnit}
              disabled={!isEditable}
            >
              افزودن ردیف
            </Button>
          </Card>

          <div className="space-y-4">
            {groupedUnits.map((group) => {
              const groupRows = units.filter((unit) => unit.productObjectId === group.productObjectId);
              const product = products.find((item) => item.objectId === group.productObjectId);
              return (
                <Card key={group.rowId} className="p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#1F3A5F]">
                        {product?.name || receipt.productName || "کالا"}
                      </h3>
                      <p className="mt-1 text-sm text-[#64748B]">
                        {product?.sku || product?.sepidarCode || formatFaDigits(group.productObjectId)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] px-3 py-2 text-sm text-[#102034]">
                      {formatFaNumber(groupRows.length)} عدد
                    </div>
                  </div>
                  <DataTable columns={columns} rows={groupRows} rowKey={(row) => row.rowId} />
                </Card>
              );
            })}
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isEditable}
          >
            {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#1F3A5F]">{value}</dd>
    </div>
  );
}

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function groupEditableUnits(units: EditableUnit[]) {
  const groups = new Map<
    string,
    { rowId: string; productObjectId: string; units: EditableUnit[] }
  >();

  units.forEach((unit, index) => {
    const key = unit.productObjectId || unit.objectId || `unknown-${index}`;
    const existing = groups.get(key);
    if (existing) {
      existing.units.push(unit);
      return;
    }

    groups.set(key, {
      rowId: `${key}-${index}`,
      productObjectId: unit.productObjectId,
      units: [unit],
    });
  });

  return Array.from(groups.values());
}

function findDuplicateUnitField(
  units: EditableUnit[],
  candidate: Pick<
    EditableUnit,
    "productIdentifier" | "serialNumber" | "trackingCode"
  >,
): "newSerialNumber" | "newTrackingCode" | null {
  const serialNumber = normalizeDigits(candidate.serialNumber.trim());
  const trackingCode = normalizeDigits(candidate.trackingCode.trim());

  if (
    serialNumber &&
    units.some(
      (entry) => normalizeDigits(entry.serialNumber.trim()) === serialNumber,
    )
  ) {
    return "newSerialNumber";
  }

  if (
    trackingCode &&
    units.some(
      (entry) => normalizeDigits(entry.trackingCode.trim()) === trackingCode,
    )
  ) {
    return "newTrackingCode";
  }

  return null;
}

function duplicateMessage(
  field: "newSerialNumber" | "newTrackingCode",
  value?: string,
): string {
  const prefix = field === "newSerialNumber" ? "سریال کالا" : "کد رهگیری";
  const suffix = value ? ` (${formatFaDigits(value)})` : "";
  return `${prefix}${suffix} قبلاً ثبت شده است.`;
}

function formatInboundSubmitError(error: unknown): string {
  const baseMessage = getErrorMessage(error);
  if (!(error instanceof ApiError) || !error.details) return baseMessage;

  const details = error.details as Record<string, unknown>;
  const detailRows = [
    details.productIdentifier
      ? `شناسه کالا: ${formatFaDigits(String(details.productIdentifier))}`
      : "",
    details.serialNumber
      ? `سریال: ${formatFaDigits(String(details.serialNumber))}`
      : "",
    details.trackingCode
      ? `کد رهگیری: ${formatFaDigits(String(details.trackingCode))}`
      : "",
  ].filter(Boolean);

  return detailRows.length ? `${baseMessage}\n${detailRows.join("\n")}` : baseMessage;
}

function extractInboundValidationFieldErrors(error: unknown): ValidationFieldError[] {
  if (!error || typeof error !== "object") return [];
  return extractValidationFieldErrors((error as { details?: unknown }).details);
}

function buildEditRowFieldErrors(
  validationErrors: ValidationFieldError[],
  units: EditableUnit[],
): Record<
  string,
  Partial<Record<"productIdentifier" | "serialNumber" | "trackingCode" | "quantity" | "productObjectId", string>>
> {
  return validationErrors.reduce<
    Record<
      string,
      Partial<Record<"productIdentifier" | "serialNumber" | "trackingCode" | "quantity" | "productObjectId", string>>
    >
  >((result, error) => {
    const unit = units[error.rowIndex];
    if (!unit) return result;
    const field = normalizeEditFieldName(error.field);
    result[unit.rowId] = {
      ...result[unit.rowId],
      [field]: error.message,
    };
    return result;
  }, {});
}

function normalizeEditFieldName(
  field: string,
): "productIdentifier" | "serialNumber" | "trackingCode" | "quantity" | "productObjectId" {
  if (
    field === "productIdentifier" ||
    field === "serialNumber" ||
    field === "trackingCode" ||
    field === "quantity" ||
    field === "productObjectId"
  ) {
    return field;
  }
  return "productIdentifier";
}

function focusFirstEditFieldError(
  units: EditableUnit[],
  errors: Record<
    string,
    Partial<Record<"productIdentifier" | "serialNumber" | "trackingCode" | "quantity" | "productObjectId", string>>
  >,
) {
  requestAnimationFrame(() => {
    for (const unit of units) {
      const rowErrors = errors[unit.rowId];
      if (!rowErrors) continue;
      const fields: Array<"productIdentifier" | "serialNumber" | "trackingCode" | "quantity" | "productObjectId"> = [
        "productIdentifier",
        "serialNumber",
        "trackingCode",
        "quantity",
        "productObjectId",
      ];
      const nextField = fields.find((field) => Boolean(rowErrors[field]));
      if (!nextField) continue;
      const selector = `[data-unit-row-id="${unit.rowId}"][data-edit-field="${nextField}"] input`;
      const element = document.querySelector(selector) as HTMLElement | null;
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  });
}
