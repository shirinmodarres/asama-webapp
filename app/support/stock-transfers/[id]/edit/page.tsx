"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  Boxes,
  PackageOpen,
  Plus,
  Save,
  Trash2,
  Warehouse,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { TransferStatusBadge } from "@/components/stock-transfer/transfer-status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { Product } from "@/lib/models/product.model";
import type { SepidarStock, StockTransferRequest } from "@/lib/models/stock.model";
import { listProducts } from "@/lib/services/product.service";
import {
  getSupportStockTransfer,
  listSupportStocks,
  updateStockTransfer,
} from "@/lib/services/stock.service";
import { formatFaDigits, toNumber } from "@/lib/utils/number-format";

interface EditableTransferItem {
  productObjectId: string;
  quantity: string;
}

type FieldErrors = Record<string, string>;

const editableStatuses = new Set(["pending", "pending_manager_approval"]);

export default function EditSupportStockTransferPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [transfer, setTransfer] = useState<StockTransferRequest | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [items, setItems] = useState<EditableTransferItem[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [loaded, productRows, stockRows] = await Promise.all([
          getSupportStockTransfer(params.id),
          listProducts("support"),
          listSupportStocks(),
        ]);
        if (!mounted) return;
        setTransfer(loaded);
        setProducts(productRows);
        setStocks(stockRows);
        setSource(loaded.sourceStockObjectId || "");
        setDestination(loaded.destinationStockObjectId || "");
        setItems(
          loaded.items.map((item) => ({
            productObjectId: item.productObjectId,
            quantity: String(item.quantity),
          })),
        );
      } catch (reason) {
        if (mounted) setError(getErrorMessage(reason));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const canEdit = Boolean(transfer && editableStatuses.has(transfer.status));
  const stockOptions = useMemo(
    () =>
      stocks
        .filter((stock) => stock.isActive)
        .map((stock) => ({
          value: stock.objectId,
          label: `${formatFaDigits(stock.code || "-")} - ${stock.title}`,
          searchText: `${stock.code || ""} ${stock.title}`,
        })),
    [stocks],
  );
  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.objectId,
        label: `${formatFaDigits(product.sepidarCode || product.sku || "-")} - ${formatFaDigits(product.name)}`,
        description: product.brandName || product.brand || undefined,
        searchText: [
          product.name,
          product.sepidarCode,
          product.sku,
          product.brandName,
          product.brand,
        ]
          .filter(Boolean)
          .join(" "),
      })),
    [products],
  );
  const sourceStock = stocks.find((stock) => stock.objectId === source);
  const destinationStock = stocks.find((stock) => stock.objectId === destination);
  const totalQuantity = items.reduce(
    (sum, item) => sum + Math.max(0, toNumber(item.quantity)),
    0,
  );

  const updateItem = (index: number, patch: Partial<EditableTransferItem>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
    setFieldErrors((current) => ({
      ...current,
      [`item-${index}-product`]: "",
      [`item-${index}-quantity`]: "",
      items: "",
    }));
  };

  const addItem = () => {
    setItems((current) => [...current, { productObjectId: "", quantity: "1" }]);
    setFieldErrors((current) => ({ ...current, items: "" }));
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setFieldErrors({});
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!source) nextErrors.source = "لطفاً انبار مبدأ را انتخاب کنید.";
    if (!destination) {
      nextErrors.destination = "لطفاً انبار مقصد را انتخاب کنید.";
    } else if (source === destination) {
      nextErrors.destination = "انبار مبدأ و مقصد باید متفاوت باشند.";
    }
    if (!items.length) nextErrors.items = "حداقل یک کالا برای انتقال لازم است.";
    items.forEach((item, index) => {
      if (!item.productObjectId) {
        nextErrors[`item-${index}-product`] = "کالا را انتخاب کنید.";
      }
      if (toNumber(item.quantity) <= 0) {
        nextErrors[`item-${index}-quantity`] = "تعداد باید بیشتر از صفر باشد.";
      }
    });
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!transfer || !canEdit || saving || !validate()) return;

    setSaving(true);
    setError("");
    try {
      await updateStockTransfer(transfer.objectId, {
        sourceStockObjectId: source,
        destinationStockObjectId: destination,
        items: items.map((item) => ({
          productObjectId: item.productObjectId,
          quantity: toNumber(item.quantity),
        })),
      });
      router.push(`/support/stock-transfers/${transfer.objectId}`);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ویرایش انتقال">
      <div className="mx-auto max-w-6xl space-y-5" dir="rtl">
        <SectionHeader
          title="ویرایش درخواست انتقال"
          description="مسیر انتقال و اقلام درخواست را پیش از تأیید مدیر بررسی و اصلاح کنید."
          actions={
            <Button asChild type="button" variant="outline">
              <Link href={`/support/stock-transfers/${params.id}`}>
                <ArrowRight className="size-4" />
                بازگشت
              </Link>
            </Button>
          }
        />

        {isLoading ? (
          <LoadingState
            title="در حال دریافت درخواست انتقال"
            description="اطلاعات انتقال، انبارها و کالاها در حال آماده‌سازی است."
          />
        ) : !transfer ? (
          error ? (
            <PageErrorMessage title="دریافت انتقال انجام نشد" message={error} />
          ) : (
            <EmptyState
              title="درخواست انتقال یافت نشد"
              description="شناسه درخواست انتقال معتبر نیست."
            />
          )
        ) : (
          <form onSubmit={save} className="space-y-5">
            {error ? <InlineErrorMessage message={error} /> : null}

            <Card className="p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EEF4F8] text-[#1F3A5F] dark:bg-slate-800 dark:text-slate-200">
                    <ArrowLeftRight className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400">شناسه انتقال</p>
                    <h2 className="mt-1 text-lg font-bold text-[#102034] dark:text-slate-100">
                      {formatFaDigits(transfer.objectId)}
                    </h2>
                  </div>
                </div>
                <TransferStatusBadge status={transfer.status} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <SummaryItem label="ثبت‌کننده" value={transfer.requestedByName || "-"} />
                <SummaryItem
                  label="تاریخ ثبت"
                  value={transfer.requestedAt ? formatDateTime(transfer.requestedAt) : "-"}
                />
                <SummaryItem label="مجموع تعداد" value={`${formatNumber(totalQuantity)} واحد`} />
              </div>

              {!canEdit ? (
                <div className="mt-5 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
                  این انتقال از مرحله ویرایش عبور کرده است و اطلاعات آن فقط قابل مشاهده است.
                </div>
              ) : null}
            </Card>

            <Card className="dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-[#E9EEF3] px-5 py-4 dark:border-slate-700 sm:px-6">
                <div className="flex items-center gap-3">
                  <Warehouse className="size-5 text-[#1F3A5F] dark:text-slate-300" />
                  <div>
                    <h2 className="font-bold text-[#102034] dark:text-slate-100">مسیر انتقال</h2>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                      انبار مبدأ و مقصد درخواست را مشخص کنید.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] lg:items-start">
                <TransferStockField
                  label="انبار مبدأ"
                  value={source}
                  options={stockOptions}
                  placeholder="انتخاب انبار مبدأ"
                  error={fieldErrors.source}
                  disabled={!canEdit || saving}
                  onChange={(value) => {
                    setSource(value);
                    setFieldErrors((current) => ({
                      ...current,
                      source: "",
                      destination: value === destination ? "انبار مبدأ و مقصد باید متفاوت باشند." : "",
                    }));
                  }}
                  stockCode={sourceStock?.code}
                />

                <div className="hidden h-11 items-center justify-center self-end text-[#94A3B8] lg:flex">
                  <ArrowLeftRight className="size-5" />
                </div>

                <TransferStockField
                  label="انبار مقصد"
                  value={destination}
                  options={stockOptions}
                  placeholder="انتخاب انبار مقصد"
                  error={fieldErrors.destination}
                  disabled={!canEdit || saving}
                  onChange={(value) => {
                    setDestination(value);
                    setFieldErrors((current) => ({ ...current, destination: "" }));
                  }}
                  stockCode={destinationStock?.code}
                />
              </div>
            </Card>

            <Card className="dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9EEF3] px-5 py-4 dark:border-slate-700 sm:px-6">
                <div className="flex items-center gap-3">
                  <Boxes className="size-5 text-[#1F3A5F] dark:text-slate-300" />
                  <div>
                    <h2 className="font-bold text-[#102034] dark:text-slate-100">اقلام انتقال</h2>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                      {formatNumber(items.length)} ردیف، مجموع {formatNumber(totalQuantity)} واحد
                    </p>
                  </div>
                </div>
                {canEdit ? (
                  <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={saving}>
                    <Plus className="size-4" />
                    افزودن کالا
                  </Button>
                ) : null}
              </div>

              {items.length ? (
                <div className="p-4 sm:p-6">
                  <div className="hidden overflow-hidden rounded-[14px] border border-[#E5EAF0] dark:border-slate-700 md:block">
                    <div className="grid grid-cols-[64px_minmax(0,1fr)_160px_64px] bg-[#F8FAFC] px-4 py-3 text-xs font-semibold text-[#64748B] dark:bg-slate-800 dark:text-slate-300">
                      <span>ردیف</span>
                      <span>کالا</span>
                      <span>تعداد</span>
                      <span className="text-center">عملیات</span>
                    </div>
                    <div className="divide-y divide-[#EEF2F6] dark:divide-slate-700">
                      {items.map((item, index) => (
                        <DesktopItemRow
                          key={`${index}-${item.productObjectId}`}
                          item={item}
                          index={index}
                          productOptions={productOptions}
                          fieldErrors={fieldErrors}
                          disabled={!canEdit || saving}
                          onUpdate={updateItem}
                          onRemove={removeItem}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {items.map((item, index) => (
                      <MobileItemCard
                        key={`${index}-${item.productObjectId}`}
                        item={item}
                        index={index}
                        productOptions={productOptions}
                        fieldErrors={fieldErrors}
                        disabled={!canEdit || saving}
                        onUpdate={updateItem}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-5 py-10 text-center sm:px-6">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-[14px] bg-[#F3F7FB] text-[#1F3A5F] dark:bg-slate-800 dark:text-slate-300">
                    <PackageOpen className="size-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#102034] dark:text-slate-100">
                    کالایی در این انتقال ثبت نشده است
                  </p>
                  <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                    برای ادامه حداقل یک کالا به درخواست اضافه کنید.
                  </p>
                  {canEdit ? (
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addItem}>
                      <Plus className="size-4" />
                      افزودن اولین کالا
                    </Button>
                  ) : null}
                </div>
              )}
              <div className="px-5 pb-4 sm:px-6">
                <FieldError message={fieldErrors.items} />
              </div>
            </Card>

            <div className="sticky bottom-4 z-30">
              <Card className="border-[#CBD8E5] bg-white/95 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[#64748B] dark:text-slate-400">
                    <span className="font-semibold text-[#102034] dark:text-slate-100">
                      {formatNumber(items.length)} کالا
                    </span>{" "}
                    با مجموع {formatNumber(totalQuantity)} واحد
                  </div>
                  <div className="flex gap-2">
                    <Button asChild type="button" variant="outline" className="flex-1 sm:flex-none">
                      <Link href={`/support/stock-transfers/${transfer.objectId}`}>انصراف</Link>
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 gap-2 sm:min-w-40 sm:flex-none"
                      disabled={!canEdit || saving}
                    >
                      <Save className="size-4" />
                      {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

type ProductOption = {
  value: string;
  label: string;
  description?: string;
  searchText: string;
};

interface ItemEditorProps {
  item: EditableTransferItem;
  index: number;
  productOptions: ProductOption[];
  fieldErrors: FieldErrors;
  disabled: boolean;
  onUpdate: (index: number, patch: Partial<EditableTransferItem>) => void;
  onRemove: (index: number) => void;
}

function DesktopItemRow(props: ItemEditorProps) {
  const { index, disabled, onRemove } = props;
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)_160px_64px] items-start gap-3 px-4 py-4">
      <span className="pt-3 text-sm font-semibold text-[#64748B] dark:text-slate-400">
        {formatNumber(index + 1)}
      </span>
      <ProductField {...props} />
      <QuantityField {...props} />
      <RemoveItemButton index={index} disabled={disabled} onRemove={onRemove} />
    </div>
  );
}

function MobileItemCard(props: ItemEditorProps) {
  const { index, disabled, onRemove } = props;
  return (
    <div className="rounded-[14px] border border-[#E5EAF0] p-4 dark:border-slate-700">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#102034] dark:text-slate-100">
          کالای {formatNumber(index + 1)}
        </span>
        <RemoveItemButton index={index} disabled={disabled} onRemove={onRemove} />
      </div>
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-[#334155] dark:text-slate-300">
          <span>کالا</span>
          <ProductField {...props} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#334155] dark:text-slate-300">
          <span>تعداد</span>
          <QuantityField {...props} />
        </label>
      </div>
    </div>
  );
}

function ProductField({ item, index, productOptions, fieldErrors, disabled, onUpdate }: ItemEditorProps) {
  return (
    <div>
      <SearchableSelect
        value={item.productObjectId || undefined}
        onValueChange={(value) => onUpdate(index, { productObjectId: value })}
        options={productOptions}
        placeholder="انتخاب کالا"
        searchPlaceholder="جستجو با نام یا کد کالا"
        emptyMessage="کالایی پیدا نشد"
        invalid={Boolean(fieldErrors[`item-${index}-product`])}
        disabled={disabled}
        normalizeSearch
      />
      <FieldError message={fieldErrors[`item-${index}-product`]} />
    </div>
  );
}

function QuantityField({ item, index, fieldErrors, disabled, onUpdate }: ItemEditorProps) {
  return (
    <div>
      <Input
        inputMode="numeric"
        min={1}
        value={item.quantity}
        onChange={(event) => onUpdate(index, { quantity: event.target.value })}
        aria-invalid={Boolean(fieldErrors[`item-${index}-quantity`])}
        disabled={disabled}
      />
      <FieldError message={fieldErrors[`item-${index}-quantity`]} />
    </div>
  );
}

function RemoveItemButton({ index, disabled, onRemove }: Pick<ItemEditorProps, "index" | "disabled" | "onRemove">) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="mt-0.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
      aria-label={`حذف ردیف ${index + 1}`}
      onClick={() => onRemove(index)}
      disabled={disabled}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-[#E5EAF0] bg-[#FBFCFD] px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="text-xs text-[#64748B] dark:text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#102034] dark:text-slate-100">{value}</p>
    </div>
  );
}

function TransferStockField({
  label,
  value,
  options,
  placeholder,
  error,
  disabled,
  onChange,
  stockCode,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; searchText?: string }>;
  placeholder: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  stockCode?: string | number | null;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#334155] dark:text-slate-300">
      <span>{label}</span>
      <SearchableSelect
        value={value || undefined}
        onValueChange={onChange}
        options={options}
        placeholder={placeholder}
        searchPlaceholder="جستجو در انبارها"
        emptyMessage="انباری پیدا نشد"
        invalid={Boolean(error)}
        disabled={disabled}
        normalizeSearch
      />
      <FieldError message={error} />
      {value && stockCode ? (
        <span className="text-xs font-normal text-[#64748B] dark:text-slate-400">
          کد انبار: {formatFaDigits(stockCode)}
        </span>
      ) : null}
    </label>
  );
}
