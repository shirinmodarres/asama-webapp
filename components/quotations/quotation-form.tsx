"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMinus, CirclePlus, PlusCircle, Trash2 } from "lucide-react";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import type { Customer } from "@/lib/models/customer.model";
import type { Product } from "@/lib/models/product.model";
import type {
  CreateSalesQuotationPayload,
  SalesQuotation,
  SalesQuotationItem,
  SalesRequestAdjustment,
} from "@/lib/models/sales-quotation.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listAssignedCustomersForExpert } from "@/lib/services/expert-customer.service";
import { listQuotationProductsForAssignment } from "@/lib/services/product.service";
import { listActiveSalesTypes } from "@/lib/services/sales-type.service";
import { normalizeDigits, toNumber } from "@/lib/utils/number-format";
import { JalaliDateInput } from "@/components/shared/jalali-date-input";
import { SELECT_REQUIRED_MESSAGE, POSITIVE_NUMBER_MESSAGE } from "@/lib/utils/form-validation";
import { jalaliToIso, todayJalaliParts } from "@/lib/utils/jalali-date";
import {
  buildQuotationSubmitPayload,
  getQuotationCustomerSnapshot,
  getQuotationSalesTypeOptionKey,
  getQuotationSalesTypeSnapshot,
} from "@/components/quotations/quotation-form.logic";

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
}

interface PriceListOption {
  value: string;
  label: string;
}

interface SalesTypeOption {
  objectId: string;
  title: string;
  internalCode?: number | null;
  sepidarCode?: number | null;
}

interface DraftAdjustment extends SalesRequestAdjustment {
  rowId: string;
}

const ADJUSTMENT_PRESETS = [
  "تخفیف پایه",
  "تخفیف سبد خرید",
  "تخفیف خوش‌حسابی",
  "کمک هزینه حمل",
  "تخفیف تسویه زودتر",
  "تخفیف خرید نقدی",
  "پشت‌دست / مدیریت بازار",
  "جایزه / کمک هزینه سفر",
  "سایر",
];

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
    initialQuotation?.customerObjectId || initialQuotation?.customer?.objectId || "",
  );
  const [selectedPriceListId, setSelectedPriceListId] = useState(
    initialQuotation?.priceListObjectId || initialQuotation?.priceListId || "",
  );
  const [salesTypes, setSalesTypes] = useState<SalesTypeOption[]>([]);
  const [selectedSalesTypeId, setSelectedSalesTypeId] = useState(
    getQuotationSalesTypeOptionKey(initialQuotation) || "",
  );
  const [selectedValidUntil, setSelectedValidUntil] = useState(
    initialQuotation?.validUntil?.slice(0, 10) || (() => {
      const [year, month, day] = todayJalaliParts();
      return jalaliToIso(year, month, day);
    })(),
  );
  const [notes, setNotes] = useState(initialQuotation?.notes || "");
  const [selectedStockObjectId, setSelectedStockObjectId] = useState(
    initialQuotation?.stockObjectId || "",
  );
  const [rows, setRows] = useState<DraftRow[]>(
    initialQuotation?.items?.length
      ? initialQuotation.items.map((item, index) => ({
          rowId: `initial-${index}-${item.productObjectId}`,
          productId: item.productObjectId,
          quantity: item.quantity,
        }))
      : [createEmptyRow(0)],
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [rowErrors, setRowErrors] = useState<
    Record<string, { productId?: string; quantity?: string }>
  >({});
  const [adjustments, setAdjustments] = useState<DraftAdjustment[]>(
    (initialQuotation?.adjustments || []).map((item, index) => ({
      ...item,
      rowId: `adjustment-${index}`,
    })),
  );
  const quotationSalesTypeFallback = useMemo(
    () => getQuotationSalesTypeSnapshot(initialQuotation) as SalesTypeOption | null,
    [initialQuotation],
  );
  const quotationCustomerFallback = useMemo(
    () => getQuotationCustomerSnapshot(initialQuotation),
    [initialQuotation],
  );

  useEffect(() => {
    let mounted = true;
    async function loadSalesTypes() {
      try {
        const data = await listActiveSalesTypes();
        if (!mounted) return;
        const normalizedSalesTypes = data.map((salesType) => ({
          objectId: salesType.objectId,
          title: salesType.title,
          internalCode: salesType.internalCode,
          sepidarCode: salesType.sepidarCode,
        }));
        if (quotationSalesTypeFallback) {
          const exists = normalizedSalesTypes.some(
            (salesType) => getSalesTypeOptionKey(salesType) === getSalesTypeOptionKey(quotationSalesTypeFallback),
          );
          if (!exists) {
            normalizedSalesTypes.push({
              objectId: quotationSalesTypeFallback.objectId,
              title: quotationSalesTypeFallback.title,
              internalCode: quotationSalesTypeFallback.internalCode ?? null,
              sepidarCode: quotationSalesTypeFallback.sepidarCode ?? null,
            });
          }
        }
        setSalesTypes(normalizedSalesTypes);
        if (!selectedSalesTypeId && initialQuotation) {
          const nextSelected = getQuotationSalesTypeOptionKey(initialQuotation);
          if (nextSelected) setSelectedSalesTypeId(nextSelected);
        }
      } catch {
        if (mounted) setSalesTypes([]);
      }
    }
    async function loadCustomers() {
      setIsLoadingCustomers(true);
      setCustomerError("");
      try {
        const data = await listAssignedCustomersForExpert(getStoredCurrentUser()?.objectId);
        if (!mounted) return;
        const normalizedCustomers = [...data];
        if (
          quotationCustomerFallback &&
          !normalizedCustomers.some(
            (customer) => customer.objectId === quotationCustomerFallback.objectId,
          )
        ) {
          normalizedCustomers.unshift(quotationCustomerFallback);
        }
        setCustomers(normalizedCustomers);
        if (!selectedCustomerId && data.length === 1) {
          setSelectedCustomerId(data[0].objectId);
        }
      } catch (loadError) {
        if (mounted) setCustomerError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoadingCustomers(false);
      }
    }
    loadSalesTypes();
    loadCustomers();
    return () => {
      mounted = false;
    };
  }, [
    initialQuotation,
    initialQuotation?.salesTypeObjectId,
    quotationCustomerFallback,
    quotationSalesTypeFallback,
    selectedCustomerId,
    selectedSalesTypeId,
  ]);

  const selectedCustomer = useMemo(
    () =>
      customers.find((customer) => customer.objectId === selectedCustomerId) ??
      (quotationCustomerFallback && quotationCustomerFallback.objectId === selectedCustomerId
        ? quotationCustomerFallback
        : null),
    [customers, quotationCustomerFallback, selectedCustomerId],
  );
  const stockOptions = useMemo(() => {
    if (selectedCustomer?.allowedStocks?.length) {
      return selectedCustomer.allowedStocks.map((stock: Customer["allowedStocks"][number]) => ({
        value: stock.objectId,
        label: stock.title || stock.objectId,
      }));
    }
    return (selectedCustomer?.allowedStockObjectIds || []).map((objectId: string, index: number) => ({
      value: objectId,
      label: selectedCustomer?.allowedStockTitles?.[index] || objectId,
    }));
  }, [selectedCustomer]);

  const effectiveStockObjectId = stockOptions.some((option: PriceListOption) => option.value === selectedStockObjectId)
    ? selectedStockObjectId
    : stockOptions.length === 1 ? stockOptions[0].value : "";

  const priceListOptions = useMemo(() => {
    const options: PriceListOption[] = [];
    const seen = new Set<string>();
    const addOption = (value: string | null | undefined, label: string | null | undefined) => {
      if (!value || seen.has(value)) return;
      seen.add(value);
      options.push({ value, label: label || value });
    };
    const priceLists: Array<{
      objectId: string;
      title?: string | null;
      displayName?: string | null;
      name?: string | null;
    }> = selectedCustomer?.priceLists || [];
    priceLists.forEach((priceList: (typeof priceLists)[number]) => {
      addOption(priceList.objectId, priceList.title || priceList.displayName || priceList.name);
    });
    addOption(selectedCustomer?.priceListId, selectedCustomer?.priceListTitle);
    // if (!options.length && selectedCustomer?.saleType?.objectId) {
    //   addOption(selectedCustomer.priceListId || selectedCustomer.saleType.objectId, selectedCustomer.saleType.title);
    // }
    return options;
  }, [selectedCustomer]);
  const mergedSalesTypes = useMemo(() => {
    const map = new Map<string, SalesTypeOption>();
    salesTypes.forEach((salesType) => {
      map.set(salesType.objectId, salesType);
    });
    if (
      quotationSalesTypeFallback &&
      !map.has(quotationSalesTypeFallback.objectId) &&
      (quotationSalesTypeFallback.objectId ||
        quotationSalesTypeFallback.title ||
        quotationSalesTypeFallback.internalCode !== null ||
        quotationSalesTypeFallback.sepidarCode !== null)
    ) {
      map.set(quotationSalesTypeFallback.objectId, quotationSalesTypeFallback);
    }
    return Array.from(map.values());
  }, [quotationSalesTypeFallback, salesTypes]);
  const selectedSalesType = useMemo(
    () =>
      mergedSalesTypes.find((salesType) => getSalesTypeOptionKey(salesType) === selectedSalesTypeId) ||
      quotationSalesTypeFallback ||
      null,
    [mergedSalesTypes, quotationSalesTypeFallback, selectedSalesTypeId],
  );

  useEffect(() => {
    if (!selectedCustomer) {
      if (quotationCustomerFallback && quotationCustomerFallback.objectId === selectedCustomerId) {
        const fallbackPriceLists = quotationCustomerFallback.priceLists || [];
        const fallbackOptions = fallbackPriceLists
          .map((priceList: { objectId: string; title?: string | null; displayName?: string | null; name?: string | null }) => ({
            value: priceList.objectId,
            label: priceList.title || priceList.displayName || priceList.name,
          }))
          .filter((option: { value: string; label: string }) => Boolean(option.value));
        if (fallbackPriceLists.length) {
          // Keep the stored draft selection when asynchronously loaded assignment data arrives.
          // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPriceListId((current: string) => {
            if (current && fallbackOptions.some((option: { value: string; label: string }) => option.value === current)) return current;
            return (
              initialQuotation?.priceListObjectId &&
              fallbackOptions.some((option: { value: string; label: string }) => option.value === initialQuotation.priceListObjectId)
            )
              ? initialQuotation.priceListObjectId
              : fallbackOptions[0].value;
          });
          return;
        }
      }
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
  }, [
    initialQuotation?.priceListObjectId,
    priceListOptions,
    quotationCustomerFallback,
    selectedCustomer,
    selectedCustomerId,
  ]);

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
            stockObjectId: effectiveStockObjectId || undefined,
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
  }, [effectiveStockObjectId, initialQuotation, mode, selectedCustomerId, selectedPriceListId]);

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
          const lineTotal = Math.max(0, lineSubtotal);
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
  const calculatedAdjustments = adjustments.map((item) => ({
    ...item,
    amount: subtotal * (item.percentage / 100),
  }));
  const deductionTotal = calculatedAdjustments
    .filter((item) => item.type === "deduction")
    .reduce((sum, item) => sum + item.amount, 0);
  const additionTotal = calculatedAdjustments
    .filter((item) => item.type === "addition")
    .reduce((sum, item) => sum + item.amount, 0);
  const total = Math.max(0, subtotal - deductionTotal + additionTotal);
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
    if (!selectedSalesTypeId) {
      setError("لطفاً روش پرداخت را انتخاب کنید.");
      return;
    }
    if (!selectedPriceListId) {
      setError("لطفاً لیست قیمت را انتخاب کنید.");
      return;
    }
    if (!effectiveStockObjectId) {
      setError("لطفاً انبار درخواست را انتخاب کنید.");
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
      } else if (row.productId && row.quantity > Number(productsById[row.productId]?.availableForSale || 0)) {
        rowErrors.quantity = `حداکثر موجودی قابل فروش ${formatNumber(productsById[row.productId]?.availableForSale || 0)} است.`;
      }
      if (Object.keys(rowErrors).length) {
        nextRowErrors[row.rowId] = rowErrors;
      }
    }

    if (Object.keys(nextRowErrors).length) {
      setRowErrors(nextRowErrors);
      return;
    }

    const requestedByProduct = resolvedRows.reduce<Record<string, number>>((result, row) => {
      result[row.productId] = (result[row.productId] || 0) + row.quantity;
      return result;
    }, {});
    const overAvailableProduct = Object.entries(requestedByProduct).find(
      ([productId, quantity]) => quantity > Number(productsById[productId]?.availableForSale || 0),
    );
    if (overAvailableProduct) {
      const [productId, quantity] = overAvailableProduct;
      const product = productsById[productId];
      setError(`${product?.name || "کالا"}: درخواستی ${formatNumber(quantity)}، قابل فروش ${formatNumber(product?.availableForSale || 0)}`);
      return;
    }
    if (adjustments.some((item) => !item.title.trim())) {
      setError("عنوان مورد سفارشی تخفیف/اضافه را وارد کنید.");
      return;
    }

    try {
      await onSubmit(
        buildQuotationSubmitPayload({
          selectedCustomerId,
          selectedSalesTypeId,
          selectedSalesType: selectedSalesType ?? null,
          selectedPriceListId,
          notes,
          selectedValidUntil,
          discountPercentage: 0,
          taxPercentage: 0,
          stockObjectId: effectiveStockObjectId,
          adjustments: adjustments.map(({ title, percentage, type }) => ({ title, percentage, type })),
          status,
          rows: resolvedRows,
        }),
      );
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.code === "INSUFFICIENT_AVAILABLE_FOR_SALE") {
        const shortages = (submitError.details as { shortages?: Array<{ productName?: string; requestedQuantity?: number; availableForSale?: number }> } | null)?.shortages || [];
        if (shortages.length) {
          setError(shortages.map((item) => `${item.productName || "کالا"}: درخواستی ${formatNumber(item.requestedQuantity || 0)}، قابل فروش ${formatNumber(item.availableForSale || 0)}`).join(" | "));
          return;
        }
      }
      setError(getErrorMessage(submitError));
    }
  };

  if (isLoadingCustomers) {
    return <LoadingState title="در حال دریافت مشتری‌ها" />;
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="p-5">
        {error ? <div className="mb-4"><InlineErrorMessage message={error} /></div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-[#334155]">
            <span>مشتری</span>
            <SearchableSelect
              value={selectedCustomerId || undefined}
              onValueChange={(value) => {
                setSelectedCustomerId(value);
                setRows([createEmptyRow(0)]);
                setProducts([]);
                setSelectedPriceListId("");
              }}
            options={
              quotationCustomerFallback &&
              !customers.some(
                (customer) => customer.objectId === quotationCustomerFallback.objectId,
              )
                ? [
                    {
                      value: quotationCustomerFallback.objectId,
                      label: [
                        quotationCustomerFallback.sepidarCustomerCode ||
                          quotationCustomerFallback.id,
                        quotationCustomerFallback.fullName,
                      ]
                        .filter(Boolean)
                        .join(" - "),
                    },
                    ...customers.map((customer) => ({
                      value: customer.objectId,
                      label: [
                        customer.sepidarCustomerCode || customer.id,
                        customer.fullName,
                      ]
                        .filter(Boolean)
                        .join(" - "),
                    })),
                  ]
                : customers.map((customer) => ({
                    value: customer.objectId,
                    label: [
                      customer.sepidarCustomerCode || customer.id,
                      customer.fullName,
                    ]
                      .filter(Boolean)
                      .join(" - "),
                  }))
            }
            placeholder="انتخاب مشتری"
            searchPlaceholder="جستجو در مشتری‌ها"
            emptyMessage={assignedCustomersOnly ? "مشتری پیدا نشد" : "مشتری یافت نشد"}
          />
            <FieldError message={customerError} />
          </label>
          <label className="grid content-start gap-1.5 text-sm font-medium text-[#334155]">    
          <span>روش پرداخت</span>
            <SearchableSelect
              value={selectedSalesTypeId || undefined}
              onValueChange={setSelectedSalesTypeId}
          options={mergedSalesTypes.map((salesType) => ({
                value: getSalesTypeOptionKey(salesType),
                label: salesType.title,
                searchText: [salesType.title, salesType.internalCode]
                  .filter(Boolean)
                  .join(" "),
              }))}
              placeholder="انتخاب روش پرداخت"
              searchPlaceholder="جستجو در روش پرداخت"
              emptyMessage="روش پرداختی پیدا نشد"
            />
          </label>
          <label className="grid content-start gap-1.5 text-sm font-medium text-[#334155]">  
            <span>لیست قیمت</span>
            <SearchableSelect
              value={selectedPriceListId || undefined}
              onValueChange={setSelectedPriceListId}
              options={priceListOptions}
              placeholder="انتخاب لیست قیمت"
              searchPlaceholder="جستجو در لیست قیمت"
              emptyMessage="لیست قیمتی پیدا نشد"
              disabled={!selectedCustomerId || priceListOptions.length === 0}
            />
          </label>
          <label className="grid content-start gap-1.5 text-sm font-medium text-[#334155]">
            <span>انبار درخواست</span>
            <SearchableSelect
              value={effectiveStockObjectId || undefined}
              onValueChange={setSelectedStockObjectId}
              options={stockOptions}
              placeholder="انتخاب انبار"
              searchPlaceholder="جستجو در انبارها"
              emptyMessage="انبار مجازی برای این مشتری یافت نشد"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-[#334155]">
            <JalaliDateInput
              value={selectedValidUntil}
              onChange={setSelectedValidUntil}
              placeholder="انتخاب تاریخ اعتبار"
              label="اعتبار تا تاریخ"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-[#334155] md:col-span-2">
            <span>توضیحات</span>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="یادداشت‌های درخواست فروش"
            />
          </label>
        </div>

        <div className="mt-6 space-y-3 rounded-lg border border-[#E5E7EB] bg-[#FBFCFD] p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[#1F3A5F] dark:text-slate-100">تخفیف‌ها، اضافات و کسورات</h3>
              <p className="mt-1 text-xs text-[#64748B]">درصد هر مورد روی جمع مبلغ کالاها محاسبه می‌شود.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setAdjustments((current) => [...current, { rowId: `adjustment-${Date.now()}`, title: ADJUSTMENT_PRESETS[0], percentage: 0, type: "deduction" }])}>
              <PlusCircle className="ml-2 size-4" /> افزودن
            </Button>
          </div>
          {adjustments.length === 0 ? <p className="rounded-md border border-dashed p-4 text-center text-sm text-[#64748B]">شرط مالی ثبت نشده است.</p> : null}
          {adjustments.map((adjustment) => (
            <div key={adjustment.rowId} className="grid gap-3 rounded-md border bg-white p-3 dark:border-slate-700 dark:bg-slate-950 sm:grid-cols-[1fr_150px_130px_40px]">
              <div className="grid gap-2">
                <SearchableSelect value={ADJUSTMENT_PRESETS.includes(adjustment.title) ? adjustment.title : "سایر"} onValueChange={(value) => setAdjustments((current) => current.map((item) => item.rowId === adjustment.rowId ? { ...item, title: value === "سایر" ? "" : value } : item))} options={ADJUSTMENT_PRESETS.map((title) => ({ value: title, label: title }))} placeholder="عنوان" searchPlaceholder="جستجوی عنوان" emptyMessage="عنوانی یافت نشد" />
                {!ADJUSTMENT_PRESETS.includes(adjustment.title) || !adjustment.title ? <Input value={adjustment.title} onChange={(event) => setAdjustments((current) => current.map((item) => item.rowId === adjustment.rowId ? { ...item, title: event.target.value } : item))} placeholder="عنوان دلخواه" /> : null}
              </div>
              <Input type="number" min={0} max={100} value={adjustment.percentage} onChange={(event) => setAdjustments((current) => current.map((item) => item.rowId === adjustment.rowId ? { ...item, percentage: Math.min(100, Math.max(0, toNumber(normalizeDigits(event.target.value)))) } : item))} placeholder="درصد" />
              <Button type="button" variant="outline" onClick={() => setAdjustments((current) => current.map((item) => item.rowId === adjustment.rowId ? { ...item, type: item.type === "deduction" ? "addition" : "deduction" } : item))}>
                {adjustment.type === "deduction" ? <CircleMinus className="ml-2 size-4 text-red-600" /> : <CirclePlus className="ml-2 size-4 text-emerald-600" />}
                {adjustment.type === "deduction" ? "کسورات" : "اضافات"}
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setAdjustments((current) => current.filter((item) => item.rowId !== adjustment.rowId))}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[#1F3A5F]">اقلام درخواست فروش</h3>
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
              const lineTotal = Math.max(0, row.quantity * unitPrice);
              return (
                <div
                  key={row.rowId}
                  className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-4"
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
                  <div className="grid gap-3 sm:grid-cols-[120px_140px_140px_auto] xl:grid-cols-[120px_140px_140px_auto]">
                    <div>
                      <Input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(event) => updateRow(row.rowId, { quantity: toNumber(event.target.value) })}
                        placeholder="تعداد"
                      />
                      <FieldError message={rowErrors[row.rowId]?.quantity} />
                      {product ? <p className="mt-1 text-xs text-[#64748B]">قابل فروش: {formatNumber(product.availableForSale || 0)}</p> : null}
                    </div>
                    <Input value={formatCurrency(unitPrice)} readOnly disabled />
                    <Input value={formatCurrency(lineTotal)} readOnly disabled />
                    <div className="flex items-center justify-end">
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
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="text-base font-semibold text-[#1F3A5F]">خلاصه درخواست فروش</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <SummaryRow label="مشتری" value={selectedCustomer?.fullName || "-"} />
            {selectedSalesTypeId ? (
              <SummaryRow
                label="روش پرداخت"
                value={
                  salesTypes.find((salesType) => getSalesTypeOptionKey(salesType) === selectedSalesTypeId)?.title ||
                  selectedSalesTypeId
                }
              />
            ) : null}
            {selectedPriceListId ? (
              <SummaryRow
                label="لیست قیمت"
                value={
                  priceListOptions.find((option) => option.value === selectedPriceListId)?.label ||
                  selectedPriceListId
                }
              />
            ) : null}
            <SummaryRow label="تعداد آیتم" value={formatNumber(itemCount)} />
            <SummaryRow label="جمع تعداد" value={formatNumber(totalQuantity)} />
            <SummaryRow label="جمع مبلغ اقلام" value={formatCurrency(subtotal)} />
            {calculatedAdjustments.map((item) => <SummaryRow key={item.rowId} label={`${item.type === "addition" ? "+" : "-"} ${item.title || "بدون عنوان"} ${formatNumber(item.percentage)}٪`} value={formatCurrency(item.amount)} />)}
            <SummaryRow label="مجموع کسورات" value={formatCurrency(deductionTotal)} />
            <SummaryRow label="مجموع اضافات" value={formatCurrency(additionTotal)} />
            <SummaryRow label="مبلغ نهایی" value={formatCurrency(total)} />
          </dl>
        </Card>

        <div className="sticky bottom-4 flex flex-col gap-3 rounded-lg border bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              انصراف
            </Button>
          ) : null}
          <Button type="button" disabled={isSubmitting} onClick={() => submit("draft")}>
            {submitLabel}
          </Button>
          <Button type="button" disabled={isSubmitting} variant="secondary" onClick={() => submit("finalized")}>
            نهایی‌سازی درخواست
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
  };
}

function getSalesTypeOptionKey(option?: SalesTypeOption | null): string {
  if (!option) return "";
  if (option.sepidarCode !== null && option.sepidarCode !== undefined) {
    return String(option.sepidarCode);
  }
  if (option.internalCode !== null && option.internalCode !== undefined) {
    return String(option.internalCode);
  }
  return option.objectId || "";
}

function mapQuotationItems(items: SalesQuotationItem[]): DraftRow[] {
  return items.length
      ? items.map((item, index) => ({
        rowId: `quotation-${index}-${item.productObjectId}`,
        productId: item.productObjectId,
        quantity: item.quantity,
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
