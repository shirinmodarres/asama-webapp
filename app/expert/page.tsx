import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <RoleDashboard
      role="expert"
      title="داشبورد کارشناس"
      metrics={[
        { key: "quotationDrafts", title: "درخواست‌های فروش نهایی‌نشده", hint: "پیش‌نویس‌های درخواست فروش من" },
        { key: "pending", title: "در انتظار تأیید مالی", hint: "سفارش‌های در انتظار بررسی مالی" },
        { key: "correction", title: "نیازمند بررسی", hint: "سفارش‌های نیازمند اصلاح کارشناس" },
        { key: "approved", title: "تأیید شده", hint: "سفارش‌های تأییدشده" }
      ]}
      actions={[
        { href: "/expert/quotations/new", title: "ثبت درخواست فروش جدید", description: "ایجاد درخواست فروش", icon: "plus-circle" },
        { href: "/expert/orders/new", title: "ثبت سفارش جدید", description: "ایجاد سفارش", icon: "plus-circle" },
        { href: "/expert/orders", title: "سفارش‌های من", description: "پیگیری سفارش‌ها", icon: "package" }
      ]}
    />
  );
}
