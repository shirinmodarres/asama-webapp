"use client";

import { useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProvinceCitySelector } from "@/components/customer/province-city-selector";
import { toast } from "@/components/ui/sonner";
import { getErrorMessage } from "@/lib/api/api-error";
import {
  reconcileStoreCustomerRegistration,
  registerStoreCustomer,
  type StoreCustomerRegistrationResult,
} from "@/lib/services/store-expert-customer.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { JalaliDateInput } from "../shared/jalali-date-input";

type CustomerKind = "individual" | "legal";
type AddressDraft = {
  id: string;
  title: string;
  address: string;
  postalCode: string;
  province: string;
  city: string;
  primary: boolean;
};

const STORE_GROUPS = [
  { value: "846", label: "ماد سنتر" },
  { value: "848", label: "ماد سنتر/پرسنل" },
  { value: "850", label: "ماد سنتر/سایر" },
  { value: "849", label: "ماد سنتر/مصرف‌کننده" },
] as const;

const newOperationKey = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
};
const blankAddress = (primary = false): AddressDraft => ({
  id: newOperationKey(),
  title: "",
  address: "",
  postalCode: "",
  province: "",
  city: "",
  primary,
});

export function StoreCustomerRegistrationForm() {
  const [kind, setKind] = useState<CustomerKind>("individual");
  const [groupingRef, setGroupingRef] = useState("846");
  const [addresses, setAddresses] = useState<AddressDraft[]>([
    blankAddress(true),
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [operationKey, setOperationKey] = useState(newOperationKey);
  const [result, setResult] = useState<StoreCustomerRegistrationResult | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [individual, setIndividual] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    economicCode: "",
    birthDate: "",
    phone: "",
  });
  const [legal, setLegal] = useState({
    companyName: "",
    nationalIdentifier: "",
    economicCode: "",
    phone: "",
  });

  const updateAddress = (id: string, patch: Partial<AddressDraft>) =>
    setAddresses((current) =>
      current.map((address) =>
        address.id === id
          ? { ...address, ...patch }
          : patch.primary
            ? { ...address, primary: false }
            : address,
      ),
    );
  const validate = () => {
    const next: Record<string, string> = {};
    if (kind === "individual" && !individual.firstName.trim())
      next.firstName = "نام الزامی است.";
    if (kind === "individual" && !individual.lastName.trim())
      next.lastName = "نام خانوادگی الزامی است.";
    if (kind === "legal" && !legal.companyName.trim())
      next.companyName = "نام شرکت الزامی است.";
    addresses.forEach((address) => {
      if (!address.address.trim())
        next[`address-${address.id}`] = "آدرس الزامی است.";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const next = await registerStoreCustomer({
        operationKey,
        customerType: kind,
        groupingRef: Number(groupingRef),
        ...individual,
        ...legal,
        addresses: addresses.map((address) => ({
          title: address.title,
          address: address.address,
          postalCode: address.postalCode,
          province: address.province,
          city: address.city,
          isMain: address.primary,
        })),
      });
      setResult(next);
      if (next.status === "completed") {
        toast.success("مشتری در سپیدار ثبت شد.");
        setOperationKey(newOperationKey());
      } else {
        toast.error("نتیجه ثبت نیاز به بررسی دارد؛ درخواست دوباره ارسال نشد.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      setOperationKey(newOperationKey());
    } finally {
      setIsSubmitting(false);
    }
  };

  const reconcile = async () => {
    if (!result || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const next = await reconcileStoreCustomerRegistration(
        result.operationKey,
      );
      setResult(next);
      if (next.status === "completed")
        toast.success("ثبت مشتری تأیید و در پنل ذخیره شد.");
      else toast.error("هنوز نتیجه قطعی سپیدار پیدا نشد؛ ثبت جدیدی ارسال نشد.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="space-y-6"
    >
      <Card className="p-5">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-[#102034]">
            مشخصات مشتری
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            نوع مشتری، گروه مادسنتر و اطلاعات هویتی را وارد کنید.
          </p>
        </div>
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <FormField label="گروه مشتری *">
            <SearchableSelect
              value={groupingRef}
              onValueChange={setGroupingRef}
              options={STORE_GROUPS.map((group) => ({
                value: group.value,
                label: group.label,
              }))}
              placeholder="انتخاب گروه مشتری"
              searchPlaceholder="جستجوی گروه..."
              emptyMessage="گروهی پیدا نشد"
            />
          </FormField>
        </div>
        <div
          dir="rtl"
          className="relative mb-5 grid grid-cols-2 rounded-xl bg-[#F1F5F9] p-1"
        >
          {/* پس‌زمینه متحرک */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-1 top-1 right-1 w-[calc(50%-4px)] rounded-lg bg-[#102034] shadow-sm transition-transform duration-300 ease-in-out ${
              kind === "individual" ? "translate-x-0" : "-translate-x-full"
            }`}
          />

          <button
            type="button"
            onClick={() => setKind("individual")}
            className={`relative z-10 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
              kind === "individual"
                ? "text-white"
                : "text-[#64748B] hover:text-[#102034]"
            }`}
          >
            حقیقی
          </button>

          <button
            type="button"
            onClick={() => setKind("legal")}
            className={`relative z-10 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
              kind === "legal"
                ? "text-white"
                : "text-[#64748B] hover:text-[#102034]"
            }`}
          >
            حقوقی
          </button>
        </div>
        {kind === "individual" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="نام"
              required
              value={individual.firstName}
              error={errors.firstName}
              onChange={(value) =>
                setIndividual({ ...individual, firstName: value })
              }
            />
            <Field
              label="نام خانوادگی"
              required
              value={individual.lastName}
              error={errors.lastName}
              onChange={(value) =>
                setIndividual({ ...individual, lastName: value })
              }
            />
            <Field
              label="کد ملی"
              value={individual.nationalId}
              onChange={(value) =>
                setIndividual({ ...individual, nationalId: value })
              }
              type="number"
            />
            <Field
              label="کد اقتصادی"
              value={individual.economicCode}
              onChange={(value) =>
                setIndividual({ ...individual, economicCode: value })
              }
              type="number"
            />
            <JalaliDateInput
              label="تاریخ تولد"
              value={individual.birthDate}
              onChange={(value) =>
                setIndividual({ ...individual, birthDate: value })
              }
              placeholder="انتخاب تاریخ تولد"
            />
            <Field
              label="شماره تلفن"
              value={individual.phone}
              onChange={(value) =>
                setIndividual({ ...individual, phone: value })
              }
              type="tel"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="نام شرکت"
              required
              value={legal.companyName}
              error={errors.companyName}
              onChange={(value) => setLegal({ ...legal, companyName: value })}
            />
            <Field
              label="شناسه ملی"
              value={legal.nationalIdentifier}
              onChange={(value) =>
                setLegal({ ...legal, nationalIdentifier: value })
              }
              type="number"
            />
            <Field
              label="کد اقتصادی"
              value={legal.economicCode}
              onChange={(value) => setLegal({ ...legal, economicCode: value })}
              type="number"
            />
            <Field
              label="شماره تلفن"
              value={legal.phone}
              onChange={(value) => setLegal({ ...legal, phone: value })}
              type="tel"
            />
          </div>
        )}
      </Card>
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#102034]">آدرس‌ها</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              یک آدرس اصلی را مشخص کنید.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setAddresses((current) => [...current, blankAddress()])
            }
          >
            <Plus />
            افزودن آدرس
          </Button>
        </div>
        <div className="space-y-4">
          {addresses.map((address, index) => (
            <div
              key={address.id}
              className="rounded-xl border border-[#E5E7EB] p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#334155]">
                  آدرس {(index + 1).toLocaleString("fa-IR")}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={address.primary ? "secondary" : "outline"}
                    onClick={() => updateAddress(address.id, { primary: true })}
                  >
                    {address.primary ? "آدرس اصلی" : "انتخاب به‌عنوان اصلی"}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="حذف آدرس"
                    disabled={addresses.length === 1}
                    onClick={() =>
                      setAddresses((current) =>
                        current.filter((item) => item.id !== address.id),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="عنوان آدرس"
                  value={address.title}
                  onChange={(value) =>
                    updateAddress(address.id, { title: value })
                  }
                />
                <Field
                  label="کد پستی"
                  value={address.postalCode}
                  onChange={(value) =>
                    updateAddress(address.id, { postalCode: value })
                  }
                  type="number"
                />
              </div>
              <div className="mt-4">
                <ProvinceCitySelector
                  province={address.province}
                  city={address.city}
                  onChange={(value) => updateAddress(address.id, value)}
                />
              </div>
              <div className="mt-4">
                <FormField
                  label="آدرس *"
                  error={errors[`address-${address.id}`]}
                >
                  <Textarea
                    value={address.address}
                    onChange={(event) =>
                      updateAddress(address.id, { address: event.target.value })
                    }
                    aria-invalid={Boolean(errors[`address-${address.id}`])}
                  />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6B7280]">
          ثبت مشتری به‌صورت مستقیم در سپیدار انجام می‌شود. استان و شهر فقط در
          پنل نگهداری می‌شوند.
        </div>
        <Button
          type="submit"
          disabled={isSubmitting || result?.status === "completed"}
        >
          {isSubmitting ? "در حال ثبت..." : "ثبت مشتری"}
        </Button>
      </Card>
      {result ? (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#475569]">
            {result.status === "completed"
              ? `مشتری با شناسه سپیدار ${result.sepidarCustomerId ?? "-"} ثبت شد.`
              : result.errorMessage || "وضعیت ثبت نیازمند بررسی است."}
          </p>
          {result.canReconcile ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => void reconcile()}
            >
              <RefreshCw className="size-4" />
              بررسی نتیجه ثبت
            </Button>
          ) : null}
        </Card>
      ) : null}
    </form>
  );
}

function Field({
  label,
  required = false,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <FormField label={required ? `${label} *` : label} error={error}>
      <Input
        type={type}
        inputMode={type === "tel" ? "numeric" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      />
    </FormField>
  );
}
