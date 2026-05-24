"use client";

import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Warehouse } from "@/lib/models/warehouse.model";
import {
  isRequired,
  REQUIRED_MESSAGE,
  SELECT_REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";

export interface WarehouseFormInput {
  name: string;
  code: string;
  type: string;
  allowedOrderTypes: Array<"normal" | "naja">;
  isDefault: boolean;
  status: string;
}

interface WarehouseFormProps {
  mode: "create" | "edit";
  initialValues?: Warehouse;
  isSubmitting?: boolean;
  onSubmit: (input: WarehouseFormInput) => void;
  onCancel: () => void;
}

export function WarehouseForm({
  mode,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: WarehouseFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [code, setCode] = useState(initialValues?.code ?? "");
  const [type, setType] = useState(initialValues?.type ?? "general");
  const [allowedOrderTypes, setAllowedOrderTypes] = useState<
    Array<"normal" | "naja">
  >(initialValues?.allowedOrderTypes ?? ["normal"]);
  const [isDefault, setIsDefault] = useState(initialValues?.isDefault ?? false);
  const [status, setStatus] = useState(initialValues?.status ?? "active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const toggleOrderType = (value: "normal" | "naja") => {
    clearError("allowedOrderTypes");
    setAllowedOrderTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};
        if (!isRequired(name)) nextErrors.name = REQUIRED_MESSAGE;
        if (!isRequired(code)) nextErrors.code = REQUIRED_MESSAGE;
        if (!type) nextErrors.type = SELECT_REQUIRED_MESSAGE;
        if (!status) nextErrors.status = SELECT_REQUIRED_MESSAGE;
        if (allowedOrderTypes.length === 0) {
          nextErrors.allowedOrderTypes = "حداقل یک نوع سفارش را انتخاب کنید.";
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit({ name, code, type, allowedOrderTypes, isDefault, status });
      }}
    >
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="نام انبار"
            value={name}
            onChange={(value) => {
              setName(value);
              clearError("name");
            }}
            error={errors.name}
          />
          <InputField
            label="کد انبار"
            value={code}
            onChange={(value) => {
              setCode(value);
              clearError("code");
            }}
            error={errors.code}
          />

          <FormField label="نوع انبار" error={errors.type}>
            <SearchableSelect
              value={type}
              onValueChange={(value) => {
                setType(value);
                clearError("type");
              }}
              options={[
                { value: "general", label: "عمومی" },
                { value: "naja", label: "ناجا" },
                { value: "other", label: "سایر" },
              ]}
              placeholder="انتخاب نوع انبار"
              searchPlaceholder="جستجو در نوع انبار"
              emptyMessage="نوعی پیدا نشد"
              invalid={Boolean(errors.type)}
            />
          </FormField>

          <FormField label="وضعیت" error={errors.status}>
            <SearchableSelect
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                clearError("status");
              }}
              options={[
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
              ]}
              placeholder="انتخاب وضعیت"
              searchPlaceholder="جستجو در وضعیت"
              emptyMessage="وضعیتی پیدا نشد"
              invalid={Boolean(errors.status)}
            />
          </FormField>

          <div className="grid gap-3 text-sm font-medium text-[#334155]">
            <span>نوع سفارش مجاز</span>
            <CheckRow
              checked={allowedOrderTypes.includes("normal")}
              label="سفارش عادی"
              onChange={() => toggleOrderType("normal")}
            />
            <CheckRow
              checked={allowedOrderTypes.includes("naja")}
              label="سفارش ناجا"
              onChange={() => toggleOrderType("naja")}
            />
            <FieldError message={errors.allowedOrderTypes} />
          </div>

          <div className="grid content-start gap-3 text-sm font-medium text-[#334155]">
            <span>تنظیمات</span>
            <CheckRow
              checked={isDefault}
              label="انبار پیش‌فرض"
              onChange={() => setIsDefault((current) => !current)}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "در حال ثبت..."
              : mode === "create"
                ? "ثبت انبار"
                : "ذخیره تغییرات"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            انصراف
          </Button>
        </div>
      </Card>
    </form>
  );
}

function InputField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <FormField label={label} error={error}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      />
    </FormField>
  );
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#334155]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-[#D7DEE6] accent-[#1F3A5F]"
      />
      <span>{label}</span>
    </label>
  );
}
