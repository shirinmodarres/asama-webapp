"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ListFilter, PlusCircle, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import type { User } from "@/lib/models/user.model";
import { listUsers } from "@/lib/services/user.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function SupportUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listUsers();
        if (isMounted) setUsers(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const roleOptions = useMemo(
    () => [
      { value: "all", label: "همه نقش‌ها" },
      ...Array.from(
        new Map(
          users.map((user) => [
            user.role,
            { value: user.role, label: user.roleLabel },
          ]),
        ).values(),
      ),
    ],
    [users],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.fullName.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const hasActiveFilters =
    search.trim().length > 0 || roleFilter !== "all" || statusFilter !== "all";

  const columns: DataTableColumn<User>[] = [
    {
      key: "fullName",
      header: "نام",
      render: (row) => (
        <span className="font-medium text-[#1F3A5F]">{row.fullName}</span>
      ),
    },
    {
      key: "phone",
      header: "شماره موبایل",
      render: (row) => formatFaDigits(row.phone),
    },
    { key: "role", header: "نقش", render: (row) => row.roleLabel },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "neutral"} dot>
          {row.status === "active" ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Link
          href={`/support/users/${row.objectId}/edit`}
          className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
        >
          مشاهده / ویرایش
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="کاربران">
      <SectionHeader
        title="فهرست کاربران"
        description="مشاهده، جستجو و ویرایش کاربران سامانه"
        actions={
          <Link
            href="/support/users/new"
            className="inline-flex items-center gap-2 rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm text-white!"
          >
            <PlusCircle className="size-4" />
            <span>تعریف کاربر جدید</span>
          </Link>
        }
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در کاربران</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس نام یا شماره موبایل"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر نقش</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={roleFilter}
                onValueChange={setRoleFilter}
                options={roleOptions}
                placeholder="همه نقش‌ها"
                searchPlaceholder="جستجو در نقش‌ها"
                emptyMessage="نقشی پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <SearchableSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: "all", label: "همه وضعیت‌ها" },
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
              ]}
              placeholder="همه وضعیت‌ها"
              searchPlaceholder="جستجو در وضعیت‌ها"
              emptyMessage="وضعیتی پیدا نشد"
            />
          </label>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-fit shrink-0 items-center gap-2"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
            >
              <span>حذف فیلترها</span>
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState
          title="در حال دریافت کاربران"
          description="فهرست کاربران از سرور دریافت می شود."
        />
      ) : error ? (
        <PageErrorMessage title="دریافت کاربران انجام نشد" message={error} />
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId}
        />
      ) : (
        <EmptyState
          title="کاربری یافت نشد"
          description="هنوز کاربری ثبت نشده است."
        />
      )}
    </DashboardLayout>
  );
}
