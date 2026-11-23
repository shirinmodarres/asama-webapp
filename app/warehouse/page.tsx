import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <RoleDashboard
      role="warehouse"
      title="داشبورد انبار"
      metrics={[
        { key: "reviewing", title: "سفارش‌های در بررسی انبار", hint: "در انتظار صدور حواله" },
        { key: "dispatched", title: "سفارش‌های دارای خروج صادرشده", hint: "در مسیر تحویل" },
        { key: "delivered", title: "سفارش‌های تحویل‌شده", hint: "تحویل تأییدشده" }
      ]}
      actions={[
        { href: "/warehouse/inventory", title: "موجودی واقعی انبار", description: "مشاهده موجودی کالاها", icon: "boxes" },
        { href: "/warehouse/outbound", title: "خروج کالا", description: "صدور حواله سفارش‌ها", icon: "package" },
        { href: "/warehouse/exit-slips", title: "حواله‌های خروج", description: "پیگیری حواله و تحویل", icon: "truck" }
      ]}
    />
  );
}
