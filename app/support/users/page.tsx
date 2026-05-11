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
import { getErrorMessage } from "@/lib/api/api-error";
import type { User } from "@/lib/models/user.model";
import { listUsers } from "@/lib/services/user.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function SupportUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  const columns: DataTableColumn<User>[] = [
    {
      key: "fullName",
      header: "نام",
      render: (row) => <span className="font-medium text-[#1F3A5F]">{row.fullName}</span>,
    },
    { key: "phone", header: "شماره موبایل", render: (row) => formatFaDigits(row.phone) },
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
    <DashboardLayout role="support" title="کاربران سامانه">
      <SectionHeader
        title="مدیریت کاربران"
        description="فهرست کاربران، نقش ها و وضعیت دسترسی پنل ها"
        actions={
          <Link
            href="/support/users/new"
            className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-2 text-sm !text-white"
          >
            تعریف کاربر جدید
          </Link>
        }
      />

      {isLoading ? (
        <LoadingState title="در حال دریافت کاربران" description="فهرست کاربران از سرور دریافت می شود." />
      ) : error ? (
        <PageErrorMessage title="دریافت کاربران انجام نشد" message={error} />
      ) : users.length > 0 ? (
        <DataTable columns={columns} rows={users} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState title="کاربری یافت نشد" description="هنوز کاربری ثبت نشده است." />
      )}
    </DashboardLayout>
  );
}
