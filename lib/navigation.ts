import type { PanelRoleKey } from "@/lib/domain/roles";
import type { SidebarItem } from "@/lib/types";

export const sidebarByRole: Record<PanelRoleKey, SidebarItem[]> = {
  expert: [
    {
      label: "داشبورد",
      href: "/expert",
      icon: "dashboard",
      description: "وضعیت سفارش‌های روز",
    },
    {
      label: "موجودی",
      href: "/expert/inventory",
      icon: "boxes",
      description: "موجودی قابل رزرو",
    },
    {
      label: "سفارش ها",
      href: "/expert/orders",
      icon: "shopping-cart",
      description: "فهرست سفارش‌ها",
    },
    {
      label: "مشتری‌ها",
      href: "/expert/customers",
      icon: "users",
      description: "مشتری‌ها و آدرس‌ها",
    },
  ],
  naja: [
    {
      label: "داشبورد",
      href: "/naja",
      icon: "dashboard",
      description: "وضعیت سفارش‌های ناجا",
    },
    {
      label: "سفارش های ناجا",
      href: "/naja/orders",
      icon: "shopping-cart",
      description: "ثبت‌شده و برگشتی",
    },
  ],
  manager: [
    {
      label: "داشبورد",
      href: "/manager",
      icon: "dashboard",
      description: "خلاصه تصمیم‌های امروز",
    },
    {
      label: "سفارش های در انتظار تأیید",
      href: "/manager/pending-orders",
      icon: "clipboard-check",
      description: "تأیید و لغو سفارش",
    },
    {
      label: "روند سفارش ها",
      href: "/manager/order-tracking",
      icon: "activity",
      description: "روند انجام سفارش",
    },
    {
      label: "موجودی فروش و انبار",
      href: "/manager/inventory",
      icon: "boxes",
      description: "فروش و موجودی انبار",
    },
    {
      label: "تأیید انتقال موجودی",
      href: "/manager/stock-transfers",
      icon: "truck",
      description: "درخواست‌های انتقال داخلی",
    },
  ],
  warehouse: [
    {
      label: "داشبورد",
      href: "/warehouse",
      icon: "dashboard",
      description: "نمای کلی انبار",
    },
    {
      label: "ورود کالا",
      href: "/warehouse/inbound",
      icon: "plus-circle",
      description: "ثبت ورود کالا",
    },
    {
      label: "رسیدهای ورود",
      href: "/warehouse/inbound/receipts",
      icon: "file-check",
      description: "رسیدهای ثبت‌شده",
    },
    {
      label: "موجودی واقعی انبار",
      href: "/warehouse/inventory",
      icon: "boxes",
      description: "موجودی واقعی کالا",
    },
    {
      label: "خروج کالا",
      href: "/warehouse/outbound",
      icon: "package",
      description: "آماده حواله خروج",
    },
    {
      label: "حواله های خروج",
      href: "/warehouse/exit-slips",
      icon: "truck",
      description: "حواله‌ها و ارسال",
    },
    {
      label: "تحویل‌شده‌ها",
      href: "/warehouse/delivered",
      icon: "file-check",
      description: "تأیید تحویل نهایی",
    },
  ],
  finance: [
    {
      label: "داشبورد",
      href: "/finance",
      icon: "dashboard",
      description: "وضعیت مالی سفارش‌ها",
    },
    {
      label: "آماده فاکتور",
      href: "/finance/ready",
      icon: "layers",
      description: "آماده بررسی مالی",
    },
    {
      label: "فاکتورها",
      href: "/finance/invoices",
      icon: "file-text",
      description: "اسناد مالی صادرشده",
    },
    {
      label: "فاکتورهای داخلی",
      href: "/accounting/internal-invoices",
      icon: "file-check",
      description: "آماده ثبت در حسابداری",
    },
  ],
  support: [
    {
      label: "داشبورد",
      href: "/support",
      icon: "dashboard",
      description: "نمای داده‌های پایه",
    },
    {
      label: "کالاها",
      href: "/support/products",
      icon: "boxes",
      description: "فهرست و وضعیت کالا",
    },
    {
      label: "اختصاص مشتری",
      href: "/support/customer-assignments",
      icon: "users",
      description: "مشتریان سپیدار و کارشناسان",
    },
    {
      label: "تنظیمات سپیدار",
      href: "/support/sepidar-settings",
      icon: "plug-zap",
      description: "اتصال و همگام‌سازی",
    },
    {
      label: "موجودی",
      href: "/support/inventory",
      icon: "package",
      description: "افزایش و کاهش موجودی",
    },
    {
      label: "موجودی فروش",
      href: "/support/product-stock-inventory",
      icon: "boxes",
      description: "کالا و انبار سپیدار",
    },
    {
      label: "انتقال موجودی",
      href: "/support/stock-transfers",
      icon: "truck",
      description: "درخواست انتقال از زاگرس",
    },
    {
      label: "موجودی ناجا",
      href: "/support/naja-inventory",
      icon: "package",
      description: "موجودی اختصاصی ناجا",
    },
    {
      label: "انبارها",
      href: "/support/warehouses",
      icon: "warehouse",
      description: "انبارهای عمومی و ناجا",
    },
    {
      label: "کاربران",
      href: "/support/users",
      icon: "layers",
      description: "کاربران و نقش‌ها",
    },
    {
      label: "ویرایش سفارش",
      href: "/support/orders",
      icon: "pencil",
      description: "اصلاح سفارش ‌ها",
    },
  ],
};
