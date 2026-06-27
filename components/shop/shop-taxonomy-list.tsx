"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { WebsiteBrand, WebsiteCategory } from "@/lib/models/shop.model";
import {
  deactivateWebsiteBrand,
  deactivateWebsiteCategory,
  listWebsiteBrands,
  listWebsiteCategories,
} from "@/lib/services/shop-admin.service";
import { formatFaNumber } from "@/lib/utils/number-format";

type Kind = "brands" | "categories";
type Row = WebsiteBrand | WebsiteCategory;

export function ShopTaxonomyList({ kind }: { kind: Kind }) {
  const isBrands = kind === "brands";
  const [items, setItems] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setItems(isBrands ? await listWebsiteBrands() : await listWebsiteCategories());
  }, [isBrands]);

  useEffect(() => {
    let mounted = true;
    async function loadItems() {
      try {
        const nextItems = isBrands
          ? await listWebsiteBrands()
          : await listWebsiteCategories();
        if (mounted) setItems(nextItems);
      } catch (cause) {
        if (mounted) setError(getErrorMessage(cause));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadItems();
    return () => { mounted = false; };
  }, [isBrands]);

  const deactivate = async (item: Row) => {
    setSubmittingId(item.objectId);
    setError("");
    try {
      if (isBrands) await deactivateWebsiteBrand(item.objectId);
      else await deactivateWebsiteCategory(item.objectId);
      await load();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmittingId("");
    }
  };

  const columns: DataTableColumn<Row>[] = [
    { key: "title", header: "عنوان", render: (row) => row.title },
    { key: "slug", header: "اسلاگ", render: (row) => <span dir="ltr">{row.slug}</span> },
    ...(!isBrands
      ? [{
          key: "parent",
          header: "والد",
          render: (row: Row) => (row as WebsiteCategory).parentCategoryTitle || "-",
        }]
      : []),
    { key: "sortOrder", header: "ترتیب", render: (row) => formatFaNumber(row.sortOrder) },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "neutral"}>
          {row.isActive ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      sticky: "left",
      render: (row) => (
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/support/shop/${kind}/${row.objectId}/edit`}>ویرایش</Link>
          </Button>
          {row.isActive ? (
            <Button
              size="sm"
              variant="outline"
              disabled={Boolean(submittingId)}
              onClick={() => deactivate(row)}
            >
              غیرفعال
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const title = isBrands ? "برندها" : "دسته‌بندی‌ها";
  return (
    <DashboardLayout role="support" title={title}>
      <SectionHeader
        title={`مدیریت ${title}`}
        description={`${title} قابل انتخاب برای محصولات سایت را مدیریت کنید.`}
        actions={
          <Button asChild><Link href={`/support/shop/${kind}/new`}>ایجاد مورد جدید</Link></Button>
        }
      />
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? (
        <LoadingState title={`در حال دریافت ${title}`} />
      ) : items.length ? (
        <DataTable columns={columns} rows={items} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState
          title={`هنوز ${isBrands ? "برندی" : "دسته‌بندی‌ای"} ثبت نشده است`}
          description={`برای استفاده در فرم محصولات سایت، ${isBrands ? "برند" : "دسته‌بندی"} جدید ایجاد کنید.`}
        />
      )}
    </DashboardLayout>
  );
}
