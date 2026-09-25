"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import type { SalesQuotation } from "@/lib/models/sales-quotation.model";
import { getSalesQuotationPdfData } from "@/lib/services/sales-quotation.service";
import { PDF_PAGE_STYLES, PdfPage } from "@/components/pdf/pdf-shell";
import { chunkRowsByPage } from "@/components/pdf/pdf-pagination";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function SalesQuotationPdfPage() {
  const params = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<SalesQuotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadQuotation() {
      setIsLoading(true);
      setError("");
      try {
        const result = await getSalesQuotationPdfData(params.id);
        if (isMounted) {
          setQuotation(result);
          document.title = `درخواست فروش - ${result.customerName || "بدون مشتری"}`;
          if (
            new URLSearchParams(window.location.search).get("print") === "1"
          ) {
            window.setTimeout(() => window.print(), 250);
          }
        }
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadQuotation();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const itemRows = useMemo(
    () =>
      quotation?.items.map((item, index) => ({
        key: item.rowNumber || `${item.productObjectId}-${index}`,
        rowNumber: item.rowNumber || index + 1,
        sku: item.productSku || "-",
        name: item.productName || "-",
        qty: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })) ?? [],
    [quotation],
  );
  const itemPages = useMemo(
    () =>
      chunkRowsByPage(itemRows, {
        firstPageRows: 12,
        nextPageRows: 12,
      }),
    [itemRows],
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#E5E7EB] p-4 text-[#102034] print:bg-white print:p-0"
    >
      <style jsx global>{PDF_PAGE_STYLES}</style>

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end">
        <Button type="button" onClick={() => window.print()}>
          چاپ / ذخیره PDF
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <PdfPage>
            <div className="space-y-3 text-sm text-[#6B7280]">
              در حال دریافت درخواست فروش...
            </div>
          </PdfPage>
        ) : error ? (
          <PdfPage>
            <div className="space-y-3 text-sm text-[#B91C1C]">{error}</div>
          </PdfPage>
        ) : !quotation ? (
          <PdfPage>
            <div className="space-y-3 text-sm text-[#6B7280]">درخواست فروش یافت نشد.</div>
          </PdfPage>
        ) : (
          <>
            {itemPages.map((pageRows, pageIndex) => {
              const isFirstPage = pageIndex === 0;
              const isLastPage = pageIndex === itemPages.length - 1;
              return (
                <PdfPage
                  key={`quotation-page-${pageIndex}`}
                  pageBreakAfter={!isLastPage}
                >
                  <div className="space-y-2.5 text-[10px] leading-5">
                    <header className="relative flex min-h-28 justify-between">
                      <div className="absolute left-0 top-[-6mm] border-r-2 border-[#7BC68A] bg-white/95 px-2.5 py-1 text-[9px] leading-5 text-[#334155]">
                        <InlineInfo
                          label="شماره درخواست فروش"
                          value={formatFaDigits(quotation.quotationNumber) || "-"}
                        />
                        <InlineInfo
                          label="تاریخ صدور"
                          value={
                            quotation.createdAt
                              ? formatQuotationDate(quotation.createdAt)
                              : "-"
                          }
                        />
                        <InlineInfo
                          label="تاریخ اعتبار"
                          value={
                            quotation.validUntil
                              ? formatQuotationDate(quotation.validUntil)
                              : "-"
                          }
                        />
                      </div>
                    </header>

                    <div className="flex justify-center">
                      <div className="bg-white/95 px-6 py-0.5">
                        <h1 className="text-lg font-bold text-[#102034]">
                          درخواست فروش
                        </h1>
                      </div>
                    </div>

                    {isFirstPage ? (
                      <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
                        <h2 className="mb-1.5 border-b border-[#E2E8F0] pb-1 text-[11px] font-bold text-[#1F3A5F]">
                          اطلاعات مشتری
                        </h2>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          <InlineInfo label="نام مشتری" value={quotation.customerName || "-"} />
                          <InlineInfo
                            label="کد مشتری"
                            value={
                              quotation.customer?.sepidarCustomerCode
                                ? formatFaDigits(quotation.customer.sepidarCustomerCode)
                                : "-"
                            }
                          />
                          <InlineInfo
                            label="آدرس"
                            value={resolveQuotationAddress(quotation)}
                            className="col-span-2"
                          />
                        </dl>
                      </section>
                    ) : null}

                    <section className="print-section overflow-hidden rounded-md border border-[#CBD5E1] bg-white/95">
                      <table className="items-table w-full border-collapse text-right text-[9px]">
                        <thead>
                          <tr className="bg-[#F1F5F9] text-[#334155]">
                            <th className="w-10 border-b border-l border-[#D7DEE6] px-0.5 py-2 text-center font-semibold last:border-l-0">
                              ردیف
                            </th>
                            <th className="w-18 border-b border-l border-[#D7DEE6] px-1 py-2 font-semibold last:border-l-0">
                              کد کالا
                            </th>
                            <th className="border-b border-l border-[#D7DEE6] px-2 py-2 font-semibold last:border-l-0">
                              نام کالا
                            </th>
                            <th className="w-10 border-b border-l border-[#D7DEE6] px-0.5 py-2 text-center font-semibold last:border-l-0">
                              تعداد
                            </th>
                            <th className="w-9 border-b border-l border-[#D7DEE6] px-0.5 py-2 text-center font-semibold last:border-l-0">
                              واحد
                            </th>
                            <th className="w-24 border-b border-l border-[#D7DEE6] px-1.5 py-2 font-semibold last:border-l-0">
                              فی
                            </th>
                            <th className="w-28 border-b border-l border-[#D7DEE6] px-1.5 py-2 font-semibold last:border-l-0">
                              مبلغ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageRows.map((row) => (
                            <tr
                              key={row.key}
                              className="print-table-row odd:bg-white even:bg-[#F8FAFC]"
                            >
                              <Cell className="px-1 text-center">{formatNumber(row.rowNumber)}</Cell>
                              <Cell>{formatFaDigits(row.sku) || "-"}</Cell>
                              <Cell>{row.name}</Cell>
                              <Cell className="px-1 text-center">{formatNumber(row.qty)}</Cell>
                              <Cell className="px-1 text-center">عدد</Cell>
                              <Cell>{formatCurrency(row.unitPrice)}</Cell>
                              <Cell>{formatCurrency(row.lineTotal)}</Cell>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>

                    {isLastPage ? (
                      <>
                        <section className="mr-auto w-full max-w-[260px] overflow-hidden rounded-md border border-[#CBD5E1] bg-white/95 text-[11px]">
                          <Total label="جمع مبلغ اقلام" value={quotation.subtotal} />
                          <Total label="مجموع کسورات" value={quotation.deductionTotal} />
                          <Total label="مجموع اضافات" value={quotation.additionTotal} />
                          <Total label="مبلغ نهایی درخواست" value={quotation.finalTotal} emphasis />
                        </section>

                        <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
                          <h2 className="mb-1.5 border-b border-[#E2E8F0] pb-1 text-[11px] font-bold text-[#1F3A5F]">
                            توضیحات و شرایط
                          </h2>
                          <p className="whitespace-pre-wrap text-[9px] leading-5 text-[#334155]">
                            {quotation.notes || "-"}
                          </p>
                          <p className="mt-2 text-[9px] font-bold leading-5 text-[#334155]">
                            این درخواست فروش تا تاریخ{" "}
                            {quotation.validUntil
                              ? formatQuotationDate(quotation.validUntil)
                              : "-"}{" "}
                            معتبر بوده و پس از آن نیازمند استعلام مجدد قیمت می‌باشد.
                          </p>
                        </section>

                        <footer className="grid grid-cols-3 gap-3 pt-5">
                          <Signature label="تنظیم کننده" />
                          <Signature label="تأیید فروش" />
                          <Signature label="مهر و امضاء مشتری" />
                        </footer>
                      </>
                    ) : null}
                  </div>
                </PdfPage>
              );
            })}
          </>
        )}
      </div>
    </main>
  );
}

function InlineInfo({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 leading-5 ${className ?? ""}`}>
      <span className="shrink-0 text-[#64748B]">{label}:</span>
      <strong className="font-semibold text-[#102034]">{value}</strong>
    </div>
  );
}

function Cell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-l border-[#E5E7EB] px-2 py-2 align-top last:border-l-0 ${className}`}
    >
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
  value: number | string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 border-b border-[#E5E7EB] px-3 py-2 last:border-b-0 ${
        emphasis ? "bg-[#F8FAFC] font-bold text-[#102034]" : ""
      }`}
    >
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="pt-6">
      <div className="border-t border-[#94A3B8] pt-1.5 text-center text-[9px] font-semibold text-[#1F3A5F]">
        {label}
      </div>
    </div>
  );
}

function resolveQuotationAddress(quotation: SalesQuotation): string {
  const customer = quotation.customer;
  if (!customer) return "-";
  const addresses = Array.isArray(customer.sepidarAddresses)
    ? customer.sepidarAddresses
    : [];
  const selected =
    addresses.find((item) => item?.isMain) ||
    customer.sepidarAddress ||
    addresses[0];
  return (
    selected?.Address ||
    selected?.address ||
    selected?.fullAddress ||
    customer.sepidarAddress?.Address ||
    customer.sepidarAddress?.address ||
    customer.addresses?.[0]?.Address ||
    customer.addresses?.[0]?.address ||
    customer.defaultAddress?.Address ||
    customer.defaultAddress?.address ||
    customer.sepidarAddress?.Address ||
    customer.sepidarAddress?.address ||
    "-"
  );
}

function formatQuotationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
