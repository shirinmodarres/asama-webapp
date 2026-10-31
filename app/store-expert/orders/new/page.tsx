"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SectionHeader } from "@/components/shared/section-header";
import { StoreOrderForm } from "@/components/store-expert/store-order-form";

export default function StoreExpertNewOrderPage() {
  return <DashboardLayout role="store-expert" title="ثبت سفارش فروشگاه"><SectionHeader title="ثبت سفارش فروشگاه" description="انتخاب مشتری، انبار، برند و کالا با لیست قیمت مشترک مادسنتر." /><StoreOrderForm /></DashboardLayout>;
}
