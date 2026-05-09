import type { PanelRoleKey } from "@/lib/domain/roles";
import type { SidebarItem } from "@/lib/types";

export const sidebarByRole: Record<PanelRoleKey, SidebarItem[]> = {
  expert: [
    {
      label: "داشبورد",
      href: "/expert",
      icon: "dashboard",
      description: "مرور وضعیت سفارش های روز",
    },
    {
      label: "موجودی",
      href: "/expert/inventory",
      icon: "boxes",
      description: "بررسی موجودی قابل رزرو کالاها",
    },
    {
      label: "سفارش ها",
      href: "/expert/orders",
      icon: "shopping-cart",
      description: "فهرست سفارش های ثبت شده",
    },
    {
      label: "ثبت سفارش",
      href: "/expert/orders/new",
      icon: "plus-circle",
      description: "ایجاد سفارش جدید فروش",
    },
  ],
  naja: [
    {
      label: "داشبورد",
      href: "/naja",
      icon: "dashboard",
      description: "مرور وضعیت سفارش های ناجا",
    },
    {
      label: "ثبت سفارش ناجا",
      href: "/naja/orders/new",
      icon: "plus-circle",
      description: "ایجاد سفارش جدید از موجودی اختصاصی ناجا",
    },
    {
      label: "مراکز ناجا",
      href: "/naja/centers",
      icon: "layers",
      description: "فهرست مراکز ثبت شده برای جریان سفارش های ناجا",
    },
    {
      label: "تعریف مرکز ناجا",
      href: "/naja/centers/new",
      icon: "plus-circle",
      description: "ثبت مرکز جدید برای انتخاب در سفارش های ناجا",
    },
    {
      label: "سفارش های ناجا",
      href: "/naja/orders",
      icon: "shopping-cart",
      description: "فهرست سفارش های ثبت شده و برگشتی",
    },
  ],
  manager: [
    {
      label: "داشبورد",
      href: "/manager",
      icon: "dashboard",
      description: "خلاصه تصمیم های امروز",
    },
    {
      label: "سفارش های در انتظار تأیید",
      href: "/manager/pending-orders",
      icon: "clipboard-check",
      description: "صف تایید و لغو سفارش",
    },
    {
      label: "روند سفارش ها",
      href: "/manager/order-tracking",
      icon: "activity",
      description: "پایش جریان سفارش تا انتها",
    },
    {
      label: "مراکز ناجا",
      href: "/manager/naja-centers",
      icon: "layers",
      description: "نمای read-only مراکز تعریف شده برای سفارش های ناجا",
    },
  ],
  warehouse: [
    {
      label: "داشبورد",
      href: "/warehouse",
      icon: "dashboard",
      description: "نمای کلی عملیات انبار",
    },
    {
      label: "سفارش های تأییدشده",
      href: "/warehouse/orders",
      icon: "package",
      description: "صف سفارش های آماده بررسی",
    },
    {
      label: "حواله های خروج",
      href: "/warehouse/exit-slips",
      icon: "truck",
      description: "مدیریت حواله ها و ارسال",
    },
    {
      label: "سفارش های تحویل شده",
      href: "/warehouse/delivered",
      icon: "file-check",
      description: "ثبت و تایید تحویل نهایی",
    },
  ],
  finance: [
    {
      label: "داشبورد",
      href: "/finance",
      icon: "dashboard",
      description: "پایش وضعیت مالی سفارش ها",
    },
    {
      label: "آماده فاکتور",
      href: "/finance/ready",
      icon: "layers",
      description: "سفارش های آماده بررسی و تطبیق",
    },
    {
      label: "فاکتورها",
      href: "/finance/invoices",
      icon: "file-text",
      description: "فهرست اسناد مالی صادرشده",
    },
  ],
  support: [
    {
      label: "داشبورد",
      href: "/support",
      icon: "dashboard",
      description: "نمای کلی داده های پایه",
    },
    {
      label: "کالاها",
      href: "/support/products",
      icon: "boxes",
      description: "مدیریت فهرست و وضعیت کالاها",
    },
    {
      label: "موجودی",
      href: "/support/inventory",
      icon: "package",
      description: "افزایش و کاهش کنترل شده موجودی",
    },
    {
      label: "موجودی ناجا",
      href: "/support/naja-inventory",
      icon: "package",
      description: "مدیریت موجودی اختصاصی سفارش های ناجا",
    },
    {
      label: "کاربران",
      href: "/support/users",
      icon: "layers",
      description: "مدیریت کاربران سامانه و نقش های دسترسی",
    },
    {
      label: "تاریخچه موجودی",
      href: "/support/inventory-history",
      icon: "history",
      description: "ردیابی ثبت های انبار",
    },
    {
      label: "ویرایش سفارش",
      href: "/support/orders",
      icon: "pencil",
      description: "اصلاح سفارش در سناریوهای ویژه",
    },
  ],
};
