"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { InternalInvoice } from "@/lib/models/internal-invoice.model";
import { getInternalInvoice } from "@/lib/services/internal-invoice.service";
import {
  formatFaCurrency,
  formatFaDigits,
  formatFaNumber,
} from "@/lib/utils/number-format";

export default function InternalInvoicePrintPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InternalInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInvoice() {
      try {
        const data = await getInternalInvoice(params.id);
        if (isMounted) setInvoice(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInvoice();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#E5E7EB] p-4 text-[#102034] print:bg-white print:p-0"
    >
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          .no-print {
            display: none !important;
          }
          .invoice-print-page {
            width: 100% !important;
            min-height: 297mm !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end">
        <Button type="button" onClick={() => window.print()}>
          چاپ فاکتور
        </Button>
      </div>

      <section className="invoice-print-page relative mx-auto min-h-[297mm] w-full max-w-[210mm] overflow-hidden rounded-xl border border-[#D7DEE6] bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/1.jpg"
            alt="سربرگ آساما"
            fill
            priority
            sizes="210mm"
            className="object-cover"
          />
        </div>

        <div className="relative z-10 p-8">
          {isLoading ? (
            <p className="text-sm text-[#6B7280]">در حال دریافت فاکتور...</p>
          ) : error ? (
            <p className="text-sm text-[#B91C1C]">{error}</p>
          ) : !invoice ? (
            <p className="text-sm text-[#6B7280]">فاکتور یافت نشد.</p>
          ) : (
            <InvoiceDocument invoice={invoice} />
          )}
        </div>
      </section>
    </main>
  );
}

function InvoiceDocument({ invoice }: { invoice: InternalInvoice }) {
  return (
    <div className="space-y-5 text-[#102034]">
      {/* <header className="relative min-h-33 pb-4 pt-14">
        <div className="absolute left-0 top-0  border-r-4 border-[#7BC68A] bg-white/95 px-5 py-3 text-right text-sm leading-8 text-[#334155] ">
          <p>
            <span className="text-[#64748B]">شماره فاکتور:</span>{" "}
            <strong>
              {formatFaDigits(invoice.invoiceNumber || invoice.id)}
            </strong>
          </p>
          <p>
            <span className="text-[#64748B]">تاریخ:</span>{" "}
            <strong>
              {formatDateTime(invoice.invoiceDate || invoice.createdAt)}
            </strong>
          </p>
        </div>
      </header> */}
      <header className="relative min-h-33 pb-4 pt-14">
        <div className="absolute left-0 top-0 w-[265px] border-r-2 border-[#7BC68A] bg-white px-4  text-right text-sm leading-8 text-[#334155] ">
          <p>
            شماره فاکتور: {formatFaDigits(invoice.invoiceNumber || invoice.id)}
          </p>
          <p>شماره سفارش: {formatFaDigits(invoice.orderNumber) || "-"}</p>
          <p>
            تاریخ صدور:{" "}
            {formatDateTime(invoice.invoiceDate || invoice.createdAt)}
          </p>
        </div>
      </header>
      <div className="flex justify-center py-2">
        <div className="rounded-xl bg-white px-8 ">
          <h1 className="text-2xl font-bold text-[#102034]">فاکتور داخلی</h1>
        </div>
      </div>

      <section className="rounded-xl border border-[#D7DEE6] bg-white/95 p-4">
        <div className="mb-3 flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <h2 className="text-base font-bold">اطلاعات سفارش</h2>
        </div>
        <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <InlineInfo
            label="شماره حواله خروج"
            value={formatFaDigits(invoice.exitSlipNumber) || "-"}
          />
          <InlineInfo label="مشتری" value={invoice.customerName || "-"} />

          <InlineInfo
            label="موبایل/تلفن"
            value={
              formatFaDigits(invoice.customerMobile || invoice.customerPhone) ||
              "-"
            }
          />
          <InlineInfo label="انبار خروج" value={invoice.stockTitle || "-"} />
          <div className="sm:col-span-2">
            <InlineInfo
              label="آدرس مشتری"
              value={invoice.customerAddress || "-"}
            />
          </div>
        </div>
      </section>

      {hasRecipientInfo(invoice) ? (
        <section className="rounded-xl border border-[#D7DEE6] bg-white/95 p-4">
          <h2 className="mb-3 border-b border-[#E5E7EB] pb-2 text-base font-bold">
            اطلاعات مشتری
          </h2>
          <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <InlineInfo
              label="نام و نام خانوادگی"
              value={
                [invoice.recipientFirstName, invoice.recipientLastName]
                  .filter(Boolean)
                  .join(" ") || "-"
              }
            />
            <InlineInfo
              label="کد ملی"
              value={formatFaDigits(invoice.recipientNationalId) || "-"}
            />
            <InlineInfo
              label="موبایل"
              value={formatFaDigits(invoice.recipientMobile) || "-"}
            />
            <InlineInfo
              label="شماره سفارش ناجا"
              value={formatFaDigits(invoice.najaOrderNumber) || "-"}
            />
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-[#D7DEE6] bg-white">
        <table className="w-full border-collapse text-right text-xs">
          <thead>
            <tr className="bg-[#F1F5F9] text-[#334155]">
              {[
                "ردیف",
                "کد کالا",
                "نام کالا",
                "تعداد",
                "قیمت واحد",
                "مبلغ کل",
                "سریال / رهگیری / شناسه",
              ].map((header) => (
                <th
                  key={header}
                  className="border-b border-[#D7DEE6] px-2 py-2 font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr
                key={item.objectId || `${item.productObjectId}-${index}`}
                className="odd:bg-white even:bg-[#F8FAFC]"
              >
                <Cell>{formatFaNumber(item.rowNumber || index + 1)}</Cell>
                <Cell>{formatFaDigits(item.productCode) || "-"}</Cell>
                <Cell>{item.productName || "-"}</Cell>
                <Cell>{formatFaNumber(item.quantity)}</Cell>
                <Cell>{formatFaCurrency(item.unitPrice)}</Cell>
                <Cell>{formatFaCurrency(item.lineTotal)}</Cell>
                <Cell>{formatUnitCodes(item)}</Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mr-auto w-full max-w-[420px] overflow-hidden rounded-xl border border-[#D7DEE6] bg-white/95 text-sm">
        <Total label="مبلغ ناخالص" value={invoice.grossAmount} />
        <Total label="تخفیف" value={invoice.discount} />
        <Total label="مالیات" value={invoice.tax} />
        <Total label="عوارض" value={invoice.duty} />
        <Total label="اضافات" value={invoice.addition} />
        <Total label="مبلغ نهایی" value={invoice.netAmount} emphasis />
      </section>
    </div>
  );
}

function InlineInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 leading-7">
      <span className="shrink-0 text-[#64748B]">{label}:</span>
      <strong className="font-semibold text-[#102034]">{value}</strong>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <td className="border-b border-[#E5E7EB] px-2 py-2 align-top">
      {children}
    </td>
  );
}

function Total({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex justify-between border-b border-[#E5E7EB] px-4 py-2 last:border-b-0 ${
        emphasis ? "bg-[#1F3A5F] text-white" : "bg-white"
      }`}
    >
      <span>{label}</span>
      <strong>{formatFaCurrency(value)}</strong>
    </div>
  );
}

function formatUnitCodes(item: InternalInvoice["items"][number]): string {
  const values = [
    ...item.serialNumbers.map((value) => `سریال: ${formatFaDigits(value)}`),
    ...item.trackingCodes.map((value) => `رهگیری: ${formatFaDigits(value)}`),
    ...item.productIdentifiers.map(
      (value) => `شناسه: ${formatFaDigits(value)}`,
    ),
  ];
  return values.join("، ") || "-";
}

function hasRecipientInfo(invoice: InternalInvoice): boolean {
  return Boolean(
    invoice.recipientFirstName ||
    invoice.recipientLastName ||
    invoice.recipientNationalId ||
    invoice.recipientMobile ||
    invoice.najaOrderNumber,
  );
}
