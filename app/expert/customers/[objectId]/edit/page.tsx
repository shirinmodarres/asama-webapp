"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddressForm } from "@/components/customer/address-form";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField } from "@/components/shared/form-field";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  Customer,
  CustomerAddress,
  CustomerPayload,
} from "@/lib/models/customer.model";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomer,
  updateCustomer,
  updateCustomerAddress,
} from "@/lib/services/customer.service";
import { formatDeliveryAddress } from "@/lib/utils/address-format";
import { formatFaDigits, normalizeDigits, normalizePhone } from "@/lib/utils/number-format";
import {
  isRequired,
  isValidNationalId,
  isValidPhone,
  PHONE_MESSAGE,
  REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";

export default function EditCustomerPage() {
  const params = useParams<{ objectId: string }>();
  const router = useRouter();
  const objectId = decodeURIComponent(params.objectId);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  useEffect(() => {
    let isMounted = true;
    async function loadCustomer() {
      setIsLoading(true);
      setMessage("");
      try {
        const data = await getCustomer(objectId);
        if (isMounted) setCustomer(data);
      } catch (error) {
        if (isMounted) {
          setMessageType("error");
          setMessage(getErrorMessage(error));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCustomer();
    return () => {
      isMounted = false;
    };
  }, [objectId]);

  const reloadCustomer = async () => {
    const data = await getCustomer(objectId);
    setCustomer(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="expert" title="ویرایش مشتری">
        <LoadingState title="در حال دریافت مشتری" />
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout role="expert" title="ویرایش مشتری">
        {message ? <InlineErrorMessage message={message} /> : null}
        <EmptyState title="مشتری پیدا نشد" description="شناسه مشتری معتبر نیست." />
      </DashboardLayout>
    );
  }

  const handleCustomerSubmit = async (payload: CustomerPayload) => {
    setIsSubmitting(true);
    setMessage("");
    try {
      const updated = await updateCustomer(objectId, payload);
      setCustomer(updated);
      setMessageType("success");
      setMessage("اطلاعات مشتری ذخیره شد.");
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressSubmit = async (payload: Parameters<typeof createCustomerAddress>[1]) => {
    setIsSubmitting(true);
    setMessage("");
    try {
      if (editingAddress) {
        await updateCustomerAddress(editingAddress.objectId, payload);
      } else {
        await createCustomerAddress(customer.objectId, payload);
      }
      await reloadCustomer();
      setShowAddressForm(false);
      setEditingAddress(null);
      setMessageType("success");
      setMessage("آدرس ذخیره شد.");
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<CustomerAddress>[] = [
    { key: "title", header: "عنوان", render: (row) => <span className="font-medium text-[#1F3A5F]">{row.title || "-"}</span> },
    { key: "receiver", header: "گیرنده بار", render: (row) => row.receiverFullName || "-" },
    { key: "phone", header: "موبایل گیرنده", render: (row) => row.receiverPhone ? formatFaDigits(row.receiverPhone) : "-" },
    { key: "city", header: "شهر", render: (row) => row.city || "-" },
    { key: "address", header: "آدرس", cellClassName: "max-w-[360px] whitespace-normal leading-7", render: (row) => formatDeliveryAddress(row) },
    { key: "default", header: "پیش‌فرض", render: (row) => row.isDefault ? "بله" : "-" },
    { key: "status", header: "وضعیت", render: (row) => row.statusLabel },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => { setEditingAddress(row); setShowAddressForm(true); }}>
            ویرایش
          </Button>
          {!row.isDefault ? (
            <Button type="button" size="sm" variant="outline" onClick={() => handleAddressSubmit({ ...row, isDefault: true })} disabled={isSubmitting}>
              پیش‌فرض
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="destructive" onClick={async () => {
            setIsSubmitting(true);
            setMessage("");
            try {
              await deleteCustomerAddress(row.objectId);
              await reloadCustomer();
              setMessageType("success");
              setMessage("آدرس حذف شد.");
            } catch (error) {
              setMessageType("error");
              setMessage(getErrorMessage(error));
            } finally {
              setIsSubmitting(false);
            }
          }} disabled={isSubmitting}>
            حذف
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="expert" title="ویرایش مشتری">
      {message && messageType === "success" ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}

      <CustomerEditForm
        customer={customer}
        isSubmitting={isSubmitting}
        onSubmit={handleCustomerSubmit}
        onCancel={() => router.push("/expert/customers")}
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#102034]">آدرس‌ها</h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              این آدرس برای صدور حواله خروج، ارسال کالا و تأیید دریافت بار استفاده می‌شود.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => { setEditingAddress(null); setShowAddressForm((current) => !current); }}>
            افزودن آدرس
          </Button>
        </div>
        {showAddressForm ? (
          <div className="mt-5 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-4">
            <AddressForm
              customerFullName={customer.fullName}
              customerPhone={customer.phone}
              initialValues={editingAddress ?? undefined}
              onSubmit={handleAddressSubmit}
              onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }}
              isSubmitting={isSubmitting}
              submitLabel={editingAddress ? "ذخیره تغییرات آدرس" : "افزودن آدرس"}
            />
          </div>
        ) : null}
        <div className="mt-5">
          {customer.addresses.length > 0 ? (
            <DataTable columns={columns} rows={customer.addresses} rowKey={(row) => row.objectId} />
          ) : (
            <EmptyState title="آدرسی ثبت نشده است" description="برای استفاده در سفارش، یک آدرس تحویل اضافه کنید." />
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

function CustomerEditForm({
  customer,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  customer: Customer;
  onSubmit: (input: CustomerPayload) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [fullName, setFullName] = useState(customer.fullName);
  const [phone, setPhone] = useState(customer.phone);
  const [nationalId, setNationalId] = useState(customer.nationalId ?? "");
  const [status, setStatus] = useState(customer.status);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};
        if (!isRequired(fullName)) nextErrors.fullName = REQUIRED_MESSAGE;
        if (!isRequired(phone)) {
          nextErrors.phone = REQUIRED_MESSAGE;
        } else if (!isValidPhone(phone)) {
          nextErrors.phone = PHONE_MESSAGE;
        }
        if (nationalId && !isValidNationalId(nationalId)) {
          nextErrors.nationalId = "کد ملی معتبر نیست.";
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit({
          fullName,
          phone: normalizePhone(phone),
          nationalId: nationalId ? normalizeDigits(nationalId) : null,
          status,
        });
      }}
      className="contents"
    >
      <Card className="p-5">
        <h3 className="text-base font-semibold text-[#102034]">اطلاعات مشتری</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputField
            label="نام مشتری"
            value={fullName}
            onChange={(value) => {
              setFullName(value);
              clearError("fullName");
            }}
            error={errors.fullName}
          />
          <InputField
            label="شماره موبایل"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              clearError("phone");
            }}
            error={errors.phone}
          />
          <InputField
            label="کد ملی"
            value={nationalId}
            onChange={(value) => {
              setNationalId(value);
              clearError("nationalId");
            }}
            required={false}
            error={errors.nationalId}
          />
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>وضعیت</span>
            <SearchableSelect value={status} onValueChange={(value) => setStatus(value as Customer["status"])} options={[{ value: "active", label: "فعال" }, { value: "inactive", label: "غیرفعال" }]} />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}</Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>بازگشت</Button>
        </div>
      </Card>
    </form>
  );
}

function InputField({ label, value, onChange, required = true, error }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; error?: string }) {
  return (
    <FormField label={label} error={error}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-required={required}
      />
    </FormField>
  );
}
