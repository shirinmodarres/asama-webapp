"use client";

import { useState } from "react";
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
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
          onChange={setTitle}
          required={false}
        />
        <label className="grid gap-2 text-sm font-medium text-[#334155]">
          <span>گیرنده بار</span>
          <SearchableSelect
            value={receiverType}
            onValueChange={(value) => setReceiverType(value as ReceiverType)}
            options={[
              { value: "self", label: "خود مشتری" },
              { value: "other", label: "فرد دیگر" },
            ]}
            placeholder="انتخاب گیرنده"
            searchPlaceholder="جستجو در گزینه‌ها"
            emptyMessage="گزینه‌ای پیدا نشد"
          />
        </label>
        <InputField label="استان" value={province} onChange={setProvince} />
        <InputField label="شهر" value={city} onChange={setCity} />
        <InputField
          label="شهرستان"
          value={county}
          onChange={setCounty}
          required={false}
        />
        <InputField
          label="کد پستی"
          value={postalCode}
          onChange={setPostalCode}
          required={false}
        />
        <InputField
          label="پلاک"
          value={plaque}
          onChange={setPlaque}
          required={false}
        />
        <InputField
          label="واحد"
          value={unit}
          onChange={setUnit}
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
            onChange={setReceiverFullName}
          />
          <InputField
            label="شماره موبایل گیرنده"
            value={receiverPhone}
            onChange={setReceiverPhone}
          />
        </div>
      )}

      <label className="grid gap-2 text-sm font-medium text-[#334155]">
        <span>آدرس کامل</span>
        <Textarea
          value={fullAddress}
          onChange={(event) => setFullAddress(event.target.value)}
          required
        />
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

function optional(value: string): string | null {
  const text = value.trim();
  return text ? text : null;
}
