"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Warehouse } from "@/lib/models/warehouse.model";

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

  const toggleOrderType = (value: "normal" | "naja") => {
    setAllowedOrderTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, code, type, allowedOrderTypes, isDefault, status });
      }}
    >
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="نام انبار" value={name} onChange={setName} />
          <InputField label="کد انبار" value={code} onChange={setCode} />

          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>نوع انبار</span>
            <SearchableSelect
              value={type}
              onValueChange={setType}
              options={[
                { value: "general", label: "عمومی" },
                { value: "naja", label: "ناجا" },
                { value: "other", label: "سایر" },
              ]}
              placeholder="انتخاب نوع انبار"
              searchPlaceholder="جستجو در نوع انبار"
              emptyMessage="نوعی پیدا نشد"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>وضعیت</span>
            <SearchableSelect
              value={status}
              onValueChange={setStatus}
              options={[
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
              ]}
              placeholder="انتخاب وضعیت"
              searchPlaceholder="جستجو در وضعیت"
              emptyMessage="وضعیتی پیدا نشد"
            />
          </label>

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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
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
