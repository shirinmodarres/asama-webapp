"use client";

import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type {
  InternalInvoice,
  InternalInvoiceItem,
} from "@/lib/models/internal-invoice.model";
import {
  getInternalInvoice,
  markInternalInvoiceEntered,
} from "@/lib/services/internal-invoice.service";
import { getInternalInvoiceStatusLabel } from "@/lib/mappers/internal-invoice.mapper";
import {
  formatFaCurrency,
  formatFaDigits,
  formatFaNumber,
} from "@/lib/utils/number-format";

export default function InternalInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InternalInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState("");
  const [accountantNote, setAccountantNote] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInvoice() {
      setIsLoading(true);
      setError("");
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

  const handleMarkEntered = async () => {
    setFieldError("");
    if (!manualInvoiceNumber.trim()) {
      setFieldError("شماره فاکتور حسابداری الزامی است.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const updated = await markInternalInvoiceEntered(params.id, {
        manualInvoiceNumber,
        accountantNote,
      });
      setInvoice(updated);
      setMessage("فاکتور داخلی به عنوان ثبت‌شده در حسابداری علامت‌گذاری شد.");
      setIsDialogOpen(false);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<InternalInvoiceItem>[] = [
    {
      key: "row",
      header: "ردیف",
      render: (row) => formatFaNumber(row.rowNumber),
    },
    {
      key: "code",
      header: "کد کالا",
      render: (row) => formatFaDigits(row.productCode) || "-",
    },
    { key: "name", header: "نام کالا", render: (row) => row.productName || "-" },
    {
      key: "quantity",
      header: "تعداد",
      render: (row) => formatFaNumber(row.quantity),
    },
    {
      key: "unitPrice",
      header: "قیمت واحد",
      render: (row) => formatFaCurrency(row.unitPrice),
    },
    {
      key: "lineTotal",
      header: "مبلغ ردیف",
      render: (row) => formatFaCurrency(row.lineTotal),
    },
    {
      key: "units",
      header: "سریال / کد رهگیری",
      cellClassName: "max-w-[320px] whitespace-normal",
      render: (row) =>
        row.serialNumbers.length ||
        row.trackingCodes.length ||
        row.productIdentifiers.length
          ? [
              row.serialNumbers.length
                ? `سریال: ${row.serialNumbers.map(formatFaDigits).join("، ")}`
                : null,
              row.trackingCodes.length
                ? `رهگیری: ${row.trackingCodes.map(formatFaDigits).join("، ")}`
                : null,
              row.productIdentifiers.length
                ? `شناسه: ${row.productIdentifiers.map(formatFaDigits).join("، ")}`
                : null,
            ]
              .filter(Boolean)
              .join(" / ")
          : "-",
    },
  ];

  return (
    <DashboardLayout role="finance" title="جزئیات فاکتور داخلی">
      {isLoading ? (
        <LoadingState title="در حال دریافت فاکتور داخلی" />
      ) : error && !invoice ? (
        <PageErrorMessage
          title="دریافت فاکتور داخلی انجام نشد"
          message={error}
        />
      ) : !invoice ? (
        <EmptyState
          title="فاکتور داخلی یافت نشد"
          description="شناسه فاکتور معتبر نیست."
        />
      ) : (
        <div className="space-y-5">
          <SectionHeader
            title={`فاکتور داخلی ${formatFaDigits(invoice.invoiceNumber || invoice.id)}`}
            description="اطلاعات حواله خروج و مبالغ سفارش را پیش از ثبت دستی بررسی کنید."
            actions={
              <div className="flex flex-wrap gap-2">
                {invoice.pdfUrl ? (
                  <Button asChild variant="outline">
                    <a href={invoice.pdfUrl} target="_blank" rel="noreferrer">
                      <Download className="size-4" />
                      دانلود فاکتور داخلی
                    </a>
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href={`/accounting/internal-invoices/${params.id}/print`}>
                    <Printer className="size-4" />
                    چاپ فاکتور
                  </Link>
                </Button>
                {invoice.status === "ready_for_accounting" ? (
                  <Button type="button" onClick={() => setIsDialogOpen(true)}>
                    علامت‌گذاری به عنوان ثبت‌شده در حسابداری
                  </Button>
                ) : null}
              </div>
            }
          />

          {message ? (
            <div className="asama-banner px-4 py-3 text-sm">{message}</div>
          ) : null}
          {error ? <InlineErrorMessage message={error} /> : null}

          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Info label="شماره سفارش" value={formatFaDigits(invoice.orderNumber) || "-"} />
              <Info label="شماره حواله خروج" value={formatFaDigits(invoice.exitSlipNumber) || "-"} />
              <Info label="مشتری" value={invoice.customerName || "-"} />
              <Info
                label="کد مشتری"
                value={formatFaDigits(
                  invoice.sepidarCustomerCode || invoice.customerCode,
                ) || "-"}
              />
              <Info
                label="موبایل مشتری"
                value={formatFaDigits(
                  invoice.customerMobile || invoice.customerPhone,
                ) || "-"}
              />
              <Info
                label="آدرس مشتری"
                value={invoice.customerAddress || "-"}
              />
              <Info label="انبار خروج" value={invoice.stockTitle || "-"} />
              <Info label="نوع فروش" value={invoice.saleTypeTitle || "-"} />
              <Info
                label="تاریخ فاکتور"
                value={formatDateTime(invoice.invoiceDate || invoice.createdAt)}
              />
              <div>
                <p className="text-xs text-[#6B7280]">وضعیت</p>
                <Badge
                  className="mt-2"
                  variant={
                    invoice.status === "entered_manually"
                      ? "success"
                      : invoice.status === "cancelled"
                        ? "destructive"
                        : "warning"
                  }
                  dot
                >
                  {getInternalInvoiceStatusLabel(
                    invoice.status,
                    invoice.statusLabel,
                  )}
                </Badge>
              </div>
              {invoice.manualInvoiceNumber ? (
                <Info
                  label="شماره ثبت حسابداری"
                  value={formatFaDigits(invoice.manualInvoiceNumber)}
                />
              ) : null}
            </div>
          </Card>

          {hasRecipientInfo(invoice) ? (
            <Card className="p-5">
              <h3 className="mb-4 font-semibold text-[#102034]">
                اطلاعات تحویل‌گیرنده ناجا
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Info label="نام" value={invoice.recipientFirstName || "-"} />
                <Info label="نام خانوادگی" value={invoice.recipientLastName || "-"} />
                <Info label="کد ملی" value={formatFaDigits(invoice.recipientNationalId) || "-"} />
                <Info label="موبایل" value={formatFaDigits(invoice.recipientMobile) || "-"} />
                <Info label="شماره سفارش" value={formatFaDigits(invoice.najaOrderNumber) || "-"} />
              </div>
            </Card>
          ) : null}

          <DataTable
            columns={columns}
            rows={invoice.items}
            rowKey={(row) => row.objectId || row.productObjectId || row.productCode}
          />

          <Card className="p-5">
            <div className="mr-auto grid max-w-xl gap-3 sm:grid-cols-2">
              <Total label="مبلغ ناخالص" value={invoice.grossAmount} />
              <Total label="تخفیف" value={invoice.discount} />
              <Total label="مالیات" value={invoice.tax} />
              <Total label="عوارض" value={invoice.duty} />
              <Total label="اضافات" value={invoice.addition} />
              <Total label="مبلغ خالص" value={invoice.netAmount} emphasis />
            </div>
          </Card>

          <Button asChild variant="outline">
            <Link href="/accounting/internal-invoices">بازگشت به فهرست</Link>
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ثبت فاکتور در حسابداری</DialogTitle>
                <DialogDescription>
                  شماره ثبت دستی و توضیح حسابدار را وارد کنید.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-[#334155]">
                  <span>شماره فاکتور حسابداری</span>
                  <Input
                    value={manualInvoiceNumber}
                    onChange={(event) => {
                      setManualInvoiceNumber(event.target.value);
                      setFieldError("");
                    }}
                    inputMode="numeric"
                    aria-invalid={Boolean(fieldError)}
                  />
                  <FieldError message={fieldError} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#334155]">
                  <span>یادداشت حسابدار</span>
                  <Textarea
                    value={accountantNote}
                    onChange={(event) => setAccountantNote(event.target.value)}
                  />
                </label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="button"
                  onClick={handleMarkEntered}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت شد در حسابداری"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#102034]">{value}</p>
    </div>
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
      className={
        emphasis
          ? "flex items-center justify-between rounded-xl bg-[#1F3A5F] px-4 py-3 text-white"
          : "flex items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-3"
      }
    >
      <span className="text-sm">{label}</span>
      <span className="font-semibold">{formatFaCurrency(value)}</span>
    </div>
  );
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
