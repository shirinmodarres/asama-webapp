"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { UserForm, type CreateUserFormInput } from "@/components/support/user-form";
import { getErrorMessage } from "@/lib/api/api-error";
import { createUser } from "@/lib/services/user.service";

export default function SupportCreateUserPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (input: CreateUserFormInput) => {
    setIsSubmitting(true);
    setMessage("");
    setMessageType("error");

    try {
      await createUser(input);
      setMessageType("success");
      setMessage("کاربر با موفقیت ثبت شد.");
      setTimeout(() => {
        router.push("/support/users");
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
    <DashboardLayout role="support" title="تعریف کاربر جدید">
      {message && messageType === "success" ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {message && messageType === "error" ? <InlineErrorMessage message={message} /> : null}
      <UserForm mode="create" onSubmit={onSubmit} isSubmitting={isSubmitting} onCancel={() => router.push("/support/users")} />
    </DashboardLayout>
  );
}
