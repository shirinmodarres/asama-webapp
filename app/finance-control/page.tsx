import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <RoleDashboard
      role="finance-control"
      title="کنترل مالی سفارش‌ها"
      metrics={[
        { key: "pending", title: "سفارش‌های در انتظار تأیید مالی", hint: "سفارش‌های مرحله جاری" },
        { key: "correction", title: "سفارش‌های نیازمند اصلاح", hint: "برگشت‌خورده برای اصلاح" },
        { key: "approved", title: "سفارش‌های تأییدشده", hint: "سفارش‌های مرحله جاری" },
        { key: "invoicesPending", title: "فاکتورهای آماده ثبت", hint: "فاکتورهای داخلی آماده حسابداری" }
      ]}
      actions={[
        { href: "/finance-control/orders", title: "بررسی سفارش‌ها", description: "صف کنترل مالی", icon: "file-check" }
      ]}
    />
  );
}
