"use client";

import { useState } from "react";
import { AddressForm } from "@/components/customer/address-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  CustomerAddressPayload,
  CustomerPayload,
} from "@/lib/models/customer.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

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
  const [validationError, setValidationError] = useState("");

  const handleAddressSubmit = (defaultAddress: CustomerAddressPayload) => {
    if (!fullName.trim() || !phone.trim()) {
      setValidationError("نام مشتری و شماره موبایل الزامی است.");
      return;
    }

    setValidationError("");
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
            onChange={setFullName}
          />
          <InputField
            label="شماره موبایل"
            value={phone}
            onChange={setPhone}
          />
          <InputField
            label="کد ملی"
            value={nationalId}
            onChange={setNationalId}
            required={false}
          />
        </div>
        {validationError ? (
          <p className="mt-4 rounded-xl border border-[#F0D0D0] bg-[#FFF6F6] p-3 text-sm text-[#9C3B3B]">
            {validationError}
          </p>
        ) : null}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
