"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { ExitSlipPdfData } from "@/lib/models/warehouse.model";
import { getExitSlipPdfData } from "@/lib/services/warehouse.service";
import {
  isNajaExitSlip,
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
        if (isMounted) {
          setData(result);
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

    loadPdfData();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const resolvedCustomer = data ? resolveExitSlipPdfCustomer(data) : null;
  const resolvedRecipient = data ? resolveExitSlipPdfRecipient(data) : null;
  const isNajaOrder =
    data && resolvedRecipient
      ? isNajaExitSlip(data.order?.orderType, resolvedRecipient)
      : false;
  const itemRows =
    data?.items.flatMap((item) => {
      if (!item.units.length) {
        return [
          {
            key: item.productObjectId || item.productSku || item.productName,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            productIdentifier: "",
            serialNumber: "",
            trackingCode: "",
          },
        ];
      }

      return item.units.map((unit, index) => ({
        key:
          unit.unitObjectId ||
          `${item.productObjectId || item.productSku}-${index}`,
        productName: item.productName,
        productSku: item.productSku,
        quantity: index === 0 ? item.quantity : null,
        productIdentifier: unit.productIdentifier,
        serialNumber: unit.serialNumber,
        trackingCode: unit.trackingCode,
      }));
    }) ?? [];

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development" ||
      !data ||
      !resolvedCustomer ||
      !resolvedRecipient
    ) {
      return;
    }

    console.log("[EXIT_SLIP_CUSTOMER_DATA]", {
      exitSlip: data,
      order: data.order,
      resolvedCustomer,
      resolvedRecipient,
    });
  }, [data, resolvedCustomer, resolvedRecipient]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#E5E7EB] p-4 text-[#102034] print:bg-white print:p-0"
    >
      <style jsx global>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 0;
          }
          html,
          body {
            width: 148mm;
            min-height: 210mm;
            margin: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .pdf-page {
            box-shadow: none !important;
            border: 0 !important;
            width: 148mm !important;
            min-height: 210mm !important;
            border-radius: 0 !important;
          }
          .print-content {
            padding: 8mm 8mm 7mm !important;
          }
          .print-section,
          .print-table-row {
            break-inside: avoid;
          }
          .items-table thead {
            display: table-header-group;
          }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-[148mm] justify-end">
        <Button type="button" onClick={() => window.print()}>
          چاپ / ذخیره PDF
        </Button>
      </div>

      <section className="pdf-page relative mx-auto min-h-[210mm] w-full max-w-[148mm] overflow-hidden rounded-lg border border-[#D7DEE6] bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-100">
          <Image
            src="/1.jpg"
            alt="Asama Letterhead"
            fill
            priority
            sizes="148mm"
            className="object-cover"
          />
        </div>

        <div className="print-content relative z-10 px-5 pb-5 pt-4">
          {isLoading ? (
            <p className="text-sm text-[#6B7280]">
              در حال دریافت اطلاعات حواله...
            </p>
          ) : error ? (
            <p className="text-sm text-[#B91C1C]">{error}</p>
          ) : !data ? (
            <p className="text-sm text-[#6B7280]">اطلاعات حواله یافت نشد.</p>
          ) : (
            <div className="space-y-3 text-[10px] leading-5">
              <header className="relative flex justify-between min-h-20">
                <div className="absolute left-0 top-0  border-r-2 border-[#7BC68A] bg-white/95 px-3 py-1.5 text-[9px] leading-5 text-[#334155]">
                  <InlineInfo
                    label="کد حواله"
                    value={formatFaDigits(data.slipCode) || "-"}
                  />
                  <InlineInfo
                    label="کد سفارش"
                    value={formatFaDigits(data.orderCode) || "-"}
                  />
                  <InlineInfo
                    label="تاریخ صدور"
                    value={
                      data.issueDate ? formatDateTime(data.issueDate) : "-"
                    }
                  />
                </div>
              </header>

              <div className="flex justify-center">
                <div className="bg-white/95 px-6 py-1">
                  <h1 className="text-lg font-bold text-[#102034]">
                    حواله خروج کالا
                  </h1>
                </div>
              </div>

              <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
                <h2 className="mb-1.5 border-b border-[#E2E8F0] pb-1 text-[11px] font-bold text-[#1F3A5F]">
                  اطلاعات مرکز / مشتری سپیدار
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <InlineInfo
                    label="نام مشتری/مرکز"
                    value={resolvedCustomer?.name || "-"}
                  />
                  <InlineInfo
                    label="کد مشتری سپیدار"
                    value={
                      resolvedCustomer?.sepidarCustomerCode
                        ? formatFaDigits(resolvedCustomer.sepidarCustomerCode)
                        : "-"
                    }
                  />
                  <InlineInfo
                    label="موبایل/تلفن"
                    value={
                      resolvedCustomer?.phone
                        ? formatFaDigits(resolvedCustomer.phone)
                        : "-"
                    }
                  />
                  <InlineInfo
                    label="آدرس"
                    value={resolvedCustomer?.address || "-"}
                    className="col-span-2"
                  />
                </dl>
              </section>

              {isNajaOrder ? (
                <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
                  <h2 className="mb-1.5 border-b border-[#E2E8F0] pb-1 text-[11px] font-bold text-[#1F3A5F]">
                    اطلاعات تحویل‌گیرنده ناجا
                  </h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <InlineInfo
                      label="نام و نام خانوادگی"
                      value={resolvedRecipient?.fullName || "-"}
                    />
                    <InlineInfo
                      label="کد ملی"
                      value={
                        resolvedRecipient?.nationalId
                          ? formatFaDigits(resolvedRecipient.nationalId)
                          : "-"
                      }
                    />
                    <InlineInfo
                      label="موبایل"
                      value={
                        resolvedRecipient?.mobile
                          ? formatFaDigits(resolvedRecipient.mobile)
                          : "-"
                      }
                    />
                    <InlineInfo
                      label="شماره سفارش ناجا"
                      value={
                        resolvedRecipient?.najaOrderNumber
                          ? formatFaDigits(resolvedRecipient.najaOrderNumber)
                          : "-"
                      }
                    />
                  </dl>
                </section>
              ) : (
                <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
                  <h2 className="mb-1.5 border-b border-[#E2E8F0] pb-1 text-[11px] font-bold text-[#1F3A5F]">
                    اطلاعات تحویل
                  </h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <InlineInfo
                      label="گیرنده بار"
                      value={data.receiver.fullName || "-"}
                    />
                    <InlineInfo
                      label="موبایل گیرنده"
                      value={
                        data.receiver.phone
                          ? formatFaDigits(data.receiver.phone)
                          : "-"
                      }
                    />
                    <InlineInfo
                      label="آدرس تحویل"
                      value={
                        data.deliveryAddress.formatted ||
                        data.deliveryAddress.fullAddress ||
                        "-"
                      }
                      className="col-span-2"
                    />
                  </dl>
                </section>
              )}

              <section className="print-section overflow-hidden rounded-md border border-[#94A3B8] bg-white/95">
                <h2 className="border-b border-[#94A3B8] px-3 py-1.5 text-[11px] font-bold text-[#1F3A5F]">
                  کالاها و شناسه‌های ثبت‌شده
                </h2>
                <table className="items-table w-full table-fixed border-collapse text-right text-[8px] leading-4">
                  <thead>
                    <tr className="bg-[#EDF3F7] text-[#1F3A5F]">
                      <TableHeader className="w-6">ردیف</TableHeader>
                      <TableHeader className="w-[23%]">کالا</TableHeader>
                      <TableHeader className="w-[12%]">کد کالا</TableHeader>
                      <TableHeader className="w-8">تعداد</TableHeader>
                      <TableHeader>شناسه محصول</TableHeader>
                      <TableHeader>سریال</TableHeader>
                      <TableHeader>کد رهگیری</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {itemRows.map((row, index) => (
                      <tr
                        key={row.key}
                        className="print-table-row border-t border-[#CBD5E1]"
                      >
                        <TableCell>{formatNumber(index + 1)}</TableCell>
                        <TableCell>{row.productName || "-"}</TableCell>
                        <TableCell>
                          {row.productSku
                            ? formatFaDigits(row.productSku)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {row.quantity === null
                            ? ""
                            : formatNumber(row.quantity)}
                        </TableCell>
                        <TableCell>
                          {row.productIdentifier
                            ? formatFaDigits(row.productIdentifier)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {row.serialNumber
                            ? formatFaDigits(row.serialNumber)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {row.trackingCode
                            ? formatFaDigits(row.trackingCode)
                            : "-"}
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <InlineInfo
                    label="کد تأیید دریافت"
                    value={
                      data.deliveryCode
                        ? formatFaDigits(data.deliveryCode)
                        : "-"
                    }
                  />
                  <InlineInfo label="توضیحات" value={data.notes || "-"} />
                </dl>
              </section>

              <footer className="grid grid-cols-2 gap-8 pt-7">
                <Signature label="امضای انباردار" />
                <Signature label="امضای تحویل‌گیرنده" />
              </footer>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InlineInfo({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 items-start gap-1 ${className}`}>
      <dt className="shrink-0 font-medium text-[#64748B]">{label}:</dt>
      <dd className="min-w-0 font-semibold text-[#102034]">{value}</dd>
    </div>
  );
}

function TableHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border-l border-[#CBD5E1] px-1 py-1 font-bold last:border-l-0 ${className}`}
    >
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="break-words border-l border-[#E2E8F0] px-1 py-1 align-top last:border-l-0">
      {children}
    </td>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="pt-6">
      <div className="border-t border-[#94A3B8] pt-1.5 text-center text-[9px] font-semibold">
        {label}
      </div>
    </div>
  );
}
