import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <RoleDashboard
      role="naja"
      title="داشبورد کارشناس ناجا"
      metrics={[
        { key: "total", title: "سفارش‌های ثبت‌شده", hint: "سفارش‌های ناجای من" },
        { key: "approved", title: "سفارش‌های تأییدشده", hint: "سفارش‌های ناجای تأییدشده" },
        { key: "completed", title: "سفارش‌های تکمیل‌شده", hint: "سفارش‌های ناجای تکمیل‌شده" },
        { key: "awaiting", title: "در انتظار انبار", hint: "نیازمند شناسه و رهگیری" },
        { key: "returned", title: "سفارش‌های برگشتی", hint: "سفارش‌های بازگشتی" }
      ]}
      actions={[
        { href: "/naja/orders/create", title: "ثبت سفارش ناجا", description: "ثبت سفارش جدید", icon: "plus-circle" },
        { href: "/naja/orders", title: "سفارش‌های ناجا", description: "پیگیری سفارش‌ها", icon: "package" }
      ]}
    />
  );
}
