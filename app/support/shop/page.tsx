import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SectionHeader } from "@/components/shared/section-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const shopSections = [
  {
    title: "محصولات سایت",
    description: "مدیریت محصولات قابل نمایش در فروشگاه عمومی",
    href: "/support/shop/products",
  },
  {
    title: "سفارش‌های سایت",
    description: "پیگیری سفارش‌های ثبت‌شده در فروشگاه عمومی",
    href: "/support/shop/orders",
  },
  {
    title: "برندها",
    description: "تعریف و ویرایش برندهای قابل انتخاب برای محصولات سایت",
    href: "/support/shop/brands",
  },
  {
    title: "دسته‌بندی‌ها",
    description: "تعریف و ویرایش دسته‌بندی‌های فروشگاه",
    href: "/support/shop/categories",
  },
];

export default function SupportShopPage() {
  return (
    <DashboardLayout role="support" title="فروشگاه">
      <SectionHeader
        title="مدیریت فروشگاه"
        description="محصولات، برندها، دسته‌بندی‌ها و سفارش‌های سایت را مدیریت کنید."
      />
      <section className="grid gap-4 md:grid-cols-2">
        {shopSections.map((section) => (
          <Card key={section.href} className="p-5">
            <h2 className="text-base font-semibold text-[#102034]">
              {section.title}
            </h2>
            <p className="mt-2 min-h-12 text-sm leading-7 text-[#64748B]">
              {section.description}
            </p>
            <Button asChild className="mt-4">
              <Link href={section.href}>ورود</Link>
            </Button>
          </Card>
        ))}
      </section>
    </DashboardLayout>
  );
}
