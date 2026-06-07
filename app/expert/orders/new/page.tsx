"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  OrderForm,
  type OrderFormSubmitPayload,
} from "@/components/orders/order-form";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { createOrder } from "@/lib/services/order.service";

export default function NewExpertOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: OrderFormSubmitPayload) => {
    setIsSubmitting(true);
    try {
      const order = await createOrder({
        ...payload,
        expertUserId: getStoredCurrentUser()?.objectId || undefined,
        createdByName:
          getStoredCurrentUser()?.fullName ||
          getStoredCurrentUser()?.username ||
          "کارشناس فروش",
      });
      router.push(`/expert/orders/${order.objectId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="expert" title="ثبت سفارش">
      <OrderForm
        mode="create"
        submitLabel="ثبت سفارش"
        isSubmitting={isSubmitting}
        assignedCustomersOnly
        sepidarProductsOnly
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
}
