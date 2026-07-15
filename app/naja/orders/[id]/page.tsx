"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NajaOrderTimeline } from "@/components/naja/naja-order-timeline";
import { NajaReturnActionRemote } from "@/components/naja/naja-return-action-remote";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  getOrderLineTotal,
} from "@/lib/expert/utils";
import type { Invoice } from "@/lib/models/invoice.model";
import type { Order } from "@/lib/models/order.model";
import { listInvoices } from "@/lib/services/invoice.service";
import { getOrder } from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

interface OrderDetailRow {
  id: string;
  name: string;
  brand: string;
  unitPrice: number;
  quantity: number;
  productIdentifier: string | null;
  trackingCode: string | null;
}

export default function NajaOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const objectId = decodeURIComponent(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError("");

      try {
        const [orderData, invoices] = await Promise.all([
          getOrder(objectId),
          listInvoices(),
        ]);
        if (!isMounted) return;
        setOrder(orderData);
        setInvoice(
          invoices.find(
            (entry) =>
              entry.orderId === orderData.objectId || entry.orderId === orderData.id,
          ) ?? null,
        );
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : "دریافت سفارش انجام نشد.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [objectId]);

  const detailRows = useMemo<OrderDetailRow[]>(() => {
    if (!order) return [];
    return order.items.map((item) => ({
      id: item.objectId || item.productId,
      name: item.productName || "کالای نامشخص",
      brand: item.brandName || item.brand || "-",
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      productIdentifier: item.productIdentifier,
      trackingCode: item.trackingCode,
    }));
  }, [order]);

  const totalAmount = detailRows.reduce(
    (sum, row) => sum + getOrderLineTotal(row.quantity, row.unitPrice),
    0,
  );

  const columns: DataTableColumn<OrderDetailRow>[] = [
    {
      key: "name",
      header: "نام کالا",
      render: (row) => <span className="font-medium text-[#1F3A5F]">{row.name}</span>,
    },
    { key: "brand", header: "برند", render: (row) => row.brand },
    {
      key: "unitPrice",
      header: "قیمت واحد",
      render: (row) => formatCurrency(row.unitPrice),
    },
    {
      key: "quantity",
      header: "تعداد",
      render: (row) => formatNumber(row.quantity),
    },
    {
      key: "lineTotal",
      header: "مبلغ",
      render: (row) => formatCurrency(getOrderLineTotal(row.quantity, row.unitPrice)),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout role="naja" title="جزئیات سفارش">
        <LoadingState title="در حال دریافت جزئیات سفارش ناجا" />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="naja" title="جزئیات سفارش">
        <PageErrorMessage title="دریافت جزئیات سفارش انجام نشد" message={error} />
      </DashboardLayout>
    );
  }

  if (!order || order.orderType !== "naja") {
    return (
      <DashboardLayout role="naja" title="جزئیات سفارش">
        <EmptyState title="سفارش ناجا یافت نشد" description="این شناسه در جریان اختصاصی ناجا وجود ندارد." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="naja" title="جزئیات سفارش">
      <SectionHeader
        title={`سفارش ${formatFaDigits(order.code)}`}
        description="مشاهده اطلاعات مشتری/مرکز ناجا از سپیدار، وضعیت انبار و فاکتور سفارش"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {order.canEdit ? (
              <Link
                href={`/naja/orders/${order.objectId}/edit`}
                className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm font-semibold !text-white visited:!text-white hover:!text-white focus:!text-white"
              >
                ویرایش سفارش
              </Link>
            ) : null}
            <Link
              href="/naja/orders"
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155]"
            >
              بازگشت به لیست
            </Link>
          </div>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#1F3A5F]">اطلاعات سفارش ناجا</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="کد سفارش"
                value={formatFaDigits(order.code)}
              />
              <InfoItem label="ثبت کننده" value={order.createdByName || "-"} />
              <InfoItem label="نام مشتری" value={order.customerName ?? "-"} />
              <InfoItem
                label="کد مشتری سپیدار"
                value={
                  order.sepidarCustomerCode
                    ? formatFaDigits(order.sepidarCustomerCode)
                    : "-"
                }
              />
              <InfoItem
                label="لیست قیمت"
                value={order.saleTypeTitle || order.saleType?.title || "-"}
              />
              <InfoItem label="کد ملی" value={order.customerNationalId ? formatFaDigits(order.customerNationalId) : "-"} />
              <InfoItem label="موبایل مشتری" value={order.customerPhone ? formatFaDigits(order.customerPhone) : "-"} />
              <InfoItem
                label="آدرس مشتری"
                value={order.deliveryFullAddress || "-"}
              />
              <InfoItem
                label="نام و نام خانوادگی تحویل‌گیرنده"
                value={
                  [order.recipientFirstName, order.recipientLastName]
                    .filter(Boolean)
                    .join(" ") || "-"
                }
              />
              <InfoItem
                label="کد ملی تحویل‌گیرنده"
                value={
                  order.recipientNationalId
                    ? formatFaDigits(order.recipientNationalId)
                    : "-"
                }
              />
              <InfoItem
                label="شماره موبایل تحویل‌گیرنده"
                value={
                  order.recipientMobile
                    ? formatFaDigits(order.recipientMobile)
                    : "-"
                }
              />
              <InfoItem
                label="شماره سفارش"
                value={
                  order.najaOrderNumber
                    ? formatFaDigits(order.najaOrderNumber)
                    : "-"
                }
              />
              <InfoItem label="انبار خروج" value={order.stockTitle || "-"} />
              <InfoItem
                label="تاریخ سفارش"
                value={
                  order.najaPurchaseDate
                    ? formatDate(order.najaPurchaseDate)
                    : "-"
                }
              />
              <InfoItem
                label="تاریخ ثبت در سامانه"
                value={formatDate(order.createdAt)}
              />
              <InfoItem label="وضعیت سفارش" value={<StatusBadge type="order" status={order.orderStatus} />} />
              <InfoItem label="وضعیت انبار" value={<StatusBadge type="warehouse" status={order.warehouseStatus} />} />
              <InfoItem label="آخرین تغییر" value={formatDateTime(order.updatedAt)} />
              <InfoItem
                label="وضعیت فاکتور"
                value={invoice ? `صادر شده - ${invoice.invoiceCode}` : "هنوز صادر نشده"}
              />
              <InfoItem
                label="وضعیت پیش‌فاکتور سپیدار"
                value={getQuotationStatusLabel(order)}
              />
              {order.sepidarQuotationNumber ? (
                <InfoItem
                  label="شماره پیش‌فاکتور سپیدار"
                  value={formatFaDigits(order.sepidarQuotationNumber)}
                />
              ) : null}
              {order.returnReason ? <InfoItem label="دلیل برگشت" value={order.returnReason} /> : null}
            </dl>
            {!order.customerPhone || !order.deliveryFullAddress ? (
              <div className="mt-4 rounded-xl border border-[#F3D08B] bg-[#FFF8E8] px-4 py-3 text-sm text-[#8A6116]">
                اطلاعات تماس یا آدرس مشتری از سپیدار پیدا نشد.
              </div>
            ) : null}
          </div>

          <DataTable columns={columns} rows={detailRows} rowKey={(row) => row.id} />

          <NajaOrderTimeline order={order} />
        </div>

        <div className="space-y-4">
          <OrderSummaryCard
            customerName={order.customerName ?? "-"}
            itemCount={detailRows.length}
            totalQuantity={detailRows.reduce((sum, item) => sum + item.quantity, 0)}
            totalAmount={totalAmount}
            status={order.orderStatus as never}
            warehouseStatus={order.warehouseStatus as never}
            saleTypeTitle={order.saleTypeTitle || order.saleType?.title}
            stockTitles={
              order.selectedStockTitles.length
                ? order.selectedStockTitles
                : order.stockTitle
                  ? [order.stockTitle]
                  : []
            }
          />

          <NajaReturnActionRemote
            order={order}
            actorName={order.createdByName || "کارشناس ناجا"}
            onReturned={(updatedOrder) => setOrder(updatedOrder)}
          />
        </div>
      </section>
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#1F3A5F]">{value}</dd>
    </div>
  );
}

function getQuotationStatusLabel(order: Order): string {
  if (order.sepidarIntegrationStatus === "quotation_failed") {
    return "ثبت پیش‌فاکتور ناموفق بود.";
  }

  if (order.sepidarQuotationId || order.sepidarIntegrationStatus === "quotation_created") {
    return "پیش‌فاکتور ثبت شد.";
  }

  return "ثبت نشده";
}
