"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { WebsiteOrder } from "@/lib/models/shop.model";
import { getWebsiteOrder } from "@/lib/services/shop-admin.service";
import {
  formatFaCurrency,
  formatFaDigits,
  formatFaNumber,
} from "@/lib/utils/number-format";

export default function WebsiteOrderInvoicePage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<WebsiteOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const printed = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getWebsiteOrder(params.id);
        if (isMounted) setOrder(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadOrder();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!order || printed.current) return;
    const shouldPrint = new URLSearchParams(window.location.search).get("print") === "1";
    if (!shouldPrint) return;
    printed.current = true;
    let cancelled = false;

    async function printWhenReady() {
      await document.fonts?.ready;
      await Promise.all(
        Array.from(document.images).map(
          (image) =>
            image.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  image.addEventListener("load", () => resolve(), { once: true });
                  image.addEventListener("error", () => resolve(), { once: true });
                }),
        ),
      );
      if (!cancelled) window.print();
    }

    void printWhenReady();
    return () => {
      cancelled = true;
    };
  }, [order]);

  return (
    <DashboardLayout role="support" title="فاکتور سفارش سایت">
      <style jsx global>{`
        @media print {
          @page {
            size: A5;
            margin: 8mm;
          }

          html,
          body {
            background: #fff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          body * {
            visibility: hidden !important;
          }

          .shop-invoice-paper,
          .shop-invoice-paper * {
            visibility: visible !important;
          }

          .shop-invoice-paper {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            min-height: 194mm !important;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .invoice-no-break,
          .shop-invoice-paper tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 print:hidden">
        <div className="flex flex-wrap justify-center gap-2 rounded-2xl border border-[#D9E0E8] bg-white/95 p-2 shadow-xl backdrop-blur">
          <Button asChild variant="outline">
            <Link href={`/support/shop/orders/${params.id}`}>
              <ArrowRight />
              بازگشت
            </Link>
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer />
            چاپ / ذخیره PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState title="در حال دریافت اطلاعات فاکتور" />
      ) : error ? (
        <InlineErrorMessage message={error} />
      ) : !order ? (
        <InlineErrorMessage message="سفارش موردنظر پیدا نشد." />
      ) : (
        <InvoiceDocument order={order} />
      )}
    </DashboardLayout>
  );
}

function InvoiceDocument({ order }: { order: WebsiteOrder }) {
  const recipientName = [order.recipientFirstName, order.recipientLastName]
    .filter(Boolean)
    .join(" ");
  const description = order.orderNote || order.supportNote;

  return (
    <section
      dir="rtl"
      className="shop-invoice-paper relative mx-auto min-h-[210mm] w-full max-w-[148mm] overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white text-[#111827] shadow-[0_22px_60px_rgba(15,23,42,0.16)]"
    >
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/1.jpg"
          alt="سربرگ A5 آساما"
          fill
          priority
          sizes="148mm"
          className="object-fill"
        />
      </div>

      <div className="absolute left-[9mm] top-[8mm] z-10 space-y-[2.5mm] text-right text-[9px] leading-none text-[#111827]">
        <p>{formatDateTime(order.createdAt)}</p>
        <p>{formatFaDigits(order.orderNumber)}</p>
      </div>

      <div className="relative z-10 px-[8mm] pb-[25mm] pt-[30mm] text-[10px] leading-5">
        <header className="mb-3 text-center">
          <h1 className="text-lg font-black text-[#1F3A5F]">فاکتور فروش</h1>
        </header>

        <div>
          <InvoiceSection title="اطلاعات گیرنده">
            <InvoiceInfo label="نام و نام خانوادگی" value={recipientName || order.customerName || "-"} />
            <InvoiceInfo label="موبایل" value={formatFaDigits(order.recipientMobile || order.customerMobile) || "-"} />
            <InvoiceInfo label="استان / شهر" value={[order.province, order.city].filter(Boolean).join("، ") || "-"} />
            <InvoiceInfo label="کد پستی" value={formatFaDigits(order.postalCode) || "-"} />
            <div className="col-span-2">
              <InvoiceInfo label="آدرس" value={order.shippingAddress || "-"} />
            </div>
          </InvoiceSection>
        </div>

        <section className="mt-2 overflow-hidden rounded-lg border border-[#9CA3AF] bg-white/95">
          <table className="w-full border-collapse text-right text-[9px]">
            <thead>
              <tr className="bg-[#E5E7EB] text-[#111827]">
                <th className="w-7 border border-[#9CA3AF] px-1 py-1.5 text-center">ردیف</th>
                <th className="border border-[#9CA3AF] px-1.5 py-1.5">عنوان کالا</th>
                <th className="w-18 border border-[#9CA3AF] px-1.5 py-1.5">کد کالا</th>
                <th className="w-10 border border-[#9CA3AF] px-1 py-1.5 text-center">تعداد</th>
                <th className="w-20 border border-[#9CA3AF] px-1.5 py-1.5">قیمت واحد</th>
                <th className="w-20 border border-[#9CA3AF] px-1.5 py-1.5">مبلغ کل</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.objectId || `${item.productObjectId}-${index}`}>
                  <td className="border border-[#9CA3AF] px-1 py-1.5 text-center">{formatFaNumber(index + 1)}</td>
                  <td className="border border-[#9CA3AF] px-1.5 py-1.5 font-semibold">{item.productTitle || "-"}</td>
                  <td className="border border-[#9CA3AF] px-1.5 py-1.5">{formatFaDigits(item.productSku) || "-"}</td>
                  <td className="border border-[#9CA3AF] px-1 py-1.5 text-center">{formatFaNumber(item.quantity)}</td>
                  <td className="border border-[#9CA3AF] px-1.5 py-1.5 whitespace-nowrap">{formatFaCurrency(item.unitPrice)}</td>
                  <td className="border border-[#9CA3AF] px-1.5 py-1.5 whitespace-nowrap font-bold">{formatFaCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="mt-2 flex items-stretch justify-end gap-2">
          {description ? (
            <div className="min-w-0 flex-1">
              <InvoiceSection title="توضیحات">
                <p className="col-span-2 min-h-10 text-[#374151]">{description}</p>
              </InvoiceSection>
            </div>
          ) : null}

          <section className="invoice-no-break w-[220px] shrink-0 rounded-lg border border-[#9CA3AF] bg-white/95 p-2">
            <AmountRow label="جمع کالاها" value={order.productTotal} />
            <AmountRow label="هزینه ارسال" value={order.shippingPrice} />
            <AmountRow label="تخفیف" value={order.discountAmount} />
            <div className="mt-1 border-t border-[#6B7280] pt-1">
              <AmountRow label="مبلغ نهایی" value={order.finalAmount} strong />
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function InvoiceSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="invoice-no-break rounded-lg border border-[#9CA3AF] bg-white/95 p-2">
      <h2 className="mb-1.5 border-b border-[#D1D5DB] pb-1 text-[11px] font-black text-[#1F3A5F]">{title}</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">{children}</div>
    </section>
  );
}

function InvoiceInfo({ label, value }: { label: string; value: string }) {
  return <p><span className="text-[#6B7280]">{label}: </span><strong>{value}</strong></p>;
}

function AmountRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-2 py-0.5 ${strong ? "text-[11px] font-black text-[#111827]" : "text-[#374151]"}`}>
      <span>{label}</span>
      <span className="whitespace-nowrap">{formatFaCurrency(value)}</span>
    </div>
  );
}
