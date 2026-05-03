"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  formatCurrency,
  formatNumber,
  getOrderItemCount,
  getOrderLineTotal,
  getOrderTotalQuantity,
} from "@/lib/expert/utils";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Product } from "@/lib/models/product.model";
import { rolesByKey } from "@/lib/mock-data";
import { createOrder } from "@/lib/services/order.service";
import { listProducts } from "@/lib/services/product.service";
import { ChevronLeft, PackageSearch, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface DraftItem {
  rowId: string;
  productId: string;
  quantity: number;
}

export default function NewExpertOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([
    { rowId: "1", productId: "", quantity: 1 },
  ]);
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoadingProducts(true);
      setError("");

      try {
        const data = await listProducts();
        if (isMounted) setProducts(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedItems = useMemo(
    () =>
      items
        .filter((item) => item.productId && item.quantity > 0)
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
    [items],
  );

  const totalItems = getOrderItemCount(normalizedItems);
  const totalQuantity = getOrderTotalQuantity(normalizedItems);
  const productsById = useMemo(
    () =>
      products.reduce<Record<string, (typeof products)[number]>>(
        (accumulator, product) => {
          accumulator[product.objectId] = product;
          return accumulator;
        },
        {},
      ),
    [products],
  );
  const totalAmount = normalizedItems.reduce((sum, item) => {
    const product = productsById[item.productId];
    return sum + item.quantity * (product?.unitPrice ?? 0);
  }, 0);

  const addRow = () => {
    setItems((current) => [
      ...current,
      { rowId: `${Date.now()}-${current.length}`, productId: "", quantity: 1 },
    ]);
  };

  const removeRow = (rowId: string) => {
    setItems((current) => {
      if (current.length === 1) return current;
      return current.filter((item) => item.rowId !== rowId);
    });
  };

  const updateRow = (rowId: string, patch: Partial<DraftItem>) => {
    setItems((current) =>
      current.map((item) =>
        item.rowId === rowId ? { ...item, ...patch } : item,
      ),
    );
  };

  const handleSubmit = async () => {
    setError("");

    if (normalizedItems.length === 0) {
      setError("حداقل یک آیتم معتبر به سفارش اضافه کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        createdByName: rolesByKey.expert.userName,
        customerName: customerName.trim(),
        items: normalizedItems.map((item) => ({
          productObjectId: item.productId,
          quantity: item.quantity,
        })),
      });
      router.push(`/expert/orders/${order.objectId}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="expert" title="ثبت سفارش جدید">
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>نام مشتری</span>
            <Input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="نام مشتری یا نمایندگی را وارد کنید"
            />
          </label>

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[#102034]">
                آیتم های سفارش
              </h3>
              <p className="mt-1 text-sm leading-7 text-[#6B7280]">
                کالاهای مورد نیاز را انتخاب کنید و تعداد هر ردیف را برای ثبت
                نهایی سفارش مشخص کنید.
              </p>
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="mt-5">
              <LoadingState
                title="در حال دریافت کالاها"
                description="فهرست کالاها از سرور دریافت می شود."
              />
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {items.map((item, index) => {
              const product = products.find(
                (entry) => entry.objectId === item.productId,
              );

              return (
                <div
                  key={item.rowId}
                  className="grid gap-3 border-b border-[#E7EDF3] py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_88px_190px_auto] md:items-center"
                >
                  <div className="relative">
                    <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                    <SearchableSelect
                      value={item.productId || undefined}
                      onValueChange={(value) =>
                        updateRow(item.rowId, { productId: value })
                      }
                      options={products.map((option) => ({
                        value: option.objectId,
                        label: `${option.name} - ${option.brand}`,
                      }))}
                      placeholder="انتخاب کالا"
                      searchPlaceholder="جستجو در کالاها"
                      emptyMessage="کالایی پیدا نشد"
                      triggerClassName="pr-10"
                    />
                  </div>

                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) =>
                      updateRow(item.rowId, {
                        quantity: Number(event.target.value),
                      })
                    }
                    className="px-2.5 text-center"
                  />

                  <div className="flex h-11 items-center justify-between gap-3 rounded-[14px] border border-[#E7EDF3] bg-[#FBFCFD] px-3.5 text-sm">
                    <span className="text-xs font-medium text-[#6B7280]">
                      مبلغ ردیف
                    </span>
                    <span className="text-sm font-semibold text-[#102034]">
                      {product
                        ? formatCurrency(
                            getOrderLineTotal(item.quantity, product.unitPrice),
                          )
                        : "-"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={() => removeRow(item.rowId)}
                    variant="outline"
                    size="icon"
                    aria-label="حذف آیتم"
                  >
                    <Trash2 className="size-4" />
                  </Button>

                  <p className="text-xs text-[#6B7280] md:col-span-4">
                    {product
                      ? `موجودی قابل استفاده: ${formatNumber(product.availableStock)} ${product.unit} • قیمت واحد: ${formatCurrency(product.unitPrice)}`
                      : `آیتم ${formatNumber(index + 1)}`}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#6B7280]">مبلغ تقریبی سفارش</span>
              <span className="font-semibold text-[#102034]">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={addRow}>
              افزودن آیتم
            </Button>

            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              ثبت سفارش
              <ChevronLeft className="size-4" />
            </Button>
          </div>

          {error ? (
            <div className="mt-4">
              <InlineErrorMessage message={error} />
            </div>
          ) : null}
        </Card>

        <OrderSummaryCard
          customerName={customerName || "ثبت نشده"}
          itemCount={totalItems}
          totalQuantity={totalQuantity}
          totalAmount={totalAmount}
          status="pending"
          warehouseStatus="reserved"
        />
      </section>
    </DashboardLayout>
  );
}
