"use client";

import { useState } from "react";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ROLE_OPTIONS } from "@/lib/domain/roles";
import type { BackendRoleKey } from "@/lib/domain/roles";
import type { UserStatus } from "@/lib/models/auth.model";
import { normalizePhone } from "@/lib/utils/number-format";
import {
  isRequired,
  isValidPhone,
  PHONE_MESSAGE,
  REQUIRED_MESSAGE,
  SELECT_REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!isRequired(fullName)) nextErrors.fullName = REQUIRED_MESSAGE;
    if (!isRequired(phone)) {
      nextErrors.phone = REQUIRED_MESSAGE;
    } else if (!isValidPhone(phone)) {
      nextErrors.phone = PHONE_MESSAGE;
    }
    if (!role) nextErrors.role = SELECT_REQUIRED_MESSAGE;
    if (!status) nextErrors.status = SELECT_REQUIRED_MESSAGE;
    if (props.mode === "create" && !isRequired(password)) {
      nextErrors.password = REQUIRED_MESSAGE;
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
          <InputField
            label="نام"
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
          <FormField label="نقش" error={errors.role}>
            <SearchableSelect
              value={role}
              onValueChange={(value) => {
                setRole(value as BackendRoleKey);
                clearError("role");
              }}
              options={ROLE_OPTIONS}
              placeholder="انتخاب نقش"
              searchPlaceholder="جستجو در نقش ها"
              emptyMessage="نقشی پیدا نشد"
              invalid={Boolean(errors.role)}
            />
          </FormField>
          <FormField label="وضعیت" error={errors.status}>
            <SearchableSelect
              value={status}
              onValueChange={(value) => {
                setStatus(value as UserStatus);
                clearError("status");
              }}
              options={statusOptions}
              placeholder="انتخاب وضعیت"
              searchPlaceholder="جستجو در وضعیت ها"
              emptyMessage="وضعیتی پیدا نشد"
              invalid={Boolean(errors.status)}
            />
          </FormField>
          <FormField
            label={props.mode === "create" ? "رمز عبور" : "رمز عبور جدید (اختیاری)"}
            error={errors.password}
            className="md:col-span-2"
          >
            <Input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearError("password");
              }}
              aria-invalid={Boolean(errors.password)}
            />
          </FormField>
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
