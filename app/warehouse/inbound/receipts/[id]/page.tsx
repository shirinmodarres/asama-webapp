"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type {
  WarehouseInboundReceipt,
  WarehouseInboundReceiptItemGroup,
  WarehouseItemUnit,
} from "@/lib/models/warehouse.model";
import { getInboundReceipt } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function WarehouseInboundReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<WarehouseInboundReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReceipt() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getInboundReceipt(params.id);
        if (isMounted) setReceipt(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReceipt();
    return () => {
      isMounted = false;
    };
  }, [params.id]);
  const groupedItems = useMemo(() => groupReceiptItems(receipt), [receipt]);

  return (
    <DashboardLayout role="warehouse" title="جزئیات رسید">
      {isLoading ? (
        <LoadingState title="در حال دریافت رسید ورود" />
      ) : error ? (
        <PageErrorMessage title="دریافت رسید انجام نشد" message={error} />
      ) : !receipt ? (
        <EmptyState title="رسید یافت نشد" description="شناسه رسید معتبر نیست." />
      ) : (
        <div className="space-y-5">
          <SectionHeader
            title={`رسید ${formatFaDigits(receipt.receiptCode)}`}
            description="جزئیات کالاهای ثبت‌شده در این رسید ورود"
            actions={
              <Link
                href={`/warehouse/inbound/receipts/${receipt.objectId}/edit`}
                className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm !text-white"
              >
                ویرایش
              </Link>
            }
          />

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="شماره رسید" value={formatFaDigits(receipt.receiptCode)} />
              <InfoItem label="تعداد کالاها" value={formatNumber(groupedItems.length)} />
              <InfoItem label="انبار" value={receipt.stockTitle || "-"} />
              <InfoItem label="تعداد" value={formatNumber(receipt.quantity)} />
              <InfoItem label="ثبت کننده" value={receipt.createdByName || "-"} />
              <InfoItem label="زمان ثبت" value={formatDateTime(receipt.createdAt)} />
              <InfoItem label="توضیحات" value={receipt.notes || "-"} className="lg:col-span-3" />
            </dl>
          </section>

          <div className="space-y-4">
            {groupedItems.map((item: WarehouseInboundReceiptItemGroup, index: number) => (
              <section
                key={`${item.productObjectId || item.productSku || index}`}
                className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#1F3A5F]">
                      {item.productName || "-"}
                    </h3>
                    <p className="mt-1 text-sm text-[#64748B]">
                      {item.productSku ? formatFaDigits(item.productSku) : "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] px-3 py-2 text-sm text-[#102034]">
                    {formatNumber(item.quantity)} عدد
                  </div>
                </div>

                <DataTable
                  columns={columns}
                  rows={item.units as WarehouseItemUnit[]}
                  rowKey={(row) => row.objectId || row.id}
                />
              </section>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const columns: DataTableColumn<WarehouseItemUnit>[] = [
  {
    key: "productIdentifier",
    header: "شناسه محصول",
    render: (row) => row.productIdentifier ? formatFaDigits(row.productIdentifier) : "-",
  },
  {
    key: "serialNumber",
    header: "سریال محصول",
    render: (row) => row.serialNumber ? formatFaDigits(row.serialNumber) : "-",
  },
  {
    key: "trackingCode",
    header: "کد رهگیری",
    render: (row) => row.trackingCode ? formatFaDigits(row.trackingCode) : "-",
  },
  { key: "status", header: "وضعیت", render: (row) => row.statusLabel || row.status },
];

function groupReceiptItems(
  receipt: WarehouseInboundReceipt | null,
): WarehouseInboundReceiptItemGroup[] {
  if (!receipt) return [];
  if (Array.isArray(receipt.items) && receipt.items.length > 0) return receipt.items;

  const groups = new Map<string, WarehouseInboundReceiptItemGroup>();
  receipt.units.forEach((unit) => {
    const key = unit.productObjectId || unit.productSku || unit.productName;
    const existing = groups.get(key);
    const itemUnit = {
      productIdentifier: unit.productIdentifier,
      serialNumber: unit.serialNumber,
      trackingCode: unit.trackingCode,
    };
    if (existing) {
      existing.units.push(itemUnit);
      existing.quantity = existing.units.length;
      return;
    }
    groups.set(key, {
      productObjectId: unit.productObjectId,
      sepidarItemId: unit.sepidarItemId,
      productSku: unit.productSku,
      productName: unit.productName,
      quantity: 1,
      units: [itemUnit],
    });
  });
  return Array.from(groups.values());
}

function InfoItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 ${className}`}>
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-7 text-[#1F3A5F]">{value}</dd>
    </div>
  );
}
