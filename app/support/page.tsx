"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { ManagerSummaryCard } from "@/components/manager/manager-summary-card";
import { SupportActionCard } from "@/components/support/support-action-card";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Order } from "@/lib/models/order.model";
import type { Product } from "@/lib/models/product.model";
import { listOrders } from "@/lib/services/order.service";
import { listProducts } from "@/lib/services/product.service";

export default function SupportPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [productData, orderData] = await Promise.all([
          listProducts("support"),
          listOrders(),
        ]);
        if (isMounted) {
          setProducts(productData);
          setOrders(orderData);
        }
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const lowStockCount = products.filter(
    (product) =>
      product.availableStock <=
      Math.max(5, Math.floor(product.salesStock * 0.2)),
  ).length;
  const orderNeedsEditCount = orders.filter(
    (order) =>
      order.orderStatus === "pending" || order.orderStatus === "approved",
  ).length;
  const najaInventoryCount = products.filter(
    (product) => product.najaInventoryQty > 0,
  ).length;

  return (
    <DashboardLayout role="support" title="داشبورد پشتیبانی">
      {error ? <InlineErrorMessage message={error} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagerSummaryCard
          title="تعداد کالاها"
          value={products.length}
          hint="اقلام تعریف شده در سیستم"
        />
        <ManagerSummaryCard
          title="کالاهای کم موجودی"
          value={lowStockCount}
          hint="نیازمند توجه برای به روزرسانی"
        />
        <ManagerSummaryCard
          title="سفارش های نیازمند اصلاح"
          value={orderNeedsEditCount}
          hint="برای ویرایش ویژه قابل بررسی"
        />
        <ManagerSummaryCard
          title="اقلام دارای موجودی ناجا"
          value={najaInventoryCount}
          hint="اقلام قابل ثبت در ناجا"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SupportActionCard
          title="کالاهای سپیدار"
          description="مشاهده و به‌روزرسانی کالاها از سپیدار"
          href="/support/products"
        />
        <SupportActionCard
          title="ثبت موجودی"
          description="افزایش یا کاهش کنترل شده موجودی فروش"
          href="/support/inventory"
        />
        <SupportActionCard
          title="ویرایش سفارش"
          description="ثبت ویرایش ویژه پشتیبانی خارج از روند عادی"
          href="/support/orders"
        />
        <SupportActionCard
          title="موجودی ناجا"
          description="تعریف و به روزرسانی موجودی اختصاصی سفارش های ناجا"
          href="/support/naja-inventory"
        />
      </section>
    </DashboardLayout>
  );
}
