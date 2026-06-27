"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/expert/utils";
import {
  getWebsiteOrderStatusLabel,
  getWebsitePaymentStatusLabel,
} from "@/lib/mappers/shop.mapper";
import type {
  WebsiteOrder,
  WebsiteOrderItem,
  WebsiteOrderStatus,
} from "@/lib/models/shop.model";
import {
  getWebsiteOrder,
  updateWebsiteOrderStatus,
  updateWebsiteOrderSupportNote,
} from "@/lib/services/shop-admin.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const ORDER_STATUS_OPTIONS: WebsiteOrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
  "refunded",
];

export default function WebsiteOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<WebsiteOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<WebsiteOrderStatus>("processing");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [supportNote, setSupportNote] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getWebsiteOrder(params.id);
        if (!isMounted) return;
        setOrder(data);
        setSelectedStatus(data.orderStatus);
        setSupportNote(data.supportNote ?? "");
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const itemTotal = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.lineTotal, 0) ?? 0,
    [order],
  );

  const columns: DataTableColumn<WebsiteOrderItem>[] = [
    {
      key: "product",
      header: "کالا",
      render: (row) => row.productTitle || "-",
    },
    {
      key: "sku",
      header: "کد کالا",
      render: (row) => formatFaDigits(row.productSku) || "-",
    },
    {
      key: "quantity",
      header: "تعداد",
      render: (row) => formatNumber(row.quantity),
    },
    {
      key: "unitPrice",
      header: "قیمت واحد",
      render: (row) => formatCurrency(row.unitPrice),
    },
    {
      key: "lineTotal",
      header: "مبلغ ردیف",
      render: (row) => formatCurrency(row.lineTotal),
    },
  ];

  const handleStatusSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateWebsiteOrderStatus(order.objectId, selectedStatus);
      setOrder(updated);
      setMessage("وضعیت سفارش سایت به‌روزرسانی شد.");
      setStatusDialogOpen(false);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatus = async (status: WebsiteOrderStatus) => {
    if (!order) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateWebsiteOrderStatus(order.objectId, status);
      setOrder(updated);
      setSelectedStatus(updated.orderStatus);
      setMessage("وضعیت سفارش سایت به‌روزرسانی شد.");
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNoteSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateWebsiteOrderSupportNote(
        order.objectId,
        supportNote,
      );
      setOrder(updated);
      setMessage("یادداشت پشتیبانی ذخیره شد.");
      setNoteDialogOpen(false);
    } catch (noteError) {
      setError(getErrorMessage(noteError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="جزئیات سفارش سایت">
      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش سایت" />
      ) : error && !order ? (
        <InlineErrorMessage message={error} />
      ) : !order ? (
        <EmptyState
          title="سفارش سایت پیدا نشد"
          description="شناسه سفارش معتبر نیست یا رکوردی برای آن وجود ندارد."
        />
      ) : (
        <>
          <SectionHeader
            title={`سفارش ${formatFaDigits(order.orderNumber)}`}
            description="جزئیات سفارش ثبت‌شده در فروشگاه عمومی"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={`/support/shop/orders/${order.objectId}/invoice`}>
                    <FileText />
                    مشاهده فاکتور
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/support/shop/orders/${order.objectId}/invoice?print=1`}>
                    <Printer />
                    چاپ / ذخیره PDF
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/support/shop/orders">بازگشت به سفارش‌ها</Link>
                </Button>
              </div>
            }
          />
          {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
          {error ? <InlineErrorMessage message={error} /> : null}

          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="brand">
                      {getWebsiteOrderStatusLabel(order.orderStatus)}
                    </Badge>
                    <Badge
                      variant={order.paymentStatus === "paid" ? "success" : "warning"}
                    >
                      {getWebsitePaymentStatusLabel(order.paymentStatus)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatus("processing")}
                      disabled={isSubmitting}
                    >
                      در حال پردازش
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatus("packed")}
                      disabled={isSubmitting}
                    >
                      بسته‌بندی شد
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatus("shipped")}
                      disabled={isSubmitting}
                    >
                      ارسال شد
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatus("delivered")}
                      disabled={isSubmitting}
                    >
                      تحویل شد
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatus("cancelled")}
                      disabled={isSubmitting}
                    >
                      لغو سفارش
                    </Button>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Info label="مشتری" value={order.customerName || "-"} />
                  <Info
                    label="موبایل"
                    value={formatFaDigits(order.customerMobile) || "-"}
                  />
                  <Info label="استان" value={order.province || "-"} />
                  <Info label="شهر" value={order.city || "-"} />
                  <Info
                    label="تاریخ ثبت"
                    value={order.createdAt ? formatDateTime(order.createdAt) : "-"}
                  />
                  <Info
                    label="کد پستی"
                    value={
                      order.postalCode ? formatFaDigits(order.postalCode) : "-"
                    }
                  />
                </dl>
                <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm leading-7 text-[#334155]">
                  <span className="font-semibold">آدرس ارسال: </span>
                  {order.shippingAddress || "-"}
                </div>
              </Card>

              <DataTable
                columns={columns}
                rows={order.items}
                rowKey={(row) => row.objectId || row.productObjectId}
              />

              <Card className="p-5">
                <h3 className="text-base font-semibold text-[#102034]">
                  روند وضعیت
                </h3>
                <div className="mt-4 space-y-3">
                  {order.timeline.length ? (
                    order.timeline.map((item, index) => (
                      <div
                        key={`${item.status}-${item.createdAt}-${index}`}
                        className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm leading-7"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-[#102034]">
                            {item.label}
                          </span>
                          <span className="text-xs text-[#64748B]">
                            {item.createdAt ? formatDateTime(item.createdAt) : "-"}
                          </span>
                        </div>
                        {item.note ? (
                          <p className="text-[#64748B]">{item.note}</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#64748B]">
                      روندی برای این سفارش ثبت نشده است.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-5">
                <h3 className="text-base font-semibold text-[#102034]">
                  جمع سفارش
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <Summary label="جمع کالاها" value={formatCurrency(itemTotal || order.productTotal)} />
                  <Summary label="هزینه ارسال" value={formatCurrency(order.shippingPrice)} />
                  <Summary label="کد تخفیف" value={order.discountCode || "-"} />
                  <Summary label="تخفیف" value={formatCurrency(order.discountAmount)} />
                  <Summary label="مبلغ نهایی" value={formatCurrency(order.finalAmount)} strong />
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-base font-semibold text-[#102034]">
                  اطلاعات پرداخت
                </h3>
                <dl className="mt-4 grid gap-3">
                  <Info label="درگاه" value={order.payment?.gatewayLabel || "SibPay SoftPOS"} />
                  <Info label="وضعیت پرداخت" value={order.paymentStatusLabel} />
                  <Info
                    label="توکن پرداخت"
                    value={<span dir="ltr" className="block break-all text-left">{order.payment?.paymentToken || "-"}</span>}
                  />
                  <Info
                    label="شناسه تراکنش"
                    value={<span dir="ltr">{order.payment?.transactionId || "-"}</span>}
                  />
                  <Info
                    label="شماره مرجع / RNN"
                    value={<span dir="ltr">{order.payment?.referenceId || "-"}</span>}
                  />
                  <Info
                    label="زمان پرداخت"
                    value={order.payment?.paidAt ? formatDateTime(order.payment.paidAt) : "-"}
                  />
                  <Info label="علت خطا" value={order.payment?.failedReason || "-"} />
                </dl>
              </Card>

              <Card className="p-5">
                <h3 className="text-base font-semibold text-[#102034]">
                  عملیات پشتیبانی
                </h3>
                <div className="mt-4 grid gap-2">
                  <Button type="button" onClick={() => setStatusDialogOpen(true)}>
                    تغییر وضعیت سفارش
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSupportNote(order.supportNote ?? "");
                      setNoteDialogOpen(true);
                    }}
                  >
                    یادداشت پشتیبانی
                  </Button>
                </div>
                <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm leading-7 text-[#64748B]">
                  {order.supportNote || "یادداشتی ثبت نشده است."}
                </div>
              </Card>
            </div>
          </section>

          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تغییر وضعیت سفارش سایت</DialogTitle>
                <DialogDescription>
                  وضعیت جدید سفارش را انتخاب کنید.
                </DialogDescription>
              </DialogHeader>
              <SearchableSelect
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as WebsiteOrderStatus)
                }
                options={ORDER_STATUS_OPTIONS.map((status) => ({
                  value: status,
                  label: getWebsiteOrderStatusLabel(status),
                }))}
                placeholder="انتخاب وضعیت"
                searchPlaceholder="جستجو در وضعیت‌ها"
                emptyMessage="وضعیتی پیدا نشد"
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="button"
                  onClick={handleStatusSubmit}
                  disabled={isSubmitting}
                >
                  ذخیره وضعیت
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>یادداشت پشتیبانی</DialogTitle>
                <DialogDescription>
                  یادداشت داخلی برای پیگیری سفارش سایت ثبت می‌شود.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={supportNote}
                onChange={(event) => setSupportNote(event.target.value)}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNoteDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="button"
                  onClick={handleNoteSubmit}
                  disabled={isSubmitting}
                >
                  ذخیره یادداشت
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#64748B]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#102034]">{value}</dd>
    </div>
  );
}

function Summary({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#64748B]">{label}</span>
      <span className={strong ? "font-bold text-[#102034]" : "font-semibold text-[#334155]"}>
        {value}
      </span>
    </div>
  );
}
