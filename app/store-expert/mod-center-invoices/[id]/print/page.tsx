"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PdfPage, PDF_PAGE_STYLES } from "@/components/pdf/pdf-shell";
import { chunkRowsByPage } from "@/components/pdf/pdf-pagination";
import type { InternalInvoice } from "@/lib/models/internal-invoice.model";
import { getModCenterInvoice } from "@/lib/services/store-expert-order.service";
import { formatDateTime } from "@/lib/expert/utils";
import { formatFaCurrency, formatFaDigits } from "@/lib/utils/number-format";
import { getErrorMessage } from "@/lib/api/api-error";

export default function ModCenterInvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InternalInvoice | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void getModCenterInvoice(id).then(setInvoice).catch((reason) => setError(getErrorMessage(reason)));
  }, [id]);
  const pages = useMemo(() => chunkRowsByPage(invoice?.items || [], { firstPageRows: 10, nextPageRows: 12 }), [invoice?.items]);
  return <main dir="rtl" className="min-h-screen bg-[#E5E7EB] p-4 text-[#102034] print:bg-white print:p-0">
    <style jsx global>{PDF_PAGE_STYLES}</style>
    <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end"><Button onClick={() => window.print()}>چاپ فاکتور</Button></div>
    {error ? <PdfPage imageSrc="/1.jpg" imageAlt="سربرگ آساما"><p className="text-destructive">{error}</p></PdfPage> : !invoice ? <PdfPage imageSrc="/1.jpg" imageAlt="سربرگ آساما"><p>در حال دریافت فاکتور...</p></PdfPage> : pages.map((rows, pageIndex) => <PdfPage key={pageIndex} imageSrc="/1.jpg" imageAlt="سربرگ آساما" pageBreakAfter={pageIndex < pages.length - 1}>
      <section className="space-y-5 text-sm">
        <header className="flex items-start justify-between gap-4 pt-4"><div><h1 className="text-2xl font-bold">فاکتور مادسنتر</h1><p className="mt-2">شماره فاکتور: {formatFaDigits(invoice.invoiceNumber)}</p><p>تاریخ: {formatDateTime(invoice.invoiceDate)}</p></div><div className="text-left"><p>مشتری: {invoice.customerName || "-"}</p><p>کد مشتری: {formatFaDigits(invoice.customerCode || "-")}</p><p>تلفن: {formatFaDigits(invoice.customerMobile || invoice.customerPhone || "-")}</p></div></header>
        <table className="w-full border-collapse text-right"><thead><tr className="bg-slate-100"><th className="border p-2">ردیف</th><th className="border p-2">کد کالا</th><th className="border p-2">نام کالا</th><th className="border p-2">تعداد</th><th className="border p-2">قیمت واحد</th><th className="border p-2">مبلغ</th></tr></thead><tbody>{rows.map((item) => <tr key={item.rowNumber}><td className="border p-2">{formatFaDigits(item.rowNumber)}</td><td className="border p-2">{formatFaDigits(item.productCode || "-")}</td><td className="border p-2">{item.productName}</td><td className="border p-2">{formatFaDigits(item.quantity)}</td><td className="border p-2">{formatFaCurrency(item.unitPrice)}</td><td className="border p-2">{formatFaCurrency(item.lineTotal)}</td></tr>)}</tbody></table>
        {pageIndex === pages.length - 1 ? <div className="mr-auto grid max-w-sm gap-2"><Row label="جمع کالاها" value={invoice.grossAmount} /><Row label={`تخفیف (${formatFaDigits(invoice.discountPercentage ?? ((invoice.grossAmount ? invoice.discount / invoice.grossAmount : 0) * 100).toFixed(2))}٪)`} value={invoice.discount} /><Row label="مبلغ مشمول مالیات" value={Math.max(invoice.grossAmount - invoice.discount, 0)} /><Row label="مالیات بر ارزش افزوده" value={invoice.tax} /><Row label="مبلغ نهایی" value={invoice.netAmount} strong /></div> : null}
      </section>
    </PdfPage>)}</main>;
}

function Row({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={strong ? "flex justify-between border-t pt-2 font-bold" : "flex justify-between"}><span>{label}</span><span>{formatFaCurrency(value)}</span></div>;
}
