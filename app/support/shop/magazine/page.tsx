"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListFilter, PlusCircle, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  WebsiteMagazinePost,
  WebsiteMagazinePostStatus,
} from "@/lib/models/shop.model";
import {
  archiveWebsiteMagazinePost,
  listWebsiteMagazinePosts,
} from "@/lib/services/shop-admin.service";

const STATUS_LABELS: Record<WebsiteMagazinePostStatus, string> = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  archived: "آرشیوشده",
};

export default function SupportShopMagazinePage() {
  const [posts, setPosts] = useState<WebsiteMagazinePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [submittingId, setSubmittingId] = useState("");

  const loadPosts = async () => {
    const data = await listWebsiteMagazinePosts();
    setPosts(data);
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listWebsiteMagazinePosts();
        if (isMounted) setPosts(data);
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
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(posts.map((post) => post.category).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "fa"),
      ),
    [posts],
  );

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          post.title.toLowerCase().includes(query) ||
          post.slug.toLowerCase().includes(query);
        const matchesStatus =
          statusFilter === "all" || post.status === statusFilter;
        const matchesCategory =
          categoryFilter === "all" || post.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      }),
    [categoryFilter, posts, search, statusFilter],
  );

  const hasActiveFilters =
    search.trim() || statusFilter !== "all" || categoryFilter !== "all";

  const handleArchive = async (post: WebsiteMagazinePost) => {
    setSubmittingId(post.objectId);
    setError("");
    setMessage("");
    try {
      await archiveWebsiteMagazinePost(post.objectId);
      setMessage("مقاله آرشیو شد.");
      await loadPosts();
    } catch (archiveError) {
      setError(getErrorMessage(archiveError));
    } finally {
      setSubmittingId("");
    }
  };

  const columns: DataTableColumn<WebsiteMagazinePost>[] = [
    { key: "title", header: "عنوان", render: (row) => row.title || "-" },
    { key: "slug", header: "اسلاگ", render: (row) => row.slug || "-" },
    { key: "category", header: "دسته‌بندی", render: (row) => row.category || "-" },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)}>
          {STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: "featured",
      header: "ویژه",
      render: (row) => (
        <Badge variant={row.isFeatured ? "brand" : "neutral"}>
          {row.isFeatured ? "ویژه" : "عادی"}
        </Badge>
      ),
    },
    {
      key: "publishedAt",
      header: "تاریخ انتشار",
      render: (row) => formatDate(row.publishedAt),
    },
    {
      key: "createdAt",
      header: "تاریخ ایجاد",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "عملیات",
      sticky: "left",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/support/shop/magazine/${row.objectId}/edit`}>
              ویرایش
            </Link>
          </Button>
          {row.status === "published" ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/magazine/${row.slug}`} target="_blank" rel="noreferrer">
                پیش‌نمایش
              </a>
            </Button>
          ) : null}
          {row.status !== "archived" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(submittingId)}
              onClick={() => handleArchive(row)}
            >
              آرشیو
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="مجله">
      <SectionHeader
        title="لیست مقاله‌ها"
        description="مقاله‌های مجله سایت را برای نمایش عمومی مدیریت کنید."
        actions={
          <Button asChild>
            <Link href="/support/shop/magazine/new">
              <PlusCircle className="size-4" />
              ایجاد مقاله
            </Link>
          </Button>
        }
      />

      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در مقاله‌ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="عنوان یا اسلاگ مقاله را وارد کنید"
                className="pr-10"
              />
            </div>
          </label>
          <FilterSelect
            label="وضعیت"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "همه وضعیت‌ها" },
              { value: "draft", label: "پیش‌نویس" },
              { value: "published", label: "منتشرشده" },
              { value: "archived", label: "آرشیوشده" },
            ]}
          />
          <FilterSelect
            label="دسته‌بندی"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: "همه دسته‌ها" },
              ...categories.map((category) => ({
                value: category,
                label: category,
              })),
            ]}
          />
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit shrink-0"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              حذف فیلترها
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت مقاله‌ها" />
      ) : filteredPosts.length ? (
        <DataTable
          columns={columns}
          rows={filteredPosts}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState
          title="مقاله‌ای ثبت نشده است"
          description="از دکمه ایجاد مقاله برای ثبت اولین مطلب مجله استفاده کنید."
        />
      )}
    </DashboardLayout>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-48">
      <span>{label}</span>
      <div className="relative">
        <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
        <SearchableSelect
          value={value}
          onValueChange={onChange}
          options={options}
          placeholder="انتخاب"
          searchPlaceholder="جستجو"
          emptyMessage="گزینه‌ای پیدا نشد"
          triggerClassName="pr-10"
        />
      </div>
    </label>
  );
}

function getStatusVariant(status: WebsiteMagazinePostStatus) {
  if (status === "published") return "success";
  if (status === "archived") return "neutral";
  return "warning";
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fa-IR");
}
