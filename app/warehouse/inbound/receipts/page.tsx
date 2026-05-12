"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { WarehouseInboundReceipt } from "@/lib/models/warehouse.model";
import { listInboundReceipts } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";
import { Search } from "lucide-react";
import Link from "next/link";

export default function WarehouseInboundReceiptsPage() {
  const [receipts, setReceipts] = useState<WarehouseInboundReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReceipts() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listInboundReceipts();
        if (isMounted) setReceipts(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReceipts();
    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return receipts.filter(
      (receipt) =>
        !query ||
        receipt.receiptCode.toLowerCase().includes(query) ||
        receipt.productName.toLowerCase().includes(query) ||
        receipt.productSku.toLowerCase().includes(query),
    );
  }, [receipts, search]);

  const columns: DataTableColumn<WarehouseInboundReceipt>[] = [
    {
      key: "receiptCode",
      header: "شماره رسید",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">
          {formatFaDigits(row.receiptCode)}
        </span>
      ),
    },
    { key: "productName", header: "کالا", render: (row) => row.productName },
    {
      key: "quantity",
      header: "تعداد",
      render: (row) => formatNumber(row.quantity),
    },
    {
      key: "createdByName",
      header: "ثبت کننده",
      render: (row) => row.createdByName || "-",
    },
    {
      key: "createdAt",
      header: "زمان ثبت",
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/warehouse/inbound/receipts/${row.objectId || row.id}`}
            className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
          >
            مشاهده
          </Link>
          <Link
            href={`/warehouse/inbound/receipts/${row.objectId || row.id}/edit`}
            className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-3 py-1.5 text-xs !text-white"
          >
            ویرایش
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="warehouse" title="رسیدهای ورود">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو بر اساس شماره رسید یا کالا"
            className="pr-10"
          />
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت رسیدهای ورود" />
      ) : error ? (
        <PageErrorMessage title="دریافت رسیدها انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId || row.id}
        />
      ) : (
        <EmptyState
          title="رسید ورودی ثبت نشده"
          description="پس از ثبت ورود کالا، رسیدهای ورود در این بخش نمایش داده می‌شوند."
        />
      )}
    </DashboardLayout>
  );
}
