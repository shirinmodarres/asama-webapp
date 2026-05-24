"use client";

import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type {
  CustomerAddress,
  CustomerAddressPayload,
  ReceiverType,
} from "@/lib/models/customer.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";
import {
  isRequired,
  isValidPhone,
  PHONE_MESSAGE,
  REQUIRED_MESSAGE,
  SELECT_REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";

interface AddressFormProps {
  customerFullName: string;
  customerPhone: string;
  initialValues?: CustomerAddress;
  onSubmit: (input: CustomerAddressPayload) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultIsDefault?: boolean;
}

export function AddressForm({
  customerFullName,
  customerPhone,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "ذخیره آدرس",
  defaultIsDefault = false,
}: AddressFormProps) {
  const [title, setTitle] = useState(
    initialValues?.title || "آدرس پیش‌فرض",
  );
  const [receiverType, setReceiverType] = useState<ReceiverType>(
    initialValues?.receiverType ?? "self",
  );
  const [receiverFullName, setReceiverFullName] = useState(
    initialValues?.receiverFullName ?? "",
  );
  const [receiverPhone, setReceiverPhone] = useState(
    initialValues?.receiverPhone ?? "",
  );
  const [province, setProvince] = useState(initialValues?.province ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "");
  const [county, setCounty] = useState(initialValues?.county ?? "");
  const [fullAddress, setFullAddress] = useState(
    initialValues?.fullAddress ?? "",
  );
  const [postalCode, setPostalCode] = useState(initialValues?.postalCode ?? "");
  const [plaque, setPlaque] = useState(initialValues?.plaque ?? "");
  const [unit, setUnit] = useState(initialValues?.unit ?? "");
  const [isDefault, setIsDefault] = useState(
    initialValues?.isDefault ?? defaultIsDefault,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!receiverType) nextErrors.receiverType = SELECT_REQUIRED_MESSAGE;
    if (!isRequired(province)) nextErrors.province = REQUIRED_MESSAGE;
    if (!isRequired(city)) nextErrors.city = REQUIRED_MESSAGE;
    if (!isRequired(fullAddress)) nextErrors.fullAddress = REQUIRED_MESSAGE;
    if (receiverType === "other") {
      if (!isRequired(receiverFullName)) {
        nextErrors.receiverFullName = REQUIRED_MESSAGE;
      }
      if (!isRequired(receiverPhone)) {
        nextErrors.receiverPhone = REQUIRED_MESSAGE;
      } else if (!isValidPhone(receiverPhone)) {
        nextErrors.receiverPhone = PHONE_MESSAGE;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!validate()) return;
        const isSelf = receiverType === "self";
        onSubmit({
          title: optional(title) ?? "آدرس پیش‌فرض",
          receiverType,
          receiverFullName: isSelf
            ? customerFullName.trim()
            : optional(receiverFullName),
          receiverPhone: isSelf
            ? normalizePhone(customerPhone)
            : receiverPhone
              ? normalizePhone(receiverPhone)
              : null,
          province: province.trim(),
          city: city.trim(),
          county: optional(county),
          fullAddress: fullAddress.trim(),
          postalCode: postalCode ? normalizeDigits(postalCode) : null,
          plaque: plaque ? normalizeDigits(plaque) : null,
          unit: unit ? normalizeDigits(unit) : null,
          isDefault,
        });
      }}
      className="grid gap-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="عنوان آدرس"
          value={title}
          onChange={(value) => {
            setTitle(value);
            clearError("title");
          }}
          required={false}
        />
        <FormField label="گیرنده بار" error={errors.receiverType}>
          <SearchableSelect
            value={receiverType}
            onValueChange={(value) => {
              setReceiverType(value as ReceiverType);
              clearError("receiverType");
            }}
            options={[
              { value: "self", label: "خود مشتری" },
              { value: "other", label: "فرد دیگر" },
            ]}
            placeholder="انتخاب گیرنده"
            searchPlaceholder="جستجو در گزینه‌ها"
            emptyMessage="گزینه‌ای پیدا نشد"
            invalid={Boolean(errors.receiverType)}
          />
        </FormField>
        <InputField
          label="استان"
          value={province}
          onChange={(value) => {
            setProvince(value);
            clearError("province");
          }}
          error={errors.province}
        />
        <InputField
          label="شهر"
          value={city}
          onChange={(value) => {
            setCity(value);
            clearError("city");
          }}
          error={errors.city}
        />
        <InputField
          label="شهرستان"
          value={county}
          onChange={(value) => {
            setCounty(value);
            clearError("county");
          }}
          required={false}
        />
        <InputField
          label="کد پستی"
          value={postalCode}
          onChange={(value) => {
            setPostalCode(value);
            clearError("postalCode");
          }}
          required={false}
        />
        <InputField
          label="پلاک"
          value={plaque}
          onChange={(value) => {
            setPlaque(value);
            clearError("plaque");
          }}
          required={false}
        />
        <InputField
          label="واحد"
          value={unit}
          onChange={(value) => {
            setUnit(value);
            clearError("unit");
          }}
          required={false}
        />
      </div>

      {receiverType === "self" ? (
        <p className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm text-[#6B7280]">
          اطلاعات گیرنده از مشخصات مشتری تکمیل می‌شود.
        </p>
      ) : (
        <div className="grid gap-4 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-4 md:grid-cols-2">
          <div className="md:col-span-2 text-sm leading-7 text-[#6B7280]">
            اطلاعات گیرنده برای ارسال حواله خروج و تأیید دریافت بار استفاده
            می‌شود.
          </div>
          <InputField
            label="نام و نام خانوادگی گیرنده"
            value={receiverFullName}
            onChange={(value) => {
              setReceiverFullName(value);
              clearError("receiverFullName");
            }}
            error={errors.receiverFullName}
          />
          <InputField
            label="شماره موبایل گیرنده"
            value={receiverPhone}
            onChange={(value) => {
              setReceiverPhone(value);
              clearError("receiverPhone");
            }}
            error={errors.receiverPhone}
          />
        </div>
      )}

      <label className="grid gap-2 text-sm font-medium text-[#334155]">
        <span>آدرس کامل</span>
        <Textarea
          value={fullAddress}
          onChange={(event) => {
            setFullAddress(event.target.value);
            clearError("fullAddress");
          }}
          aria-invalid={Boolean(errors.fullAddress)}
        />
        <FieldError message={errors.fullAddress} />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-[#334155]">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(event) => setIsDefault(event.target.checked)}
          className="size-4 accent-[#1F3A5F]"
        />
        آدرس پیش‌فرض باشد
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "در حال ذخیره..." : submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            انصراف
          </Button>
        ) : null}
      </div>
    </form>
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

function optional(value: string): string | null {
  const text = value.trim();
  return text ? text : null;
}
