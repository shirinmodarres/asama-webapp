"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PDF_PAGE_STYLES } from "@/components/pdf/pdf-shell";
import { ExitSlipPdfDocument, type SlipInfoField, type SlipInfoSection, type SlipSummaryRow } from "@/components/warehouse/exit-slip-pdf-document";
import type { InternalInvoice } from "@/lib/models/internal-invoice.model";
import { getModCenterInvoice } from "@/lib/services/store-expert-order.service";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import { formatFaCurrency, formatFaDigits } from "@/lib/utils/number-format";

export default function ModCenterInvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InternalInvoice | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void getModCenterInvoice(id).then(setInvoice).catch((reason) => setError(getErrorMessage(reason))); }, [id]);
  return <main dir="rtl" className="min-h-screen bg-[#E5E7EB] p-4 text-[#102034] print:bg-white print:p-0">
    <style jsx global>{PDF_PAGE_STYLES}</style>
    <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end"><Button onClick={() => window.print()}>چاپ / ذخیره PDF</Button></div>
    {error ? <p className="text-sm text-[#B91C1C]">{error}</p> : !invoice ? <p className="text-sm text-[#6B7280]">در حال دریافت فاکتور...</p> : <ExitSlipPdfDocument {...documentFor(invoice)} />}
  </main>;
}

function documentFor(invoice: InternalInvoice) {
  const discountPercentage = invoice.discountPercentage ?? (invoice.grossAmount ? (invoice.discount / invoice.grossAmount) * 100 : 0);
  const headerFields: SlipInfoField[] = [
    { label: "شماره فاکتور", value: formatFaDigits(invoice.invoiceNumber) },
    { label: "تاریخ", value: formatDateTime(invoice.invoiceDate) },
    { label: "شماره سفارش", value: formatFaDigits(invoice.orderNumber || "-") },
  ];
  const informationSections: SlipInfoSection[] = [{ title: "اطلاعات مشتری", fields: [
    { label: "مشتری", value: invoice.customerName || "-" },
    { label: "کد مشتری", value: formatFaDigits(invoice.customerCode || "-") },
    { label: "تلفن", value: formatFaDigits(invoice.customerMobile || invoice.customerPhone || "-") },
  ] }];
  const summaryRows: SlipSummaryRow[] = invoice.items.map((item) => ({
    key: item.objectId || String(item.rowNumber),
    productName: `${item.productName}${item.productCode ? ` - ${formatFaDigits(item.productCode)}` : ""}`,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }));
  return {
    title: "فاکتور مادسنتر",
    headerFields,
    informationSections,
    summaryRows,
    detailRows: [],
    showAmounts: true,
    summaryTitle: "اقلام فاکتور",
    noteFields: [
      { label: "جمع کالاها", value: formatFaCurrency(invoice.grossAmount) },
      { label: `تخفیف (${formatFaDigits(discountPercentage)}٪)`, value: formatFaCurrency(invoice.discount) },
      { label: "مبلغ مشمول مالیات", value: formatFaCurrency(Math.max(invoice.grossAmount - invoice.discount, 0)) },
      { label: "مالیات بر ارزش افزوده", value: formatFaCurrency(invoice.tax) },
      { label: "مبلغ نهایی", value: formatFaCurrency(invoice.netAmount) },
    ],
    signatureLabels: ["امضای فروشنده", "امضای خریدار"] as [string, string],
  };
}
