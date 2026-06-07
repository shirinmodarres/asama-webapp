"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SectionHeader } from "@/components/shared/section-header";
import { Card } from "@/components/ui/card";
import type { RoleKey } from "@/lib/types";

interface NajaCentersDeprecatedNoticeProps {
  role: RoleKey;
}

export function NajaCentersDeprecatedNotice({
  role,
}: NajaCentersDeprecatedNoticeProps) {
  const assignmentHref =
    role === "support" ? "/support/customer-assignments" : `/${role}/orders`;

  return (
    <DashboardLayout role={role} title="مشتریان ناجا">
      <SectionHeader
        title="مشتری/مرکز ناجا از سپیدار"
        description="مراکز ناجا از این پس از مشتریان سپیدار خوانده می‌شوند."
        actions={
          <Link
            href={assignmentHref}
            className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155] hover:border-[#CBD5E1]"
          >
            {role === "support" ? "اختصاص مشتری" : "بازگشت"}
          </Link>
        }
      />

      <Card className="p-5">
        <p className="text-sm leading-7 text-[#334155]">
          برای سفارش‌های ناجا، مشتری سپیدار و نوع فروش از صفحه اختصاص مشتری به
          کارشناس تعیین می‌شود. ثبت یا ویرایش مرکز محلی ناجا دیگر در فرانت‌اند
          استفاده نمی‌شود.
        </p>
      </Card>
    </DashboardLayout>
  );
}
