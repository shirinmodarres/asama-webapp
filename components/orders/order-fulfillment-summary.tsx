"use client";

import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import type {
  FulfillmentInvoice,
  FulfillmentProduct,
  OrderFulfillment,
} from "@/lib/models/order-fulfillment.model";
import { getOrderFulfillment } from "@/lib/services/order.service";
import { formatJalaliDate } from "@/lib/utils/date-format";
import { formatFaCurrency, formatFaDigits, formatFaNumber } from "@/lib/utils/number-format";

const title = "خلاصه تکمیل سفارش";
const unavailable = "نامشخص";
const amount = (value: number | null) => value === null ? unavailable : formatFaCurrency(value);
const percent = new Intl.NumberFormat("fa-IR", { style: "percent", maximumFractionDigits: 1 });

const invoiceSources: Record<FulfillmentInvoice["source"], string> = {
  Invoice: "فاکتور فروش",
  InternalInvoice: "فاکتور داخلی",
  ModCenterInvoice: "پیش‌فاکتور مادسنتر",
  Sepidar: "فاکتور سپیدار",
};

const invoiceColumns: DataTableColumn<FulfillmentInvoice>[] = [
  {
    key: "number",
    header: "شماره",
    render: (row) => (
      <>
        <bdi>{formatFaDigits(row.number) || "—"}</bdi>
        {row.sepidarNumber != null && (
          <div className="text-xs text-muted-foreground">سپیدار {formatFaDigits(row.sepidarNumber)}</div>
        )}
      </>
    ),
  },
  { key: "source", header: "نوع سند", render: (row) => invoiceSources[row.source] },
  { key: "date", header: "تاریخ", render: (row) => formatJalaliDate(row.date, "—") },
  { key: "status", header: "وضعیت", render: (row) => row.statusLabel || "—" },
  { key: "amount", header: "مبلغ", render: (row) => amount(row.amount) },
];

const productColumns: DataTableColumn<FulfillmentProduct>[] = [
  {
    key: "product",
    header: "کالا",
    render: (row) => (
      <>
        <div>{row.productName || "—"}</div>
        {row.productSku && <bdi className="text-xs text-muted-foreground">{formatFaDigits(row.productSku)}</bdi>}
      </>
    ),
  },
  { key: "ordered", header: "سفارش‌شده", render: (row) => formatFaNumber(row.orderedQuantity) },
  { key: "dispatched", header: "خارج‌شده", render: (row) => formatFaNumber(row.dispatchedQuantity) },
  { key: "delivered", header: "تحویل تأییدشده", render: (row) => formatFaNumber(row.deliveredQuantity) },
  { key: "fulfilled", header: "تأمین‌شده", render: (row) => formatFaNumber(row.fulfilledQuantity) },
  { key: "remaining", header: "باقی‌مانده برای خروج", render: (row) => formatFaNumber(row.remainingQuantity) },
];

type SummaryResult = { data: OrderFulfillment } | { error: true };

export function OrderFulfillmentSummary({ orderId, revision }: { orderId: string; revision?: string | null }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    orderId: string;
    revision?: string | null;
    attempt: number;
    value: SummaryResult;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const settle = (value: SummaryResult) => {
      if (!controller.signal.aborted) setResult({ orderId, revision, attempt, value });
    };
    getOrderFulfillment(orderId, controller.signal)
      .then((data) => settle({ data }))
      .catch(() => settle({ error: true }));
    return () => controller.abort();
  }, [orderId, revision, attempt]);

  const current = result?.orderId === orderId && result.revision === revision && result.attempt === attempt
    ? result.value : null;

  return (
    <section dir="rtl" className="min-w-0">
      <SectionCard title={title}>
        {!current ? (
          <LoadingState title="در حال دریافت خلاصه تکمیل سفارش" />
        ) : "error" in current ? (
          <div className="space-y-3" role="alert">
            <InlineErrorMessage message="دریافت خلاصه تکمیل سفارش انجام نشد." />
            <Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)}>
              تلاش دوباره
            </Button>
          </div>
        ) : (
          <SummaryContent summary={current.data} />
        )}
      </SectionCard>
    </section>
  );
}

function SummaryContent({ summary }: { summary: OrderFulfillment }) {
  const metrics = [
    ["مبلغ کل سفارش", amount(summary.orderTotal)],
    ["جمع مبلغ فاکتورها", amount(summary.invoicedTotal)],
    ["مبلغ فاکتورنشده", amount(summary.remainingUninvoicedAmount)],
    ["درصد تأمین بر اساس خروج", percent.format(summary.fulfillmentPercentage / 100)],
    ["تعداد باقی‌مانده برای خروج", formatFaNumber(summary.remainingQuantity)],
  ];

  return (
    <div className="space-y-5">
      <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[var(--border)] bg-white p-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-2 text-base font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {summary.orderClosed && (
        <p className="text-sm text-muted-foreground">وضعیت سفارش {summary.orderStatusLabel}</p>
      )}
      <div className="space-y-2">
        <h3 className="font-semibold">وضعیت اقلام</h3>
        {summary.products.length ? (
          <DataTable columns={productColumns} rows={summary.products} rowKey={(row) => row.key} />
        ) : (
          <p className="text-sm text-muted-foreground">قلمی برای این سفارش ثبت نشده است.</p>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">فاکتورها و پیش‌فاکتور فروشگاه</h3>
        {summary.invoices.length ? (
          <DataTable columns={invoiceColumns} rows={summary.invoices} rowKey={(row) => row.id} />
        ) : (
          <p className="text-sm text-muted-foreground">هیچ فاکتوری برای این سفارش ثبت نشده است.</p>
        )}
        {summary.invoicedTotal === null && (
          <p className="text-sm text-muted-foreground">
            اطلاعات مبلغ یا ارتباط سندها برای محاسبه جمع قطعی فاکتورها کافی نیست.
          </p>
        )}
      </div>
    </div>
  );
}
