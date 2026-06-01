"use client";

import { useState } from "react";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatFaNumber, toNumber } from "@/lib/utils/number-format";
import {
  isNonNegativeNumber,
  isRequired,
  NON_NEGATIVE_NUMBER_MESSAGE,
  REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";

interface BaseProps {
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface CreateProductFormInput {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  unitPrice: number;
  totalStock: number;
  description?: string;
  status: "active" | "inactive";
}

export interface UpdateProductFormInput {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  unitPrice: number;
  description?: string;
  status: "active" | "inactive";
}

interface CreateModeProps extends BaseProps {
  mode: "create";
  onSubmit: (input: CreateProductFormInput) => void;
}

interface EditModeProps extends BaseProps {
  mode: "edit";
  readOnlyMasterData?: boolean;
  initialValues: {
    id: string;
    name: string;
    brand: string;
    category: string;
    unit: string;
    unitPrice: number;
    description?: string;
    status: "active" | "inactive";
  };
  onSubmit: (input: UpdateProductFormInput) => void;
}

type ProductFormProps = CreateModeProps | EditModeProps;

export function ProductForm(props: ProductFormProps) {
  const isReadOnlyMasterData =
    props.mode === "edit" && props.readOnlyMasterData === true;
  const [id, setId] = useState(
    props.mode === "edit" ? props.initialValues.id : "",
  );
  const [name, setName] = useState(
    props.mode === "edit" ? props.initialValues.name : "",
  );
  const [brand, setBrand] = useState(
    props.mode === "edit" ? props.initialValues.brand : "",
  );
  const [category, setCategory] = useState(
    props.mode === "edit" ? props.initialValues.category : "",
  );
  const [description, setDescription] = useState(
    props.mode === "edit" ? (props.initialValues.description ?? "") : "",
  );
  const [unit, setUnit] = useState(
    props.mode === "edit" ? props.initialValues.unit : "دستگاه",
  );
  const [unitPrice, setUnitPrice] = useState(
    props.mode === "edit" ? formatFaNumber(props.initialValues.unitPrice) : "",
  );
  const [totalStock, setTotalStock] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">(
    props.mode === "edit" ? props.initialValues.status : "active",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (props.mode === "create" && !isRequired(id)) {
      nextErrors.id = REQUIRED_MESSAGE;
    }
    if (!isRequired(name)) nextErrors.name = REQUIRED_MESSAGE;
    if (!isRequired(unit)) nextErrors.unit = REQUIRED_MESSAGE;
    if (!isRequired(unitPrice)) {
      nextErrors.unitPrice = REQUIRED_MESSAGE;
    } else if (!isNonNegativeNumber(unitPrice)) {
      nextErrors.unitPrice = NON_NEGATIVE_NUMBER_MESSAGE;
    }
    if (props.mode === "create") {
      if (!isRequired(totalStock)) {
        nextErrors.totalStock = REQUIRED_MESSAGE;
      } else if (!isNonNegativeNumber(totalStock)) {
        nextErrors.totalStock = NON_NEGATIVE_NUMBER_MESSAGE;
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

        if (props.mode === "create") {
          props.onSubmit({
            id,
            name,
            brand,
            category,
            unit,
            unitPrice: toNumber(unitPrice),
            totalStock: toNumber(totalStock),
            description,
            status,
          });
          return;
        }

        props.onSubmit({
          id: props.initialValues.id,
          name,
          brand,
          category,
          unit,
          unitPrice: toNumber(unitPrice),
          description,
          status,
        });
      }}
      className="contents"
    >
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {props.mode === "create" || isReadOnlyMasterData ? (
            <InputField
              label="شناسه کالا"
              value={id}
              onChange={(value) => {
                setId(value);
                clearError("id");
              }}
              error={errors.id}
              disabled={isReadOnlyMasterData}
            />
          ) : null}
          <InputField
            label="نام کالا"
            value={name}
            onChange={(value) => {
              setName(value);
              clearError("name");
            }}
            error={errors.name}
            disabled={isReadOnlyMasterData}
          />
          <InputField label="برند" value={brand} onChange={setBrand} disabled={isReadOnlyMasterData} />
          <InputField label="دسته بندی" value={category} onChange={setCategory} disabled={isReadOnlyMasterData} />
          <InputField
            label="واحد فروش"
            value={unit}
            onChange={(value) => {
              setUnit(value);
              clearError("unit");
            }}
            error={errors.unit}
            disabled={isReadOnlyMasterData}
          />
          <FormField label="قیمت واحد" error={errors.unitPrice}>
            <Input
              value={unitPrice}
              onChange={(event) => {
                setUnitPrice(event.target.value);
                clearError("unitPrice");
              }}
              inputMode="numeric"
              aria-invalid={Boolean(errors.unitPrice)}
              disabled={isReadOnlyMasterData}
            />
          </FormField>

          {props.mode === "create" ? (
            <>
              <FormField label="موجودی فروش اولیه" error={errors.totalStock}>
                <Input
                  value={totalStock}
                  onChange={(event) => {
                    setTotalStock(event.target.value);
                    clearError("totalStock");
                  }}
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.totalStock)}
                />
              </FormField>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>وضعیت</span>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as "active" | "inactive")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="وضعیت کالا" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </>
          ) : (
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>وضعیت</span>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as "active" | "inactive")
                }
                disabled={isReadOnlyMasterData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="وضعیت کالا" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </label>
          )}
        </div>

        <label className="mt-4 grid gap-2 text-sm font-medium text-[#334155]">
          <span>توضیحات کوتاه</span>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28"
            disabled={isReadOnlyMasterData}
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          {!isReadOnlyMasterData ? (
            <Button type="submit" disabled={props.isSubmitting}>
              {props.isSubmitting
                ? "در حال ثبت..."
                : props.mode === "create"
                  ? "ثبت کالا"
                  : "ذخیره تغییرات"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={props.onCancel}
            disabled={props.isSubmitting}
          >
            {isReadOnlyMasterData ? "بازگشت" : "انصراف"}
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <FormField label={label} error={error}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        disabled={disabled}
      />
    </FormField>
  );
}
