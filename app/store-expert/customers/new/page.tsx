"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StoreCustomerRegistrationForm } from "@/components/customer/store-customer-registration-form";
import { SectionHeader } from "@/components/shared/section-header";

export default function StoreExpertNewCustomerPage() {
  return <DashboardLayout role="store-expert" title="ثبت مشتری جدید"><SectionHeader title="ثبت مشتری جدید" description="اطلاعات مشتری برای ثبت در سپیدار آماده می‌شود." /><StoreCustomerRegistrationForm /></DashboardLayout>;
}
