import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <RoleDashboard
      role="support"
      title="داشبورد پشتیبانی"
      metrics={[
        { key: "synced", title: "کالاهای سپیدار", hint: "کالاهای دریافت‌شده از سپیدار" },
        { key: "active", title: "کالاهای فعال", hint: "کالاهای فعال سیستم" },
        { key: "correction", title: "سفارش‌های نیازمند اصلاح", hint: "سفارش‌های نیازمند بررسی یا اصلاح مالی" }
      ]}
      actions={[
        { href: "/support/products", title: "کالاهای سپیدار", description: "مشاهده کالاها", icon: "boxes" },
        { href: "/support/orders", title: "سفارش‌ها", description: "بررسی سفارش‌ها", icon: "package" },
        { href: "/support/product-stock-inventory", title: "موجودی فروش", description: "مدیریت موجودی فروش", icon: "layers" }
      ]}
    />
  );
}
