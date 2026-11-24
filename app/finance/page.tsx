import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <RoleDashboard
      role="finance"
      title="داشبورد حسابداری"
      metrics={[
        { key: "pending", title: "سفارش‌های در انتظار تأیید مالی", hint: "صف کار حسابدار فروش" },
        { key: "correction", title: "سفارش‌های نیازمند اصلاح", hint: "برگشت‌خورده برای اصلاح" },
        { key: "invoicesPending", title: "فاکتورهای آماده ثبت در حسابداری", hint: "فاکتورهای داخلی آماده ثبت" },
        { key: "invoicesEntered", title: "فاکتورهای ثبت‌شده در حسابداری", hint: "فاکتورهای داخلی ثبت‌شده در سیستم حسابداری" }
      ]}
      actions={[
        { href: "/finance/financial-approvals", title: "بررسی مالی سفارش‌ها", description: "سفارش‌های در انتظار بررسی و اصلاح", icon: "file-check" },
        { href: "/accounting/internal-invoices", title: "فاکتورهای داخلی", description: "بررسی و ثبت فاکتورها", icon: "file-text" }
      ]}
    />
  );
}
