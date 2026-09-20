"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PDF_PAGE_STYLES } from "@/components/pdf/pdf-shell";
import { Button } from "@/components/ui/button";
import {
  ExitSlipPdfDocument,
  type SlipDetailRow,
  type SlipSummaryRow,
} from "@/components/warehouse/exit-slip-pdf-document";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { StockTransferItem, StockTransferRequest } from "@/lib/models/stock.model";
import { getWarehouseStockTransfer } from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function StockTransferPdfPage() {
  const params = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<StockTransferRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadTransfer() {
      setIsLoading(true);
      setError("");
      try {
        const result = await getWarehouseStockTransfer(params.id);
        if (!isMounted) return;
        setTransfer(result);
        document.title = `حواله انتقال - ${result.destinationStockTitle || result.sourceStockTitle || "انبار"}`;
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
    void loadTransfer();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const documentData = transfer ? buildTransferDocumentData(transfer) : null;

  return (
    <main dir="rtl" className="min-h-screen bg-[#E5E7EB] p-4 text-[#102034] print:bg-white print:p-0">
      <style jsx global>{PDF_PAGE_STYLES}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end">
        <Button type="button" onClick={() => window.print()}>
          چاپ / ذخیره PDF
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-[#6B7280]">در حال دریافت حواله انتقال...</p>
      ) : error ? (
        <p className="text-sm text-[#B91C1C]">{error}</p>
      ) : !transfer || !documentData ? (
        <p className="text-sm text-[#6B7280]">حواله انتقال یافت نشد.</p>
      ) : (
        <ExitSlipPdfDocument
          title="حواله انتقال کالا"
          headerFields={documentData.headerFields}
          informationSections={documentData.informationSections}
          summaryRows={documentData.summaryRows}
          detailRows={documentData.detailRows}
          noteFields={documentData.noteFields}
          signatureLabels={["امضای انباردار مبدأ", "امضای انباردار مقصد"]}
        />
      )}
    </main>
  );
}

function buildTransferDocumentData(transfer: StockTransferRequest) {
  const items = resolveTransferItems(transfer);
  const summaryRows: SlipSummaryRow[] = items.map((item, index) => ({
    key: item.productObjectId || item.productCode || `transfer-item-${index}`,
    productName: item.productName || item.productNameSnapshot || "-",
    quantity: item.quantity,
  }));
  const detailRows: SlipDetailRow[] = items.flatMap((item, itemIndex) =>
    item.units?.length
      ? item.units.map((unit, unitIndex) => ({
          key: unit.unitObjectId || `${item.productObjectId}-${itemIndex}-${unitIndex}`,
          productName: item.productName || item.productNameSnapshot || "-",
          productSku: item.productCode || "",
          productIdentifier: unit.productIdentifier || "",
          serialNumber: unit.serialNumber || "",
          trackingCode: unit.trackingCode || "",
        }))
      : [{
          key: `${item.productObjectId}-${itemIndex}`,
          productName: item.productName || item.productNameSnapshot || "-",
          productSku: item.productCode || "",
          productIdentifier: "",
          serialNumber: "",
          trackingCode: "",
        }],
  );

  return {
    headerFields: [
      { label: "کد انتقال", value: formatFaDigits(transfer.objectId) || "-" },
      { label: "تاریخ", value: transfer.createdAt ? formatDateTime(transfer.createdAt) : "-" },
      { label: "وضعیت", value: transfer.statusLabel || "-" },
    ],
    informationSections: [{
      title: "اطلاعات انتقال",
      fields: [
        { label: "انبار مبدأ", value: transfer.sourceStockTitle || "-" },
        { label: "انبار مقصد", value: transfer.destinationStockTitle || "-" },
        { label: "درخواست‌کننده", value: transfer.requestedByName || "-" },
        { label: "تأییدکننده", value: transfer.approvedByName || "-" },
      ],
    }],
    summaryRows,
    detailRows,
    noteFields: transfer.note ? [{ label: "توضیحات", value: transfer.note }] : [],
  };
}

function resolveTransferItems(transfer: StockTransferRequest): StockTransferItem[] {
  if (transfer.items.length) return transfer.items;
  return [{
    productObjectId: transfer.productObjectId || "",
    sepidarItemId: transfer.sepidarItemId,
    productCode: transfer.productCode,
    productName: transfer.productName,
    productNameSnapshot: transfer.productName,
    quantity: transfer.quantity,
    scannedUnitIds: transfer.scannedUnitObjectIds,
    scannedUnitObjectIds: transfer.scannedUnitObjectIds,
  }];
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
