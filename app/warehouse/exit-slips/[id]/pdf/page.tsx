"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { ExitSlipPdfData } from "@/lib/models/warehouse.model";
import { getExitSlipPdfData } from "@/lib/services/warehouse.service";
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
          .pdf-page {
            box-shadow: none !important;
            border: 0 !important;
            width: 100% !important;
            min-height: 297mm !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end">
        <Button type="button" onClick={() => window.print()}>
          چاپ / ذخیره PDF
        </Button>
      </div>

      <section className="pdf-page relative mx-auto min-h-[297mm] w-full max-w-[210mm] overflow-hidden rounded-xl border border-[#D7DEE6] bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-100">
          <Image
            src="/1.jpg"
            alt="Asama Letterhead"
            fill
            priority
            sizes="210mm"
            className="object-cover"
          />
        </div>

        <div className="relative z-10 p-8">
          {isLoading ? (
            <p className="text-sm text-[#6B7280]">
              در حال دریافت اطلاعات حواله...
            </p>
          ) : error ? (
            <p className="text-sm text-[#B91C1C]">{error}</p>
          ) : !data ? (
            <p className="text-sm text-[#6B7280]">اطلاعات حواله یافت نشد.</p>
          ) : (
            <div className="space-y-6">
              <header className="relative min-h-[120px] pb-5 pt-16">
                <div className="absolute left-0 top-0 w-[265px] border-r-2 border-[#7BC68A] bg-white px-4  text-right text-sm leading-8 text-[#334155] ">
                  <p>کد حواله: {formatFaDigits(data.slipCode)}</p>
                  <p>کد سفارش: {formatFaDigits(data.orderCode)}</p>
                  <p>
                    تاریخ صدور:{" "}
                    {data.issueDate ? formatDateTime(data.issueDate) : "-"}
                  </p>
                </div>
              </header>

              <div className="flex justify-center py-2">
                <div className="rounded-xl bg-white px-8 ">
                  <h1 className="text-2xl font-bold text-[#102034]">
                    حواله خروج کالا
                  </h1>
                </div>
              </div>

              <section className="grid gap-3 sm:grid-cols-2">
                <Info label="مشتری" value={data.customer.name || "-"} />
                <Info
                  label="شماره مشتری"
                  value={
                    data.customer.phone
                      ? formatFaDigits(data.customer.phone)
                      : "-"
                  }
                />
                <Info
                  label="گیرنده بار"
                  value={data.receiver.fullName || "-"}
                />
                <Info
                  label="موبایل گیرنده"
                  value={
                    data.receiver.phone
                      ? formatFaDigits(data.receiver.phone)
                      : "-"
                  }
                />
                <Info
                  label="آدرس تحویل"
                  value={
                    data.deliveryAddress.formatted ||
                    data.deliveryAddress.fullAddress ||
                    "-"
                  }
                  className="sm:col-span-2"
                />
              </section>

              <section className="space-y-4">
                {data.items.map((item) => (
                  <div
                    key={item.productObjectId || item.productSku || item.productName}
                    className="rounded-lg border border-[#D7DEE6] p-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Info label="کالا" value={item.productName || "-"} />
                      <Info
                        label="کد کالا"
                        value={
                          item.productSku ? formatFaDigits(item.productSku) : "-"
                        }
                      />
                      <Info label="تعداد" value={formatNumber(item.quantity)} />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-[#1F3A5F]">
                      شناسه‌های ثبت‌شده:
                    </p>
                    <table className="mt-2 w-full border-collapse text-right text-sm">
                      <thead>
                        <tr className="bg-[#F8FBFD]">
                          {["شناسه محصول", "سریال", "کد رهگیری"].map(
                            (header) => (
                              <th
                                key={header}
                                className="border border-[#D7DEE6] px-3 py-2 font-semibold text-[#1F3A5F]"
                              >
                                {header}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {item.units.map((unit, index) => (
                          <tr
                            key={
                              unit.unitObjectId ||
                              `${item.productSku}-${index}`
                            }
                          >
                            <td className="border border-[#D7DEE6] px-3 py-2">
                              {unit.productIdentifier
                                ? formatFaDigits(unit.productIdentifier)
                                : "-"}
                            </td>
                            <td className="border border-[#D7DEE6] px-3 py-2">
                              {unit.serialNumber
                                ? formatFaDigits(unit.serialNumber)
                                : "-"}
                            </td>
                            <td className="border border-[#D7DEE6] px-3 py-2">
                              {unit.trackingCode
                                ? formatFaDigits(unit.trackingCode)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <Info
                  label="کد تأیید دریافت"
                  value={
                    data.deliveryCode ? formatFaDigits(data.deliveryCode) : "-"
                  }
                />
                <Info label="توضیحات" value={data.notes || "-"} />
              </section>

              <footer className="grid gap-8 pt-12 sm:grid-cols-2">
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

function Info({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-[#D7DEE6] p-3 ${className}`}>
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-7">{value}</dd>
    </div>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="pt-10">
      <div className="border-t border-[#94A3B8] pt-3 text-center text-sm font-semibold">
        {label}
      </div>
    </div>
  );
}
