"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PDF_PAGE_STYLES } from "@/components/pdf/pdf-shell";
import { Button } from "@/components/ui/button";
import {
  ExitSlipPdfDocument,
  type SlipDetailRow,
  type SlipInfoSection,
  type SlipSummaryRow,
} from "@/components/warehouse/exit-slip-pdf-document";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { ExitSlipPdfData } from "@/lib/models/warehouse.model";
import { getExitSlipPdfData } from "@/lib/services/warehouse.service";
import {
  resolveExitSlipPdfCustomer,
  resolveExitSlipPdfRecipient,
} from "@/lib/utils/exit-slip-customer";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ExitSlipPdfPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ExitSlipPdfData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadPdfData() {
      setIsLoading(true);
      setError("");
      try {
        const result = await getExitSlipPdfData(params.id);
        if (!isMounted) return;
        setData(result);
        document.title = `حواله خروج - ${result.customer?.name || "بدون مشتری"}`;
        if (new URLSearchParams(window.location.search).get("print") === "1") {
          window.setTimeout(async () => {
            await waitForPrintableAssets();
            if (isMounted) window.print();
          }, 250);
        }
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadPdfData();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const documentData = data ? buildExitSlipDocumentData(data) : null;

  return (
    <main dir="rtl" className="min-h-screen bg-[#E5E7EB] p-4 text-[#102034] print:bg-white print:p-0">
      <style jsx global>{PDF_PAGE_STYLES}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end">
        <Button type="button" onClick={() => window.print()}>
          چاپ / ذخیره PDF
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-[#6B7280]">در حال دریافت اطلاعات حواله...</p>
      ) : error ? (
        <p className="text-sm text-[#B91C1C]">{error}</p>
      ) : !documentData ? (
        <p className="text-sm text-[#6B7280]">اطلاعات حواله یافت نشد.</p>
      ) : (
        <ExitSlipPdfDocument
          title="حواله خروج کالا"
          headerFields={documentData.headerFields}
          informationSections={documentData.informationSections}
          summaryRows={documentData.summaryRows}
          detailRows={documentData.detailRows}
          noteFields={documentData.noteFields}
          signatureLabels={["امضای انباردار", "امضای تحویل‌گیرنده"]}
        />
      )}
    </main>
  );
}

function buildExitSlipDocumentData(data: ExitSlipPdfData) {
  const customer = resolveExitSlipPdfCustomer(data);
  const recipient = resolveExitSlipPdfRecipient(data);
  const hasRecipientName = Boolean(
    recipient.fullName?.trim() ||
      data.receiver.fullName?.trim() ||
      data.recipient.firstName?.trim() ||
      data.recipient.lastName?.trim(),
  );
  const informationSections: SlipInfoSection[] = [
    {
      title: "اطلاعات مرکز / مشتری سپیدار",
      fields: [
        { label: "نام مشتری/مرکز", value: customer.name || "-" },
        { label: "کد دریافت", value: customer.sepidarCustomerCode ? formatFaDigits(customer.sepidarCustomerCode) : "-" },
        { label: "موبایل/تلفن", value: customer.phone ? formatFaDigits(customer.phone) : "-" },
        { label: "آدرس", value: customer.address || "-", className: "col-span-2" },
      ],
    },
  ];

  if (hasRecipientName) {
    informationSections.push({
      title: "اطلاعات تحویل‌گیرنده ناجا",
      fields: [
        { label: "نام و نام خانوادگی", value: recipient.fullName || "-" },
        { label: "کد ملی", value: recipient.nationalId ? formatFaDigits(recipient.nationalId) : "-" },
        { label: "موبایل", value: recipient.mobile ? formatFaDigits(recipient.mobile) : "-" },
        { label: "شماره سفارش ناجا", value: recipient.najaOrderNumber ? formatFaDigits(recipient.najaOrderNumber) : "-" },
      ],
    });
  } else if (hasText(data.receiver.fullName)) {
    informationSections.push({
      title: "اطلاعات تحویل",
      fields: [
        { label: "گیرنده بار", value: data.receiver.fullName || "-" },
        { label: "موبایل گیرنده", value: data.receiver.phone ? formatFaDigits(data.receiver.phone) : "-" },
        {
          label: "آدرس تحویل",
          value: data.deliveryAddress.formatted || data.deliveryAddress.fullAddress || "-",
          className: "col-span-2",
        },
      ],
    });
  }

  const summaryRows: SlipSummaryRow[] = data.items.map((item, index) => ({
    key: item.productObjectId || item.productSku || `${item.productName}-${index}`,
    productName: item.productName,
    quantity: item.quantity,
  }));
  const detailRows: SlipDetailRow[] = data.items.flatMap((item) =>
    item.units.length
      ? item.units.map((unit, index) => ({
          key: unit.unitObjectId || `${item.productObjectId || item.productSku}-${index}`,
          productName: item.productName,
          productSku: item.productSku,
          productIdentifier: unit.productIdentifier,
          serialNumber: unit.serialNumber,
          trackingCode: unit.trackingCode,
        }))
      : [{
          key: item.productObjectId || item.productSku || item.productName,
          productName: item.productName,
          productSku: item.productSku,
          productIdentifier: "",
          serialNumber: "",
          trackingCode: "",
        }],
  );

  return {
    headerFields: [
      { label: "کد حواله", value: formatFaDigits(data.slipCode) || "-" },
      { label: "کد سفارش", value: formatFaDigits(data.orderCode) || "-" },
      { label: "تاریخ صدور", value: data.issueDate ? formatDateTime(data.issueDate) : "-" },
    ],
    informationSections,
    summaryRows,
    detailRows,
    noteFields: [
      ...(hasText(data.deliveryCode)
        ? [{ label: "کد تأیید دریافت", value: formatFaDigits(data.deliveryCode || "") }]
        : []),
      ...(hasText(data.notes) ? [{ label: "توضیحات", value: data.notes || "" }] : []),
    ],
  };
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

async function waitForPrintableAssets() {
  try {
    await document.fonts?.ready;
    await Promise.all(Array.from(document.images).map((image) =>
      image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      }),
    ));
  } catch {
    // Printing should still proceed if an asset cannot be awaited.
  }
}
