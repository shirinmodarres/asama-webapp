"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type { NajaCenterStatus } from "@/lib/models/naja-center.model";

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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit({
          name,
          responsibleName,
          phone,
          secondaryPhone: secondaryPhone.trim() || null,
          landlinePhone: landlinePhone.trim() || null,
          province,
          city,
          county,
          centerCode,
          fullAddress,
          status,
        });
      }}
      className="contents"
    >
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="نام مرکز" value={name} onChange={setName} />
          <InputField
            label="نام مسئول"
            value={responsibleName}
            onChange={setResponsibleName}
          />
          <InputField label="شماره همراه" value={phone} onChange={setPhone} />
          <InputField
            label="شماره همراه دوم (اختیاری)"
            value={secondaryPhone}
            onChange={setSecondaryPhone}
            required={false}
          />
          <InputField
            label="شماره تلفن ثابت (اختیاری)"
            value={landlinePhone}
            onChange={setLandlinePhone}
            required={false}
          />
          <InputField label="استان" value={province} onChange={setProvince} />
          <InputField label="شهر" value={city} onChange={setCity} />
          <InputField label="شهرستان" value={county} onChange={setCounty} />
          <InputField
            label="کدپستی مرکز"
            value={centerCode}
            onChange={setCenterCode}
          />
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>وضعیت</span>
            <SearchableSelect
              value={status}
              onValueChange={(value) => setStatus(value as NajaCenterStatus)}
              options={[
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
              ]}
              placeholder="انتخاب وضعیت"
              searchPlaceholder="جستجو در وضعیت ها"
              emptyMessage="وضعیتی پیدا نشد"
            />
          </label>
        </div>

        <label className="mt-4 grid gap-2 text-sm font-medium text-[#334155]">
          <span>آدرس کامل</span>
          <Textarea
            value={fullAddress}
            onChange={(event) => setFullAddress(event.target.value)}
            required
          />
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
