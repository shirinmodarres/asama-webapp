"use client";

import { useState } from "react";
import { AddressForm } from "@/components/customer/address-form";
import { FormField } from "@/components/shared/form-field";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  CustomerAddressPayload,
  CustomerPayload,
} from "@/lib/models/customer.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";
import {
  isRequired,
  isValidNationalId,
  isValidPhone,
  PHONE_MESSAGE,
  REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";

export interface CustomerFormInput extends CustomerPayload {
  defaultAddress: CustomerAddressPayload;
}

interface CustomerFormProps {
  onSubmit: (input: CustomerFormInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CustomerForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CustomerFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleAddressSubmit = (defaultAddress: CustomerAddressPayload) => {
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

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      fullName: fullName.trim(),
      phone: normalizePhone(phone),
      nationalId: nationalId ? normalizeDigits(nationalId) : null,
      status: "active",
      defaultAddress,
    });
  };

  return (
    <>
      <Card className="p-5">
        <h3 className="text-base font-semibold text-[#102034]">
          اطلاعات مشتری
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputField
            label="نام مشتری"
            value={fullName}
            onChange={(value) => {
              setFullName(value);
              setFieldErrors((current) => ({ ...current, fullName: "" }));
            }}
            error={fieldErrors.fullName}
          />
          <InputField
            label="شماره موبایل"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              setFieldErrors((current) => ({ ...current, phone: "" }));
            }}
            error={fieldErrors.phone}
          />
          <InputField
            label="کد ملی"
            value={nationalId}
            onChange={(value) => {
              setNationalId(value);
              setFieldErrors((current) => ({ ...current, nationalId: "" }));
            }}
            required={false}
            error={fieldErrors.nationalId}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-base font-semibold text-[#102034]">آدرس گیرنده</h3>
        <p className="mt-1 text-sm leading-7 text-[#6B7280]">
          این آدرس برای صدور حواله خروج، ارسال کالا و تأیید دریافت بار استفاده
          می‌شود.
        </p>
        <div className="mt-5">
          <AddressForm
            customerFullName={fullName}
            customerPhone={phone}
            onSubmit={handleAddressSubmit}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            submitLabel="ثبت مشتری"
            defaultIsDefault
          />
        </div>
      </Card>
    </>
  );
}

function InputField({
  label,
  value,
  onChange,
  required = true,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}) {
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
