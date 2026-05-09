"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, PackageSearch } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import type { Product } from "@/lib/models/product.model";
import { getOrder, updatePendingOrder } from "@/lib/services/order.service";
import { listProducts } from "@/lib/services/product.service";

interface DraftItem {
  rowId: string;
  productId: string;
  quantity: number;
}

export default function EditExpertOrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError("");
      try {
        const [orderData, productsData] = await Promise.all([
          getOrder(params.id),
          listProducts(),
        ]);

        if (!isMounted) return;
        setOrder(orderData);
        setProducts(productsData);
        setCustomerName(orderData.customerName || "");
        setItems(
          orderData.items.map((item, index) => ({
            rowId: `${index}-${item.objectId || item.productId}`,
            productId: item.productId,
            quantity: item.quantity,
          })),
        );
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const normalizedItems = useMemo(
    () =>
      items
        .filter((item) => item.productId && item.quantity > 0)
        .map((item) => ({ productObjectId: item.productId, quantity: item.quantity })),
    [items],
  );

  const productsById = useMemo(
    () =>
      products.reduce<Record<string, Product>>((accumulator, product) => {
        accumulator[product.objectId] = product;
        return accumulator;
      }, {}),
    [products],
  );

  const totalAmount = normalizedItems.reduce((sum, item) => {
    const product = productsById[item.productObjectId ?? ""];
    return sum + item.quantity * (product?.unitPrice ?? 0);
  }, 0);

  const updateRow = (rowId: string, patch: Partial<DraftItem>) => {
    setItems((current) => current.map((item) => (item.rowId === rowId ? { ...item, ...patch } : item)));
  };

  const addRow = () => {
    setItems((current) => [...current, { rowId: `${Date.now()}-${current.length}`, productId: "", quantity: 1 }]);
  };

  const removeRow = (rowId: string) => {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.rowId !== rowId)));
  };

  const handleSubmit = async () => {
    if (!order) return;

    setIsSubmitting(true);
    setError("");
    try {
      await updatePendingOrder(order.objectId, {
        customerName: customerName.trim(),
        items: normalizedItems,
      });
      router.push(`/expert/orders/${order.objectId}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="expert" title="ویرایش سفارش">
      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش" description="اطلاعات سفارش و کالاها از سرور دریافت می شود." />
      ) : error && !order ? (
        <PageErrorMessage title="دریافت سفارش انجام نشد" message={error} />
      ) : !order ? (
        <EmptyState title="سفارش یافت نشد" description="شناسه سفارش معتبر نیست یا رکوردی برای آن وجود ندارد." />
      ) : (
        <>
          <SectionHeader
            title={`ویرایش ${order.code}`}
            description="ویرایش سفارش تا زمانی که در انتظار تأیید باشد انجام می شود."
            actions={<Link href={`/expert/orders/${order.objectId}`} className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155] hover:border-[#CBD5E1]">بازگشت به جزئیات</Link>}
          />

          {error ? <PageErrorMessage title="ثبت تغییرات انجام نشد" message={error} /> : null}

          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>نام مشتری</span>
                <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="نام مشتری یا نمایندگی" />
              </label>

              <h3 className="mt-6 text-base font-semibold text-[#1F3A5F]">آیتم های قابل ویرایش</h3>

              <div className="mt-4 space-y-3">
                {items.map((item, index) => {
                  const product = productsById[item.productId];

                  return (
                    <div key={item.rowId} className="grid gap-2 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 md:grid-cols-[1fr_140px_auto]">
                      <div className="relative">
                        <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                        <SearchableSelect
                          value={item.productId || undefined}
                          onValueChange={(value) => updateRow(item.rowId, { productId: value })}
                          options={products.map((option) => ({ value: option.objectId, label: `${option.name} - ${option.brand}` }))}
                          placeholder="انتخاب کالا"
                          searchPlaceholder="جستجو در کالاها"
                          emptyMessage="کالایی پیدا نشد"
                          triggerClassName="pr-10"
                        />
                      </div>

                      <Input type="number" min={1} value={item.quantity} onChange={(event) => updateRow(item.rowId, { quantity: Number(event.target.value) })} />

                      <Button type="button" onClick={() => removeRow(item.rowId)} variant="outline">حذف</Button>

                      <p className="md:col-span-3 text-xs text-[#6B7280]">
                        {product
                          ? `موجودی قابل استفاده: ${formatNumber(product.availableStock)} ${product.unit} • قیمت واحد: ${formatCurrency(product.unitPrice)} • مبلغ ردیف: ${formatCurrency(item.quantity * product.unitPrice)}`
                          : `آیتم ${formatNumber(index + 1)}`}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6B7280]">مبلغ تقریبی سفارش</span>
                  <span className="font-semibold text-[#102034]">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button type="button" onClick={addRow} variant="outline">افزودن آیتم</Button>
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            </div>

            <OrderSummaryCard
              customerName={customerName}
              itemCount={normalizedItems.length}
              totalQuantity={normalizedItems.reduce((sum, item) => sum + item.quantity, 0)}
              totalAmount={totalAmount}
              status={order.orderStatus}
              warehouseStatus={order.warehouseStatus}
            />
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
