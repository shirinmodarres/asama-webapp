"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SupportCreateProductPage() {
  return (
    <DashboardLayout role="support" title="کالاها">
      <SectionHeader
        title="تعریف کالا از طریق سپیدار"
        description="اطلاعات اصلی کالا در آساما به صورت دستی ثبت نمی‌شود"
      />

      <Card className="p-5">
        <p className="text-sm leading-8 text-[#334155]">
          تعریف کالا فقط از طریق سپیدار انجام می‌شود. کالا را در سپیدار تعریف
          کنید و سپس از فهرست کالاها، به‌روزرسانی کالاها از سپیدار را اجرا کنید.
        </p>
        <Button asChild className="mt-5">
          <Link href="/support/products">بازگشت به فهرست کالاها</Link>
        </Button>
      </Card>
    </DashboardLayout>
  );
}
