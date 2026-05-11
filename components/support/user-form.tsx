"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ROLE_OPTIONS } from "@/lib/domain/roles";
import type { BackendRoleKey } from "@/lib/domain/roles";
import type { UserStatus } from "@/lib/models/auth.model";
import { normalizePhone } from "@/lib/utils/number-format";

interface BaseProps {
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface CreateUserFormInput {
  fullName: string;
  phone: string;
  password: string;
  role: BackendRoleKey;
  status: UserStatus;
}

export interface UpdateUserFormInput {
  fullName: string;
  phone: string;
  password?: string;
  role: BackendRoleKey;
  status: UserStatus;
}

interface CreateModeProps extends BaseProps {
  mode: "create";
  onSubmit: (input: CreateUserFormInput) => void;
}

interface EditModeProps extends BaseProps {
  mode: "edit";
  initialValues: UpdateUserFormInput;
  onSubmit: (input: UpdateUserFormInput) => void;
}

type UserFormProps = CreateModeProps | EditModeProps;

const statusOptions = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

export function UserForm(props: UserFormProps) {
  const [fullName, setFullName] = useState(
    props.mode === "edit" ? props.initialValues.fullName : "",
  );
  const [phone, setPhone] = useState(
    props.mode === "edit" ? props.initialValues.phone : "",
  );
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<BackendRoleKey>(
    props.mode === "edit" ? props.initialValues.role : "expert",
  );
  const [status, setStatus] = useState<UserStatus>(
    props.mode === "edit" ? props.initialValues.status : "active",
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        if (props.mode === "create") {
          props.onSubmit({
            fullName: fullName.trim(),
            phone: normalizePhone(phone),
            password,
            role,
            status,
          });
          return;
        }

        props.onSubmit({
          fullName: fullName.trim(),
          phone: normalizePhone(phone),
          password: password.trim() || undefined,
          role,
          status,
        });
      }}
      className="contents"
    >
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="نام" value={fullName} onChange={setFullName} />
          <InputField label="شماره موبایل" value={phone} onChange={setPhone} />
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>نقش</span>
            <SearchableSelect
              value={role}
              onValueChange={(value) => setRole(value as BackendRoleKey)}
              options={ROLE_OPTIONS}
              placeholder="انتخاب نقش"
              searchPlaceholder="جستجو در نقش ها"
              emptyMessage="نقشی پیدا نشد"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>وضعیت</span>
            <SearchableSelect
              value={status}
              onValueChange={(value) => setStatus(value as UserStatus)}
              options={statusOptions}
              placeholder="انتخاب وضعیت"
              searchPlaceholder="جستجو در وضعیت ها"
              emptyMessage="وضعیتی پیدا نشد"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
            <span>{props.mode === "create" ? "رمز عبور" : "رمز عبور جدید (اختیاری)"}</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required={props.mode === "create"}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={props.isSubmitting}>
            {props.isSubmitting
              ? "در حال ثبت..."
              : props.mode === "create"
                ? "ثبت کاربر"
                : "ذخیره تغییرات"}
          </Button>
          <Button type="button" variant="outline" onClick={props.onCancel} disabled={props.isSubmitting}>
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
      <Input value={value} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}
