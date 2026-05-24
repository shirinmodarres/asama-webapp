"use client";

import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type { NajaCenterStatus } from "@/lib/models/naja-center.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";
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

export interface NajaCenterFormInput {
  name: string;
  responsibleName: string;
  phone: string;
  secondaryPhone?: string | null;
  landlinePhone?: string | null;
  province: string;
  city: string;
  county: string;
  centerCode: string;
  fullAddress: string;
  status: NajaCenterStatus;
}

interface CreateModeProps extends BaseProps {
  mode: "create";
  onSubmit: (input: NajaCenterFormInput) => void;
}

interface EditModeProps extends BaseProps {
  mode: "edit";
  initialValues: NajaCenterFormInput;
  onSubmit: (input: NajaCenterFormInput) => void;
}

type NajaCenterFormProps = CreateModeProps | EditModeProps;

export function NajaCenterForm(props: NajaCenterFormProps) {
  const [name, setName] = useState(
    props.mode === "edit" ? props.initialValues.name : "",
  );
  const [responsibleName, setResponsibleName] = useState(
    props.mode === "edit" ? props.initialValues.responsibleName : "",
  );
  const [phone, setPhone] = useState(
    props.mode === "edit" ? props.initialValues.phone : "",
  );
  const [secondaryPhone, setSecondaryPhone] = useState(
    props.mode === "edit" ? (props.initialValues.secondaryPhone ?? "") : "",
  );
  const [landlinePhone, setLandlinePhone] = useState(
    props.mode === "edit" ? (props.initialValues.landlinePhone ?? "") : "",
  );
  const [province, setProvince] = useState(
    props.mode === "edit" ? props.initialValues.province : "",
  );
  const [city, setCity] = useState(
    props.mode === "edit" ? props.initialValues.city : "",
  );
  const [county, setCounty] = useState(
    props.mode === "edit" ? props.initialValues.county : "",
  );
  const [centerCode, setCenterCode] = useState(
    props.mode === "edit" ? props.initialValues.centerCode : "",
  );
  const [fullAddress, setFullAddress] = useState(
    props.mode === "edit" ? props.initialValues.fullAddress : "",
  );
  const [status, setStatus] = useState<NajaCenterStatus>(
    props.mode === "edit" ? props.initialValues.status : "active",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!isRequired(name)) nextErrors.name = REQUIRED_MESSAGE;
    if (!isRequired(centerCode)) nextErrors.centerCode = REQUIRED_MESSAGE;
    if (!isRequired(responsibleName)) nextErrors.responsibleName = REQUIRED_MESSAGE;
    if (!isRequired(phone)) {
      nextErrors.phone = REQUIRED_MESSAGE;
    } else if (!isValidPhone(phone)) {
      nextErrors.phone = PHONE_MESSAGE;
    }
    if (secondaryPhone && !isValidPhone(secondaryPhone)) {
      nextErrors.secondaryPhone = PHONE_MESSAGE;
    }
    if (!isRequired(province)) nextErrors.province = REQUIRED_MESSAGE;
    if (!isRequired(city)) nextErrors.city = REQUIRED_MESSAGE;
    if (!isRequired(county)) nextErrors.county = REQUIRED_MESSAGE;
    if (!isRequired(fullAddress)) nextErrors.fullAddress = REQUIRED_MESSAGE;
    if (!status) nextErrors.status = SELECT_REQUIRED_MESSAGE;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!validate()) return;
        props.onSubmit({
          name: name.trim(),
          responsibleName: responsibleName.trim(),
          phone: normalizePhone(phone),
          secondaryPhone: secondaryPhone ? normalizePhone(secondaryPhone) : null,
          landlinePhone: landlinePhone ? normalizeDigits(landlinePhone.trim()) : null,
          province: province.trim(),
          city: city.trim(),
          county: county.trim(),
          centerCode: normalizeDigits(centerCode.trim()),
          fullAddress: fullAddress.trim(),
          status,
        });
      }}
      className="contents"
    >
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="نام مرکز"
            value={name}
            onChange={(value) => {
              setName(value);
              clearError("name");
            }}
            error={errors.name}
          />
          <InputField
            label="نام مسئول"
            value={responsibleName}
            onChange={(value) => {
              setResponsibleName(value);
              clearError("responsibleName");
            }}
            error={errors.responsibleName}
          />
          <InputField
            label="شماره همراه"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              clearError("phone");
            }}
            error={errors.phone}
          />
          <InputField
            label="شماره همراه دوم (اختیاری)"
            value={secondaryPhone}
            onChange={(value) => {
              setSecondaryPhone(value);
              clearError("secondaryPhone");
            }}
            required={false}
            error={errors.secondaryPhone}
          />
          <InputField
            label="شماره تلفن ثابت (اختیاری)"
            value={landlinePhone}
            onChange={setLandlinePhone}
            required={false}
          />
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
            error={errors.county}
          />
          <InputField
            label="کدپستی مرکز"
            value={centerCode}
            onChange={(value) => {
              setCenterCode(value);
              clearError("centerCode");
            }}
            error={errors.centerCode}
          />
          <FormField label="وضعیت" error={errors.status}>
            <SearchableSelect
              value={status}
              onValueChange={(value) => {
                setStatus(value as NajaCenterStatus);
                clearError("status");
              }}
              options={[
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
              ]}
              placeholder="انتخاب وضعیت"
              searchPlaceholder="جستجو در وضعیت ها"
              emptyMessage="وضعیتی پیدا نشد"
              invalid={Boolean(errors.status)}
            />
          </FormField>
        </div>

        <label className="mt-4 grid gap-2 text-sm font-medium text-[#334155]">
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

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={props.isSubmitting}>
            {props.isSubmitting
              ? "در حال ثبت..."
              : props.mode === "create"
                ? "ثبت مرکز ناجا"
                : "ذخیره تغییرات"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={props.onCancel}
            disabled={props.isSubmitting}
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
