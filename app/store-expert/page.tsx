import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <RoleDashboard
      role="store-expert"
      title="داشبورد فروشگاه"
      metrics={[
        { key: "total", title: "سفارش‌ها", hint: "سفارش‌های ثبت‌شده توسط من" },
        { key: "partial", title: "خروج جزئی", hint: "سفارش‌های دارای خروج جزئی" },
        { key: "dispatched", title: "خروج صادرشده", hint: "سفارش‌های دارای حواله خروج" },
        { key: "delivered", title: "تحویل‌شده", hint: "سفارش‌های تحویل‌شده" }
      ]}
      actions={[
        { href: "/store-expert/orders/new", title: "ثبت سفارش جدید", description: "ایجاد سفارش فروشگاه", icon: "plus-circle" },
        { href: "/store-expert/orders", title: "سفارش‌های من", description: "پیگیری سفارش‌ها", icon: "package" },
        { href: "/store-expert/exit-slips", title: "حواله‌های خروج", description: "پیگیری حواله‌ها", icon: "truck" }
      ]}
    />
  );
}
