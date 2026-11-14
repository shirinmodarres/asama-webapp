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

const RETAIL_SEPIDAR_STOCK_ID = 56;

function storeFinancials(order: Order) {
  const subtotal =
    order.salesRequestSubtotal ||
    order.items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
  const discount =
    order.salesRequestDiscountTotal ||
    Math.round((subtotal * (order.discountPercentage || 0)) / 100);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = order.salesRequestTaxAmount || Math.round(taxable * 0.1);
  return {
    subtotal,
    discount,
    taxable,
    tax,
    total: order.salesRequestTotalWithTax || taxable + tax,
  };
}

function paymentLabel(order: Order) {
  if (order.salesTypeInternalCode === 50001) return "نقدی";
  if (order.salesTypeInternalCode === 50002) return "اقساطی";
  return (
    order.salesTypeTitle ||
    (order.storePaymentMethod === "credit" ? "اقساطی" : "نقدی")
  );
}

function invoiceStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    store_quotation_issued: "صورتحساب ماد سنتر صادر شد",
    ready_for_accounting: "آماده بررسی حسابدار",
    entered_manually: "فاکتور ثبت شد",
    pending: "در انتظار صدور",
  };
  return status ? labels[status] || status : "ثبت نشده";
}

function hasRetailItems(order: Order) {
  const retailStockIds = new Set(order.retailStockObjectIds || []);
  return order.items.some(
    (item) =>
      item.sepidarStockId === RETAIL_SEPIDAR_STOCK_ID ||
      (item.stockObjectId ? retailStockIds.has(item.stockObjectId) : false) ||
      item.stockAllocations?.some(
        (allocation) => allocation.sepidarStockId === RETAIL_SEPIDAR_STOCK_ID || Boolean(allocation.stockObjectId && retailStockIds.has(allocation.stockObjectId)),
      ),
  );
}

export default function StoreExpertOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    void getStoreOrder(params.id)
      .then((value) => {
        if (mounted) setOrder(value);
      })
      .catch((loadError) => {
        if (mounted)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت سفارش انجام نشد",
          );
      });
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const columns = useMemo<DataTableColumn<OrderItem>[]>(
    () => [
      {
        key: "product",
        header: "کالا",
        render: (item) => (
          <div>
            <p>{item.productName || "-"}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {formatFaDigits(item.productSku || "-")}
            </p>
          </div>
        ),
      },
      {
        key: "brand",
        header: "برند",
        render: (item) => item.brandName || item.brand || "-",
      },
      {
        key: "stock",
        header: "انبار",
        render: (item) =>
          item.stockAllocations
            ?.map((allocation) => allocation.stockTitle)
            .filter(Boolean)
            .join("، ") || "-",
      },
      {
        key: "quantity",
        header: "تعداد",
        render: (item) => formatNumber(item.quantity),
      },
      {
        key: "unitPrice",
        header: "قیمت واحد",
        render: (item) => formatFaCurrency(item.unitPrice),
      },
      {
        key: "lineTotal",
        header: "مبلغ ردیف",
        render: (item) => formatFaCurrency(item.quantity * item.unitPrice),
      },
    ],
    [],
  );
  const financials = order ? storeFinancials(order) : null;
  const brands = order
    ? [
        ...new Set(
          order.items
            .map((item) => item.brandName || item.brand)
            .filter(Boolean),
        ),
      ].join("، ")
    : "";
  const canCreateRetailExitSlip = Boolean(
    order &&
    hasRetailItems(order) &&
    (order.quotationSyncStatus === "success" || order.sepidarQuotationId) &&
    !["dispatchIssued", "delivered"].includes(order.warehouseStatus),
  );

  return (
    <DashboardLayout role="store-expert" title="جزئیات سفارش فروشگاه">
      <SectionHeader
        title={
          order?.code
            ? `سفارش ${formatFaDigits(order.code)}`
            : "جزئیات سفارش فروشگاه"
        }
        description="این سفارش پس از ثبت موفق قابل ویرایش، حذف یا لغو نیست."
        actions={
          <Link
            href="/store-expert/orders"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            <ArrowRight className="size-4" />
            بازگشت به سفارش‌ها
          </Link>
        }
      />
      {error ? (
        <PageErrorMessage title="دریافت سفارش انجام نشد" message={error} />
      ) : !order || !financials ? (
        <LoadingState title="در حال دریافت سفارش" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <h2 className="font-semibold">وضعیت سفارش</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <Info
                  label="وضعیت سفارش"
                  value={
                    <StatusBadge type="order" status={order.orderStatus} />
                  }
                />
                <Info
                  label="وضعیت خروج کالا"
                  value={
                    <StatusBadge
                      type="warehouse"
                      status={order.warehouseStatus}
                    />
                  }
                />
                <Info
                  label="وضعیت پیش‌فاکتور"
                  value={<QuotationState order={order} />}
                />
              </dl>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">مشتری، انبار و برند</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <Info label="مشتری" value={order.customerName} />
                <Info
                  label="کد سپیدار"
                  value={formatFaDigits(order.sepidarCustomerCode || "-")}
                />
                <Info
                  label="انبارها"
                  value={
                    order.selectedStockTitles.join("، ") || order.stockTitle
                  }
                />
                <Info label="برندها" value={brands || "-"} />
              </dl>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">پرداخت و فاکتور</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <Info label="روش پرداخت" value={paymentLabel(order)} />
                <Info
                  label="شرایط پرداخت"
                  value={order.storePaymentTerms || "-"}
                />
                <Info
                  label="شماره پیش‌فاکتور سپیدار"
                  value={formatFaDigits(
                    order.sepidarQuotationNumber || "ثبت نشده",
                  )}
                />
                <Info
                  label="وضعیت فاکتور"
                  value={invoiceStatusLabel(order.accountingStatus)}
                />
              </dl>
            </Card>
          </div>
          <Card className="p-5">
            <h2 className="font-semibold">مبالغ سفارش</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <Info
                label="جمع کالاها"
                value={formatFaCurrency(financials.subtotal)}
              />
              <Info
                label={`تخفیف (${formatFaDigits(order.discountPercentage || 0)}٪)`}
                value={formatFaCurrency(financials.discount)}
              />
              <Info
                label="مبلغ مشمول مالیات"
                value={formatFaCurrency(financials.taxable)}
              />
              <Info
                label="مالیات بر ارزش افزوده"
                value={formatFaCurrency(financials.tax)}
              />
              <Info
                label="مبلغ نهایی"
                value={formatFaCurrency(financials.total)}
              />
            </dl>
          </Card>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">خروج و اسناد</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {order.warehouseStatusLabel ||
                    order.warehouseStatus ||
                    "ثبت نشده"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canCreateRetailExitSlip ? (
                  <Link
                    href={`/store-expert/orders/${order.objectId}/exit-slip`}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  >
                    <ScanLine className="size-4" />
                    ثبت خروج کالا
                  </Link>
                ) : null}
                {order.modCenterInvoiceObjectId ? (
                  <Link
                    href={`/store-expert/mod-center-invoices/${order.modCenterInvoiceObjectId}/print`}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]"
                  >
                    <Download className="size-4" />
                    دانلود فاکتور مادسنتر
                  </Link>
                ) : null}
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <Info
                label="شماره حواله خروج"
                value={formatFaDigits(order.exitSlipNumber || "ثبت نشده")}
              />
              <Info
                label="تاریخ حواله"
                value={
                  order.exitSlipIssuedAt
                    ? formatDate(order.exitSlipIssuedAt)
                    : "ثبت نشده"
                }
              />
              <Info
                label="شماره فاکتور مادسنتر"
                value={formatFaDigits(
                  order.modCenterInvoiceNumber || "ثبت نشده",
                )}
              />
            </dl>
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">اقلام سفارش</h2>
            <DataTable
              columns={columns}
              rows={order.items}
              rowKey={(item) => item.objectId}
            />
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted-foreground)]">{label}</dt>
      <dd className="mt-1 font-medium text-[var(--foreground)]">
        {value || "-"}
      </dd>
    </div>
  );
}
