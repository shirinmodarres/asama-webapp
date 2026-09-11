"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { chunkRowsByPage } from "@/components/pdf/pdf-pagination";
import { PDF_PAGE_STYLES, PdfPage } from "@/components/pdf/pdf-shell";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { StockTransferItem, StockTransferRequest } from "@/lib/models/stock.model";
import { getWarehouseStockTransfer } from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

interface TransferDetailRow {
  key: string;
  item: StockTransferItem;
  productIdentifier: string | null;
  serialNumber: string | null;
  trackingCode: string | null;
  quantity: number;
}

const FIRST_PAGE_ROWS = 14;
const NEXT_PAGE_ROWS = 20;

export default function StockTransferPdfPage() {
  const params = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<StockTransferRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const rows = useMemo(() => (transfer ? buildTransferRows(transfer) : []), [transfer]);
  const pages = useMemo(
    () => chunkRowsByPage(rows, { firstPageRows: FIRST_PAGE_ROWS, nextPageRows: NEXT_PAGE_ROWS }),
    [rows],
  );

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

  return (
    <main dir="rtl" className="min-h-screen bg-[#E5E7EB] p-4 text-[#102034] print:bg-white print:p-0">
      <style jsx global>{PDF_PAGE_STYLES}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end">
        <Button type="button" onClick={() => window.print()}>چاپ / ذخیره PDF</Button>
      </div>
      {isLoading ? (
        <PdfPage><p className="text-sm text-[#6B7280]">در حال دریافت حواله انتقال...</p></PdfPage>
      ) : error ? (
        <PdfPage><p className="text-sm text-[#B91C1C]">{error}</p></PdfPage>
      ) : !transfer ? (
        <PdfPage><p className="text-sm text-[#6B7280]">حواله انتقال یافت نشد.</p></PdfPage>
      ) : (
        <div className="space-y-0">
          {pages.map((pageRows, pageIndex) => {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === pages.length - 1;
            const startIndex = isFirstPage ? 0 : FIRST_PAGE_ROWS + (pageIndex - 1) * NEXT_PAGE_ROWS;
            return (
              <PdfPage key={`transfer-page-${pageIndex}`} pageBreakAfter={!isLastPage}>
                <TransferDocument
                  transfer={transfer}
                  rows={pageRows}
                  startIndex={startIndex}
                  showTransferInfo={isFirstPage}
                  showFooter={isLastPage}
                />
              </PdfPage>
            );
          })}
        </div>
      )}
    </main>
  );
}

function TransferDocument({ transfer, rows, startIndex, showTransferInfo, showFooter }: {
  transfer: StockTransferRequest;
  rows: TransferDetailRow[];
  startIndex: number;
  showTransferInfo: boolean;
  showFooter: boolean;
}) {
  return (
    <div className="space-y-3 text-[11px] leading-5.5">
      <header className="relative flex min-h-24 items-start justify-between">
        <div className="absolute left-0 top-[-12px] w-fit border-r-2 border-[#7BC68A] bg-white/95 px-2 py-0.5 text-[9px] leading-5 text-[#334155]">
          <Info label="کد انتقال" value={formatFaDigits(transfer.objectId)} />
          <Info label="تاریخ" value={transfer.createdAt ? formatDateTime(transfer.createdAt) : "-"} />
          <Info label="وضعیت" value={transfer.statusLabel || "-"} />
        </div>
      </header>
      <div className="flex justify-center">
        <div className="bg-white/95 px-6 py-1"><h1 className="text-lg font-bold text-[#102034]">حواله انتقال کالا</h1></div>
      </div>
      {showTransferInfo ? (
        <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
          <h2 className="mb-1.5 border-b border-[#E2E8F0] pb-1 text-[10.5px] font-bold text-[#1F3A5F]">اطلاعات انتقال</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9.5px]">
            <Info label="انبار مبدأ" value={transfer.sourceStockTitle || "-"} />
            <Info label="انبار مقصد" value={transfer.destinationStockTitle || "-"} />
            <Info label="درخواست‌کننده" value={transfer.requestedByName || "-"} />
            <Info label="تأییدکننده" value={transfer.approvedByName || "-"} />
          </dl>
        </section>
      ) : null}
      <TransferItemsTable rows={rows} startIndex={startIndex} />
      {showFooter ? (
        <>
          <section className="print-section flex items-center justify-between rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2 text-[9.5px]">
            <span className="font-medium text-[#64748B]">تعداد کل اقلام</span>
            <span className="font-semibold text-[#102034]">{formatNumber(transfer.quantity)}</span>
          </section>
          <footer className="grid grid-cols-2 gap-8 pt-7">
            <Signature label="امضای انباردار مبدأ" />
            <Signature label="امضای انباردار مقصد" />
          </footer>
        </>
      ) : null}
    </div>
  );
}

function TransferItemsTable({ rows, startIndex }: { rows: TransferDetailRow[]; startIndex: number }) {
  return (
    <section className="print-section print-table-section rounded-md border border-[#94A3B8] bg-white/95">
      <h2 className="border-b border-[#94A3B8] px-3 py-1.5 text-[10.5px] font-bold text-[#1F3A5F]">جزئیات اقلام</h2>
      <table className="items-table w-full table-fixed border-collapse text-right text-[10px] leading-4">
        <thead><tr className="bg-[#EDF3F7] text-[#1F3A5F]">
          <TableHeader className="w-10">ردیف</TableHeader>
          <TableHeader className="w-[28%]">نام کالا</TableHeader>
          <TableHeader className="w-[15%]">کد کالا</TableHeader>
          <TableHeader className="w-[13%]">شناسه</TableHeader>
          <TableHeader className="w-[17%]">سریال</TableHeader>
          <TableHeader className="w-[17%]">کد رهگیری</TableHeader>
          <TableHeader className="w-12">تعداد</TableHeader>
        </tr></thead>
        <tbody>{rows.map((row, index) => (
          <tr key={row.key} className="print-table-row border-t border-[#CBD5E1]">
            <TableCell>{formatNumber(startIndex + index + 1)}</TableCell>
            <TableCell>{row.item.productName || row.item.productNameSnapshot || "-"}</TableCell>
            <TableCell>{row.item.productCode ? formatFaDigits(row.item.productCode) : "-"}</TableCell>
            <TableCell>{formatFaDigits(row.productIdentifier) || "-"}</TableCell>
            <TableCell>{formatFaDigits(row.serialNumber) || "-"}</TableCell>
            <TableCell>{formatFaDigits(row.trackingCode) || "-"}</TableCell>
            <TableCell>{formatNumber(row.quantity)}</TableCell>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}

function buildTransferRows(transfer: StockTransferRequest): TransferDetailRow[] {
  const items: StockTransferItem[] = transfer.items.length ? transfer.items : [{
    productObjectId: transfer.productObjectId || "",
    sepidarItemId: transfer.sepidarItemId,
    productCode: transfer.productCode,
    productName: transfer.productName,
    productNameSnapshot: transfer.productName,
    quantity: transfer.quantity,
    scannedUnitIds: transfer.scannedUnitObjectIds,
    scannedUnitObjectIds: transfer.scannedUnitObjectIds,
  }];
  return items.flatMap((item, itemIndex) =>
    item.units?.length
      ? item.units.map((unit, unitIndex) => ({
          key: unit.unitObjectId || `${item.productObjectId}-${itemIndex}-${unitIndex}`,
          item,
          productIdentifier: unit.productIdentifier,
          serialNumber: unit.serialNumber,
          trackingCode: unit.trackingCode,
          quantity: 1,
        }))
      : [{
          key: `${item.productObjectId}-${itemIndex}`,
          item,
          productIdentifier: null,
          serialNumber: null,
          trackingCode: null,
          quantity: item.quantity,
        }],
  );
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

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-1"><dt className="shrink-0 font-medium text-[#64748B]">{label}:</dt><dd className="min-w-0 font-semibold text-[#102034]">{value}</dd></div>;
}

function TableHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`border-l border-[#CBD5E1] px-1 py-1 font-bold last:border-l-0 ${className}`}>{children}</th>;
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="break-words whitespace-normal border-l border-[#E2E8F0] px-1 py-1 align-top last:border-l-0">{children}</td>;
}

function Signature({ label }: { label: string }) {
  return <div className="pt-6"><div className="border-t border-[#94A3B8] pt-1.5 text-center text-[9.5px] font-semibold">{label}</div></div>;
}
