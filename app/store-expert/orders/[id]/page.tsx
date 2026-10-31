"use client";

import Link from "next/link";
import { ArrowRight, Download, ScanLine } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order, OrderItem } from "@/lib/models/order.model";
import { getStoreOrder } from "@/lib/services/store-expert-order.service";
import { formatFaCurrency, formatFaDigits } from "@/lib/utils/number-format";
import { QuotationState } from "../page";

export default function StoreExpertOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    void getStoreOrder(params.id).then((value) => { if (mounted) setOrder(value); }).catch((loadError) => { if (mounted) setError(loadError instanceof Error ? loadError.message : "دریافت سفارش انجام نشد"); });
    return () => { mounted = false; };
  }, [params.id]);

  const columns = useMemo<DataTableColumn<OrderItem>[]>(() => [
    { key: "product", header: "کالا", render: (item) => <div><p>{item.productName || "-"}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatFaDigits(item.productSku || "-")}</p></div> },
    { key: "quantity", header: "تعداد", render: (item) => formatNumber(item.quantity) },
    { key: "unitPrice", header: "قیمت واحد", render: (item) => formatFaCurrency(item.unitPrice) },
    { key: "lineTotal", header: "مبلغ ردیف", render: (item) => formatFaCurrency(item.quantity * item.unitPrice) },
  ], []);
  const totalAmount = order?.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0) || 0;

  return <DashboardLayout role="store-expert" title="جزئیات سفارش فروشگاه">
    <SectionHeader title={order?.code ? `سفارش ${formatFaDigits(order.code)}` : "جزئیات سفارش فروشگاه"} description="این سفارش پس از ثبت موفق قابل ویرایش، حذف یا لغو نیست." actions={<Link href="/store-expert/orders" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]"><ArrowRight className="size-4" />بازگشت به سفارش‌ها</Link>} />
    {error ? <PageErrorMessage title="دریافت سفارش انجام نشد" message={error} /> : !order ? <LoadingState title="در حال دریافت سفارش" /> : <div className="space-y-4"><div className="grid gap-4 lg:grid-cols-3"><Card className="p-5"><h2 className="font-semibold">وضعیت سفارش</h2><div className="mt-4 space-y-3"><StatusBadge type="order" status={order.orderStatus} /><StatusBadge type="warehouse" status={order.warehouseStatus} /><QuotationState order={order} /></div></Card><Card className="p-5"><h2 className="font-semibold">مشتری و انبار</h2><dl className="mt-4 grid gap-3 text-sm"><Info label="مشتری" value={order.customerName} /><Info label="کد سپیدار" value={formatFaDigits(order.sepidarCustomerCode || "-")} /><Info label="انبار" value={order.stockTitle} /><Info label="برند" value={order.priceListBrand} /></dl></Card><Card className="p-5"><h2 className="font-semibold">پرداخت و فاکتور</h2><dl className="mt-4 grid gap-3 text-sm"><Info label="نوع پرداخت" value={order.storePaymentMethod === "credit" ? "اعتباری" : "نقدی"} /><Info label="شرایط پرداخت" value={order.storePaymentTerms || "-"} /><Info label="مبلغ کل" value={formatFaCurrency(totalAmount)} /><Info label="شماره پیش‌فاکتور سپیدار" value={formatFaDigits(order.sepidarQuotationNumber || "ثبت نشده")} /><Info label="وضعیت فاکتور" value={order.accountingStatus === "ready_for_accounting" ? "آماده صدور فاکتور" : order.accountingStatus || "ثبت نشده"} /></dl></Card></div><Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">خروج و اسناد</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">صدور حواله فقط بعد از ثبت موفق پیش‌فاکتور ممکن است.</p></div><div className="flex flex-wrap gap-2">{order.stockCode === 999 && (order.quotationSyncStatus === "success" || Boolean(order.sepidarQuotationId)) && !order.exitSlipObjectId ? <Link href={`/store-expert/orders/${order.objectId}/exit-slip`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"><ScanLine className="size-4" />ثبت خروج کالا</Link> : null}{order.internalInvoiceObjectId ? <Link href={`/accounting/internal-invoices/${order.internalInvoiceObjectId}/print`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]"><Download className="size-4" />دانلود صورتحساب داخلی ماد سنتر</Link> : null}</div></div><dl className="mt-4 grid gap-3 text-sm md:grid-cols-3"><Info label="شماره حواله خروج" value={formatFaDigits(order.exitSlipNumber || "ثبت نشده")} /><Info label="تاریخ حواله" value={order.exitSlipIssuedAt ? formatDate(order.exitSlipIssuedAt) : "ثبت نشده"} /><Info label="شماره فاکتور داخلی" value={formatFaDigits(order.internalInvoiceNumber || "ثبت نشده")} /></dl></Card><Card className="p-5"><h2 className="mb-4 font-semibold">اقلام سفارش</h2><DataTable columns={columns} rows={order.items} rowKey={(item) => item.objectId} /></Card></div>}
  </DashboardLayout>;
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="text-xs text-[var(--muted-foreground)]">{label}</dt><dd className="mt-1 font-medium text-[var(--foreground)]">{value || "-"}</dd></div>;
}
