"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { UserForm, type UpdateUserFormInput } from "@/components/support/user-form";
import { getErrorMessage } from "@/lib/api/api-error";
import type { User } from "@/lib/models/user.model";
import { getUser, updateUser } from "@/lib/services/user.service";

export default function SupportEditUserPage() {
  const params = useParams<{ objectId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setIsLoading(true);
      setMessage("");
      try {
        const data = await getUser(params.objectId);
        if (isMounted) setUser(data);
      } catch (error) {
        if (isMounted) setMessage(getErrorMessage(error));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [params.objectId]);

  const handleSubmit = async (input: UpdateUserFormInput) => {
    setIsSubmitting(true);
    setMessage("");
    try {
      await updateUser(params.objectId, input);
      router.push("/support/users");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="support" title="ویرایش کاربر">
      <SectionHeader
        title="ویرایش اطلاعات کاربر"
        description="اطلاعات هویتی، نقش و وضعیت دسترسی کاربر را به‌روزرسانی کنید"
      />

      {isLoading ? (
        <LoadingState title="در حال دریافت اطلاعات کاربر" description="جزئیات کاربر از سرور دریافت می شود." />
      ) : !user ? (
        <EmptyState title="کاربر یافت نشد" description={message || "شناسه کاربر معتبر نیست."} />
      ) : (
        <>
          {message ? <InlineErrorMessage message={message} /> : null}
          <UserForm
            mode="edit"
            initialValues={{
              fullName: user.fullName,
              phone: user.phone,
              role: user.role,
              status: user.status,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/support/users")}
          />
        </>
      )}
    </DashboardLayout>
  );
}
