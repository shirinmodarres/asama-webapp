"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CustomerForm,
  type CustomerFormInput,
} from "@/components/customer/customer-form";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { getErrorMessage } from "@/lib/api/api-error";
import { createCustomer } from "@/lib/services/customer.service";

export default function NewCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const handleSubmit = async (input: CustomerFormInput) => {
    setIsSubmitting(true);
    setMessage("");
    try {
      await createCustomer(input);
      setMessageType("success");
      setMessage("مشتری با موفقیت ثبت شد.");
      setTimeout(() => {
        router.push("/expert/customers");
        router.refresh();
      }, 700);
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="expert" title="تعریف مشتری">
      {message && messageType === "success" ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}
      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/expert/customers")}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
}
