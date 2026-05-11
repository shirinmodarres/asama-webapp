"use client";

import { useState } from "react";
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

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
          {props.mode === "create" ? (
            <InputField label="شناسه کالا" value={id} onChange={setId} />
          ) : null}
          <InputField label="نام کالا" value={name} onChange={setName} />
          <InputField label="برند" value={brand} onChange={setBrand} />
          <InputField label="دسته بندی" value={category} onChange={setCategory} />
          <InputField label="واحد فروش" value={unit} onChange={setUnit} />
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>قیمت واحد</span>
            <Input
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
              inputMode="numeric"
              required
            />
          </label>

          {props.mode === "create" ? (
            <>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>موجودی اولیه</span>
                <Input
                  value={totalStock}
                  onChange={(event) => setTotalStock(event.target.value)}
                  inputMode="numeric"
                  required
                />
              </label>
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
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={props.isSubmitting}>
            {props.isSubmitting
              ? "در حال ثبت..."
              : props.mode === "create"
                ? "ثبت کالا"
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
