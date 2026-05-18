"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Warehouse } from "@/lib/models/warehouse.model";
import { listWarehouses } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function SupportWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadWarehouses() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listWarehouses();
        if (isMounted) setWarehouses(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadWarehouses();
    return () => {
      isMounted = false;
    };
  }, []);

  const columns: DataTableColumn<Warehouse>[] = [
    { key: "name", header: "نام انبار", render: (row) => row.name },
    {
      key: "code",
      header: "کد",
      render: (row) => (row.code ? formatFaDigits(row.code) : "-"),
    },
    { key: "type", header: "نوع", render: (row) => getWarehouseTypeLabel(row.type) },
    {
      key: "allowed",
      header: "سفارش مجاز",
      render: (row) =>
        row.allowedOrderTypes.map(getOrderTypeLabel).join("، ") || "-",
    },
    {
      key: "default",
      header: "پیش‌فرض",
      render: (row) => (row.isDefault ? <Badge>پیش‌فرض</Badge> : "-"),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (row.status === "inactive" ? "غیرفعال" : "فعال"),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/support/warehouses/${row.objectId}/edit`}>ویرایش</Link>
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="انبارها">
      <SectionHeader
        title="مدیریت انبارها"
        description="تعریف انبار عمومی، انبار ناجا و محدوده سفارش‌های مجاز"
        actions={
          <Button asChild>
            <Link href="/support/warehouses/create">تعریف انبار</Link>
          </Button>
        }
      />
      {isLoading ? (
        <LoadingState title="در حال دریافت انبارها" />
      ) : error ? (
        <PageErrorMessage title="دریافت انبارها انجام نشد" message={error} />
      ) : warehouses.length > 0 ? (
        <DataTable
          columns={columns}
          rows={warehouses}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState title="انباری ثبت نشده است" description="انبار جدید تعریف کنید." />
      )}
    </DashboardLayout>
  );
}

function getWarehouseTypeLabel(type: string) {
  if (type === "naja") return "انبار ناجا";
  if (type === "other") return "سایر";
  return "انبار عمومی";
}

function getOrderTypeLabel(type: string) {
  return type === "naja" ? "سفارش ناجا" : "سفارش عادی";
}
