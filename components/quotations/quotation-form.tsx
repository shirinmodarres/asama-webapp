"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import type { Customer } from "@/lib/models/customer.model";
import type { Product } from "@/lib/models/product.model";
import type {
  CreateSalesQuotationPayload,
  SalesQuotation,
  SalesQuotationItem,
} from "@/lib/models/sales-quotation.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listAssignedCustomersForExpert } from "@/lib/services/expert-customer.service";
import { listQuotationProductsForAssignment } from "@/lib/services/product.service";
import { formatFaDigits, normalizeDigits, toNumber } from "@/lib/utils/number-format";
import { JalaliDateInput } from "@/components/shared/jalali-date-input";
import { SELECT_REQUIRED_MESSAGE, POSITIVE_NUMBER_MESSAGE } from "@/lib/utils/form-validation";

interface QuotationFormProps {
  mode: "create" | "edit";
  initialQuotation?: SalesQuotation | null;
  submitLabel: string;
  isSubmitting?: boolean;
  assignedCustomersOnly?: boolean;
  onSubmit: (payload: CreateSalesQuotationPayload) => Promise<void>;
  onCancel?: () => void;
}

interface DraftRow {
  rowId: string;
  productId: string;
  quantity: number;
  discount: number;
  tax: number;
}

interface PriceListOption {
  value: string;
  label: string;
}

export function QuotationForm({
  mode,
  initialQuotation,
  submitLabel,
  isSubmitting = false,
  assignedCustomersOnly = true,
  onSubmit,
  onCancel,
}: QuotationFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [productError, setProductError] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialQuotation?.customerObjectId || "",
  );
  const [selectedPriceListId, setSelectedPriceListId] = useState(
    initialQuotation?.priceListObjectId || "",
  );
  const [selectedValidUntil, setSelectedValidUntil] = useState(
    initialQuotation?.validUntil?.slice(0, 10) || "",
  );
  const [notes, setNotes] = useState(initialQuotation?.notes || "");
  const [rows, setRows] = useState<DraftRow[]>(
    initialQuotation?.items?.length
      ? initialQuotation.items.map((item, index) => ({
          rowId: `initial-${index}-${item.productObjectId}`,
          productId: item.productObjectId,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax: item.tax || 0,
        }))
      : [createEmptyRow(0)],
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [rowErrors, setRowErrors] = useState<
    Record<string, { productId?: string; quantity?: string }>
  >({});

  useEffect(() => {
    let mounted = true;
    async function loadCustomers() {
      setIsLoadingCustomers(true);
      setCustomerError("");
      try {
        const data = await listAssignedCustomersForExpert(getStoredCurrentUser()?.objectId);
        if (!mounted) return;
        setCustomers(data);
        if (!selectedCustomerId && data.length === 1) {
          setSelectedCustomerId(data[0].objectId);
        }
      } catch (loadError) {
        if (mounted) setCustomerError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoadingCustomers(false);
      }
    }
    loadCustomers();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.objectId === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );

  const priceListOptions = useMemo(() => {
    const options: PriceListOption[] = [];
    const seen = new Set<string>();
    const addOption = (value: string | null | undefined, label: string | null | undefined) => {
      if (!value || seen.has(value)) return;
      seen.add(value);
      options.push({ value, label: label || value });
    };
    const priceLists = selectedCustomer?.priceLists || [];
    priceLists.forEach((priceList) => {
      addOption(priceList.objectId, priceList.title || priceList.displayName || priceList.name);
    });
    addOption(selectedCustomer?.priceListId, selectedCustomer?.priceListTitle);
    if (!options.length && selectedCustomer?.saleType?.objectId) {
      addOption(selectedCustomer.priceListId || selectedCustomer.saleType.objectId, selectedCustomer.saleType.title);
    }
    return options;
  }, [selectedCustomer]);

  useEffect(() => {
    if (!selectedCustomer) {
      setProducts([]);
      setSelectedPriceListId("");
      return;
    }
    if (priceListOptions.length > 0) {
      setSelectedPriceListId((current) => {
        if (current && priceListOptions.some((option) => option.value === current)) return current;
        return selectedCustomer.priceListId && priceListOptions.some((option) => option.value === selectedCustomer.priceListId)
          ? selectedCustomer.priceListId
          : priceListOptions[0].value;
      });
    }
  }, [priceListOptions, selectedCustomer]);

  useEffect(() => {
    let mounted = true;
    async function loadProducts() {
      if (!selectedCustomerId || !selectedPriceListId) {
        setProducts([]);
        return;
      }
      setIsLoadingProducts(true);
      setProductError("");
      try {
        const data = await listQuotationProductsForAssignment(
          {
            customerObjectId: selectedCustomerId,
            priceListId: selectedPriceListId,
            expertUserId: getStoredCurrentUser()?.objectId,
          },
        );
        if (!mounted) return;
        setProducts(data);
        if (mode === "edit" && initialQuotation) {
          const itemRows = mapQuotationItems(initialQuotation.items);
          setRows(itemRows);
        }
      } catch (loadError) {
        if (mounted) setProductError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoadingProducts(false);
      }
    }

    loadProducts();
    return () => {
      mounted = false;
    };
  }, [initialQuotation, mode, selectedCustomerId, selectedPriceListId]);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.objectId,
        label: [
          product.sepidarCode || product.sku,
          product.name,
        ].filter(Boolean).join(" - "),
        description: product.brandName || undefined,
        searchText: [
          product.sepidarCode,
          product.sku,
          product.name,
          product.brandName,
        ]
          .filter(Boolean)
          .join(" "),
      })),
    [products],
  );

  const productsById = useMemo(
    () =>
      products.reduce<Record<string, Product>>((accumulator, product) => {
        accumulator[product.objectId] = product;
        return accumulator;
      }, {}),
    [products],
  );

  const resolvedRows = useMemo(
    () =>
      rows
        .filter((row) => row.productId && row.quantity > 0)
        .map((row) => {
          const product = productsById[row.productId];
          const unitPrice = product?.unitPrice ?? 0;
          const lineSubtotal = row.quantity * unitPrice;
          const lineTotal = Math.max(0, lineSubtotal - row.discount + row.tax);
          return {
            ...row,
            unitPrice,
            lineSubtotal,
            lineTotal,
            productName: product?.name || "",
            productSku: product?.sepidarCode || product?.sku || "",
          };
        }),
    [productsById, rows],
  );

  const subtotal = resolvedRows.reduce((sum, row) => sum + row.lineTotal, 0);
  const discount = resolvedRows.reduce((sum, row) => sum + row.discount, 0);
  const tax = resolvedRows.reduce((sum, row) => sum + row.tax, 0);
  const total = Math.max(0, subtotal - discount + tax);
  const itemCount = resolvedRows.length;
  const totalQuantity = resolvedRows.reduce((sum, row) => sum + row.quantity, 0);

  const addRow = () => {
    setRows((current) => [...current, createEmptyRow(current.length)]);
  };

  const removeRow = (rowId: string) => {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.rowId !== rowId) : current));
  };

  const updateRow = (rowId: string, patch: Partial<DraftRow>) => {
    setRows((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
    );
    setRowErrors((current) => ({
      ...current,
      [rowId]: {
        ...(patch.productId !== undefined ? { productId: "" } : {}),
        ...(patch.quantity !== undefined ? { quantity: "" } : {}),
      },
    }));
  };

  const submit = async (status: "draft" | "finalized") => {
    setError("");
    setRowErrors({});
    const nextRowErrors: Record<string, { productId?: string; quantity?: string }> = {};

    if (!selectedCustomerId) {
      setError("لطفاً مشتری را انتخاب کنید.");
      return;
    }
    if (!selectedPriceListId) {
      setError("لطفاً لیست قیمت را انتخاب کنید.");
      return;
    }

    if (resolvedRows.length === 0) {
      setError("حداقل یک کالا اضافه کنید.");
      return;
    }

    for (const row of rows) {
      const rowErrors: { productId?: string; quantity?: string } = {};
      if (!row.productId) {
        rowErrors.productId = SELECT_REQUIRED_MESSAGE;
      } else if (!productsById[row.productId]) {
        rowErrors.productId = "این کالا در لیست قیمت انتخاب‌شده موجود نیست.";
      }
      if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
        rowErrors.quantity = POSITIVE_NUMBER_MESSAGE;
      }
      if (Object.keys(rowErrors).length) {
        nextRowErrors[row.rowId] = rowErrors;
      }
    }

    if (Object.keys(nextRowErrors).length) {
      setRowErrors(nextRowErrors);
      return;
    }

    await onSubmit({
      customerObjectId: selectedCustomerId,
      priceListObjectId: selectedPriceListId,
      notes: notes.trim(),
      validUntil: selectedValidUntil || null,
      discount,
      tax,
      status,
      items: resolvedRows.map((row) => ({
        productObjectId: row.productId,
        quantity: row.quantity,
        discount: row.discount,
        tax: row.tax,
      })),
    });
  };

  if (isLoadingCustomers) {
    return <LoadingState title="در حال دریافت مشتری‌ها" />;
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>مشتری</span>
            <SearchableSelect
              value={selectedCustomerId || undefined}
              onValueChange={(value) => {
                setSelectedCustomerId(value);
                setRows([createEmptyRow(0)]);
                setProducts([]);
                setSelectedPriceListId("");
              }}
              options={customers.map((customer) => ({
                value: customer.objectId,
                label: [
                  customer.sepidarCustomerCode || customer.id,
                  customer.fullName,
                ]
                  .filter(Boolean)
                  .join(" - "),
              }))}
              placeholder="انتخاب مشتری"
              searchPlaceholder="جستجو در مشتری‌ها"
              emptyMessage={assignedCustomersOnly ? "مشتری پیدا نشد" : "مشتری یافت نشد"}
            />
            <FieldError message={customerError} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>لیست قیمت</span>
            <SearchableSelect
              value={selectedPriceListId || undefined}
              onValueChange={setSelectedPriceListId}
              options={priceListOptions}
              placeholder="انتخاب لیست قیمت"
              searchPlaceholder="جستجو در لیست قیمت"
              emptyMessage="لیست قیمت پیدا نشد"
              disabled={!selectedCustomerId || priceListOptions.length === 0}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>اعتبار تا تاریخ</span>
            <JalaliDateInput
              value={selectedValidUntil}
              onChange={setSelectedValidUntil}
              placeholder="انتخاب تاریخ اعتبار"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
            <span>توضیحات</span>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="یادداشت‌های پیش فاکتور"
            />
          </label>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[#1F3A5F]">اقلام پیش فاکتور</h3>
            <Button type="button" variant="outline" onClick={addRow}>
              <PlusCircle className="ml-2 size-4" />
              افزودن کالا
            </Button>
          </div>
          {productError ? <InlineErrorMessage message={productError} /> : null}
          {isLoadingProducts ? <LoadingState title="در حال دریافت کالاها" /> : null}
          <div className="space-y-3">
            {rows.map((row) => {
              const product = productsById[row.productId];
              const unitPrice = product?.unitPrice ?? 0;
              const lineTotal = Math.max(0, row.quantity * unitPrice - row.discount + row.tax);
              return (
                <div
                  key={row.rowId}
                  className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-4 xl:grid-cols-[2fr_120px_120px_120px_120px_auto]"
                >
                  <div>
                    <SearchableSelect
                      value={row.productId || undefined}
                      onValueChange={(value) => updateRow(row.rowId, { productId: value })}
                      options={productOptions}
                      placeholder="انتخاب کالا"
                      searchPlaceholder="جستجو در کالاها"
                      emptyMessage="کالایی پیدا نشد"
                      invalid={Boolean(rowErrors[row.rowId]?.productId)}
                    />
                    <FieldError message={rowErrors[row.rowId]?.productId} />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(event) => updateRow(row.rowId, { quantity: toNumber(event.target.value) })}
                      placeholder="تعداد"
                    />
                    <FieldError message={rowErrors[row.rowId]?.quantity} />
                  </div>
                  <Input value={formatCurrency(unitPrice)} readOnly disabled />
                  <Input
                    type="number"
                    min={0}
                    value={row.discount}
                    onChange={(event) => updateRow(row.rowId, { discount: toNumber(event.target.value) })}
                    placeholder="تخفیف"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={row.tax}
                    onChange={(event) => updateRow(row.rowId, { tax: toNumber(event.target.value) })}
                    placeholder="مالیات"
                  />
                  <div className="flex items-center justify-between gap-2 xl:justify-end">
                    <div className="text-sm text-[#334155]">
                      <div>{product?.name || "کالای انتخاب‌شده"}</div>
                      <div className="text-xs text-[#64748B]">
                        {product?.brandName || product?.brand || "-"} - جمع: {formatCurrency(lineTotal)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.rowId)}
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="text-base font-semibold text-[#1F3A5F]">خلاصه پیش فاکتور</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <SummaryRow label="مشتری" value={selectedCustomer?.fullName || "-"} />
            <SummaryRow label="لیست قیمت" value={selectedCustomer?.priceListTitle || selectedPriceListId || "-"} />
            <SummaryRow label="تعداد آیتم" value={formatNumber(itemCount)} />
            <SummaryRow label="جمع تعداد" value={formatNumber(totalQuantity)} />
            <SummaryRow label="جمع جزء" value={formatCurrency(subtotal)} />
            <SummaryRow label="تخفیف" value={formatCurrency(discount)} />
            <SummaryRow label="مالیات" value={formatCurrency(tax)} />
            <SummaryRow label="جمع کل" value={formatCurrency(total)} />
          </dl>
        </Card>

        <div className="flex flex-col gap-3">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              انصراف
            </Button>
          ) : null}
          <Button type="button" disabled={isSubmitting} onClick={() => submit("draft")}>
            {submitLabel}
          </Button>
          <Button type="button" disabled={isSubmitting} variant="secondary" onClick={() => submit("finalized")}>
            نهایی‌سازی
          </Button>
        </div>
      </div>
    </section>
  );
}

function createEmptyRow(index: number): DraftRow {
  return {
    rowId: `row-${Date.now()}-${index}`,
    productId: "",
    quantity: 1,
    discount: 0,
    tax: 0,
  };
}

function mapQuotationItems(items: SalesQuotationItem[]): DraftRow[] {
  return items.length
    ? items.map((item, index) => ({
        rowId: `quotation-${index}-${item.productObjectId}`,
        productId: item.productObjectId,
        quantity: item.quantity,
        discount: item.discount || 0,
        tax: item.tax || 0,
      }))
    : [createEmptyRow(0)];
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8EEF4] bg-[#FBFCFD] px-3.5 py-3">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="font-semibold text-[#102034]">{value}</dd>
    </div>
  );
}
