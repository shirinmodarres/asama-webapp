"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlusCircle, Trash2, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import { getErrorMessage } from "@/lib/api/api-error";
import { listStoreExpertCustomers } from "@/lib/services/store-expert-customer.service";
import {
  customerOptions,
  createStoreOrder,
  getStoreOrderOptions,
  type StoreOrderSubmission,
  type StoreOrderOptions,
  type StoreProductOption,
} from "@/lib/services/store-expert-order.service";
import { toNumber } from "@/lib/utils/number-format";

type DraftRow = { id: string; productObjectId: string; quantity: number };

const createUuid = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10).join(""),
  ].join("-");
};

const emptyRow = (): DraftRow => ({
  id: createUuid(),
  productObjectId: "",
  quantity: 1,
});
export function StoreOrderForm() {
  const [customers, setCustomers] = useState<
    Awaited<ReturnType<typeof listStoreExpertCustomers>>["items"]
  >([]);
  const [options, setOptions] = useState<StoreOrderOptions | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [products, setProducts] = useState<StoreProductOption[]>([]);
  const [rows, setRows] = useState<DraftRow[]>([emptyRow()]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<StoreOrderSubmission | null>(null);
  const [error, setError] = useState("");
  const operationKeyRef = useRef<string | null>(null);

  useEffect(() => {
    void listStoreExpertCustomers({ limit: 20, offset: 0 })
      .then((result) => setCustomers(result.items))
      .catch((reason) => setError(getErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) return;
    let active = true;
    void getStoreOrderOptions({ customerObjectId: selectedCustomerId })
      .then((result) => {
        if (!active) return;
        setOptions(result);
        setSelectedStockId("");
        setSelectedBrand("");
        setProducts([]);
        setRows([emptyRow()]);
      })
      .catch((reason) => active && setError(getErrorMessage(reason)))
      .finally(() => active && setLoadingProducts(false));
    return () => {
      active = false;
    };
  }, [selectedCustomerId]);

  useEffect(() => {
    if (!selectedCustomerId || !selectedStockId || !selectedBrand) return;
    let active = true;
    void getStoreOrderOptions({
      customerObjectId: selectedCustomerId,
      stockObjectId: selectedStockId,
      brandName: selectedBrand,
    })
      .then((result) => {
        if (!active) return;
        setOptions(result);
        setProducts(result.products);
        setRows([emptyRow()]);
      })
      .catch((reason) => active && setError(getErrorMessage(reason)))
      .finally(() => active && setLoadingProducts(false));
    return () => {
      active = false;
    };
  }, [selectedCustomerId, selectedStockId, selectedBrand]);

  const productsById = useMemo(
    () =>
      new Map(products.map((product) => [product.productObjectId, product])),
    [products],
  );
  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.productObjectId,
        label: `${product.productCode || "-"} - ${product.productName}`,
        description: `قابل فروش: ${formatNumber(product.availableForSale)}`,
        searchText: `${product.productCode || ""} ${product.productName}`,
      })),
    [products],
  );
  const productLoadOptions = useCallback(
    async (query: string) => {
      if (!selectedCustomerId || !selectedStockId || !selectedBrand) return [];
      const result = await getStoreOrderOptions({
        customerObjectId: selectedCustomerId,
        stockObjectId: selectedStockId,
        brandName: selectedBrand,
        search: query,
      });
      setProducts((current) => {
        const byId = new Map(
          current.map((product) => [product.productObjectId, product]),
        );
        result.products.forEach((product) =>
          byId.set(product.productObjectId, product),
        );
        return [...byId.values()];
      });
      return result.products.map((product) => ({
        value: product.productObjectId,
        label: `${product.productCode || "-"} - ${product.productName}`,
        description: `قابل فروش: ${formatNumber(product.availableForSale)}`,
        searchText: `${product.productCode || ""} ${product.productName}`,
      }));
    },
    [selectedBrand, selectedCustomerId, selectedStockId],
  );
  const selectedItems = rows
    .map((row) => ({ row, product: productsById.get(row.productObjectId) }))
    .filter((item) => item.product);
  const totalAmount = selectedItems.reduce(
    (sum, { row, product }) => sum + row.quantity * (product?.unitPrice || 0),
    0,
  );
  const creditInvalid = paymentMethod === "credit" && !paymentTerms.trim();
  const hasInvalidQuantity = selectedItems.some(
    ({ row, product }) =>
      row.quantity <= 0 || row.quantity > (product?.availableForSale || 0),
  );
  const hasIncompleteItem = rows.some(
    (row) => !row.productObjectId || !productsById.has(row.productObjectId),
  );
  const canSubmit = Boolean(
    selectedCustomerId &&
    selectedStockId &&
    selectedBrand &&
    selectedItems.length &&
    !hasIncompleteItem &&
    !hasInvalidQuantity &&
    !creditInvalid &&
    !submitted,
  );

  const resetOperation = () => {
    window.sessionStorage.removeItem("asama:store-expert:order-operation");
    operationKeyRef.current = null;
    setSubmitted(null);
  };
  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    resetOperation();
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };
  const customerLoadOptions = useCallback(
    async (query: string) =>
      customerOptions(
        (
          await listStoreExpertCustomers({
            search: query,
            limit: 20,
            offset: 0,
          })
        ).items,
      ),
    [],
  );
  const selectCustomer = (value: string) => {
    resetOperation();
    setLoadingProducts(true);
    setError("");
    setSelectedCustomerId(value);
    setOptions(null);
    setSelectedStockId("");
    setSelectedBrand("");
    setProducts([]);
    setRows([emptyRow()]);
  };
  const selectStock = (value: string) => {
    resetOperation();
    setSelectedStockId(value);
    setSelectedBrand("");
    setProducts([]);
    setRows([emptyRow()]);
  };
  const selectBrand = (value: string) => {
    resetOperation();
    setLoadingProducts(true);
    setError("");
    setSelectedBrand(value);
    setProducts([]);
    setRows([emptyRow()]);
  };
  const operationKey = () => {
    if (operationKeyRef.current) return operationKeyRef.current;
    const storageKey = "asama:store-expert:order-operation";
    const stored = window.sessionStorage.getItem(storageKey);
    const next = stored || createUuid();
    window.sessionStorage.setItem(storageKey, next);
    operationKeyRef.current = next;
    return next;
  };
  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await createStoreOrder({
        operationKey: operationKey(),
        customerObjectId: selectedCustomerId,
        stockObjectId: selectedStockId,
        brandName: selectedBrand,
        paymentMethod,
        paymentTerms:
          paymentMethod === "credit" ? paymentTerms.trim() : undefined,
        items: selectedItems.map(({ row }) => ({
          productObjectId: row.productObjectId,
          quantity: row.quantity,
        })),
      });
      setSubmitted(result);
      if (result.status === "completed")
        window.sessionStorage.removeItem("asama:store-expert:order-operation");
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="min-w-0 p-5 md:p-6">
        {error ? <InlineErrorMessage message={error} /> : null}
        {loading ? (
          <LoadingState title="در حال دریافت مشتریان مادسنتر" />
        ) : null}
        <section className="border-b border-[var(--border)] py-5 first:pt-0 last:border-b-0">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">مشتری</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                فقط مشتریان گروه‌های مادسنتر قابل انتخاب هستند.
              </p>
            </div>
            <Button
              asChild
              type="button"
              variant="outline"
              size="default"
              className="gap-2"
            >
              <Link href="/store-expert/customers/new">
                <UserRoundPlus className="size-4" />
                ثبت مشتری جدید
              </Link>
            </Button>
          </div>
          <SearchableSelect
            value={selectedCustomerId || undefined}
            onValueChange={selectCustomer}
            onOptionChange={(option) =>
              setSelectedCustomerLabel(option?.label || "")
            }
            options={customerOptions(customers)}
            loadOptions={customerLoadOptions}
            placeholder="انتخاب مشتری"
            searchPlaceholder="نام، کد یا تلفن مشتری"
            emptyMessage="مشتری مادسنتری پیدا نشد"
          />
        </section>
        <section className="border-b border-[var(--border)] py-5 first:pt-0 last:border-b-0">
          <div className="mb-4">
            <h2 className="font-semibold text-[var(--foreground)]">
              انبار و برند
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              هر سفارش فقط از یک انبار و برای یک برند ثبت می‌شود.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SearchableSelect
              value={selectedStockId || undefined}
              onValueChange={selectStock}
              options={(options?.stocks || []).map((stock) => ({
                value: stock.objectId,
                label: stock.title,
                description: stock.code
                  ? `کد انبار: ${formatNumber(stock.code)}`
                  : undefined,
              }))}
              placeholder="انتخاب انبار"
              emptyMessage="انبار مجاز پیدا نشد"
              disabled={!selectedCustomerId}
            />
            <SearchableSelect
              value={selectedBrand || undefined}
              onValueChange={selectBrand}
              options={(options?.brands || []).map((brand) => ({
                value: brand.brandName,
                label: brand.brandName,
                description: brand.priceList.title,
              }))}
              placeholder="انتخاب برند"
              emptyMessage="برندی با لیست قیمت فروشگاه تعیین نشده است"
              disabled={!selectedStockId}
            />
          </div>
        </section>
        <section className="border-b border-[var(--border)] py-5 first:pt-0 last:border-b-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">کالاها</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                قیمت فقط از لیست قیمت برند خوانده می‌شود و قابل ویرایش نیست.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetOperation();
                setRows((current) => [...current, emptyRow()]);
              }}
              disabled={!products.length}
            >
              <PlusCircle className="size-4" />
              افزودن کالا
            </Button>
          </div>
          {loadingProducts ? (
            <LoadingState title="در حال بررسی لیست قیمت و موجودی" />
          ) : null}
          <div className="space-y-3">
            {rows.map((row) => {
              const product = productsById.get(row.productObjectId);
              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-[var(--border)] p-4"
                >
                  <div className="space-y-4">
                    {/* ردیف اول: انتخاب کالا و حذف */}
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <SearchableSelect
                          value={row.productObjectId || undefined}
                          onValueChange={(value) =>
                            updateRow(row.id, {
                              productObjectId: value,
                              quantity: 1,
                            })
                          }
                          options={productOptions}
                          loadOptions={productLoadOptions}
                          placeholder="انتخاب کالا"
                          searchPlaceholder="جستجو با نام یا کد کالا"
                          emptyMessage="کالای قابل فروش پیدا نشد"
                          disabled={!products.length}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={rows.length === 1}
                        onClick={() => {
                          resetOperation();
                          setRows((current) =>
                            current.filter((item) => item.id !== row.id),
                          );
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* ردیف دوم: اطلاعات کالا */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="grid gap-1.5 text-xs text-[var(--muted-foreground)]">
                        <span>تعداد</span>
                        <Input
                          inputMode="numeric"
                          value={formatNumber(row.quantity)}
                          onChange={(event) =>
                            updateRow(row.id, {
                              quantity: Math.max(
                                0,
                                toNumber(event.target.value),
                              ),
                            })
                          }
                        />
                      </label>

                      <label className="grid gap-1.5 text-xs text-[var(--muted-foreground)]">
                        <span>قیمت واحد</span>
                        <Input
                          disabled
                          readOnly
                          value={
                            product ? formatCurrency(product.unitPrice) : "-"
                          }
                        />
                      </label>

                      <label className="grid gap-1.5 text-xs text-[var(--muted-foreground)]">
                        <span>موجودی قابل فروش</span>
                        <Input
                          disabled
                          readOnly
                          value={
                            product
                              ? formatNumber(product.availableForSale)
                              : "-"
                          }
                        />
                      </label>
                    </div>
                  </div>
                  {product && row.quantity > product.availableForSale ? (
                    <p className="mt-2 text-xs text-destructive">
                      تعداد واردشده از موجودی قابل فروش بیشتر است.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
        <section className="border-b border-[var(--border)] py-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              روش پرداخت
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              نوع تسویه این سفارش را انتخاب کنید.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* پرداخت نقدی */}
            <button
              type="button"
              aria-pressed={paymentMethod === "cash"}
              onClick={() => {
                resetOperation();
                setPaymentMethod("cash");
              }}
              className={`flex items-center gap-3 rounded-xl border p-4 text-right transition-all ${
                paymentMethod === "cash"
                  ? "border-primary bg-primary/5"
                  : "border-[var(--border)] bg-[var(--card)] hover:bg-muted/40"
              }`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  paymentMethod === "cash"
                    ? "border-primary"
                    : "border-muted-foreground/50"
                }`}
              >
                {paymentMethod === "cash" && (
                  <span className="size-2.5 rounded-full bg-primary" />
                )}
              </span>

              <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-semibold text-foreground">
                  نقدی
                </span>
                <span className="text-xs text-muted-foreground">
                  تسویه نقدی سفارش
                </span>
              </div>
            </button>

            {/* پرداخت اعتباری */}
            <button
              type="button"
              aria-pressed={paymentMethod === "credit"}
              onClick={() => {
                resetOperation();
                setPaymentMethod("credit");
              }}
              className={`flex items-center gap-3 rounded-xl border p-4 text-right transition-all ${
                paymentMethod === "credit"
                  ? "border-primary bg-primary/5"
                  : "border-[var(--border)] bg-[var(--card)] hover:bg-muted/40"
              }`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  paymentMethod === "credit"
                    ? "border-primary"
                    : "border-muted-foreground/50"
                }`}
              >
                {paymentMethod === "credit" && (
                  <span className="size-2.5 rounded-full bg-primary" />
                )}
              </span>

              <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-semibold text-foreground">
                  اعتباری
                </span>
                <span className="text-xs text-muted-foreground">
                  با ثبت شرایط پرداخت
                </span>
              </div>
            </button>
          </div>

          {/* توضیحات پرداخت اعتباری */}
          {paymentMethod === "credit" && (
            <label className="mt-4 grid gap-1.5 text-sm font-medium text-[var(--foreground)]">
              <span>توضیحات شرایط پرداخت *</span>

              <Textarea
                value={paymentTerms}
                onChange={(event) => {
                  resetOperation();
                  setPaymentTerms(event.target.value);
                }}
                placeholder="شرایط پرداخت اعتباری را بنویسید"
                className="min-h-[90px] resize-none"
              />

              {creditInvalid && (
                <span className="text-xs text-destructive">
                  توضیحات شرایط پرداخت الزامی است.
                </span>
              )}
            </label>
          )}
        </section>
      </Card>

      <Card className="p-5 lg:sticky lg:top-5">
        <h2 className="font-semibold text-[var(--foreground)]">خلاصه سفارش</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <Summary
            label="مشتری"
            value={
              selectedCustomerLabel ||
              customers.find(
                (customer) => customer.objectId === selectedCustomerId,
              )?.fullName ||
              "-"
            }
          />
          <Summary
            label="انبار"
            value={
              options?.stocks.find(
                (stock) => stock.objectId === selectedStockId,
              )?.title || "-"
            }
          />
          <Summary label="برند" value={selectedBrand || "-"} />
          <Summary
            label="روش پرداخت"
            value={paymentMethod === "cash" ? "نقدی" : "اعتباری"}
          />
          <Summary
            label="تعداد اقلام"
            value={formatNumber(selectedItems.length)}
          />
          <Summary label="مبلغ کل" value={formatCurrency(totalAmount)} />
        </dl>
        {submitted ? (
          <div className="mt-5 rounded-lg border border-[var(--border)] bg-muted/40 p-4 text-sm text-[var(--foreground)]">
            {submitted.status === "completed" ? (
              <div className="space-y-2">
                <p className="font-semibold">
                  سفارش و پیش‌فاکتور سپیدار با موفقیت ثبت شد.
                </p>
                {options?.stocks.find(
                  (stock) => stock.objectId === selectedStockId,
                )?.code === 999 && submitted.orderObjectId ? (
                  <Link
                    className="block text-primary underline"
                    href={`/store-expert/orders/${submitted.orderObjectId}/exit-slip`}
                  >
                    ثبت خروج کالا با کد رهگیری
                  </Link>
                ) : (
                  <p>
                    سفارش در صف خروج انبار قرار گرفت و وضعیت آن توسط انباردار
                    پیگیری می‌شود.
                  </p>
                )}
                {submitted.internalInvoiceObjectId ? (
                  <Link
                    className="block text-primary underline"
                    href={`/accounting/internal-invoices/${submitted.internalInvoiceObjectId}/print`}
                    target="_blank"
                  >
                    دانلود صورتحساب داخلی ماد سنتر
                  </Link>
                ) : null}
              </div>
            ) : (
              <p>
                درخواست ثبت شده و منتظر بررسی نتیجه پیش‌فاکتور سپیدار است. برای
                جلوگیری از ثبت تکراری، دوباره ارسال نکنید.
              </p>
            )}
          </div>
        ) : null}
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!canSubmit || submitting}
            onClick={() => void submit()}
          >
            {submitting ? "در حال ثبت..." : "ثبت نهایی سفارش"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
