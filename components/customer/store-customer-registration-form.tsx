"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProvinceCitySelector } from "@/components/customer/province-city-selector";

type CustomerKind = "individual" | "legal";
type AddressDraft = { id: string; title: string; address: string; postalCode: string; province: string; city: string; primary: boolean };

const blankAddress = (primary = false): AddressDraft => ({
  id: crypto.randomUUID(), title: "", address: "", postalCode: "", province: "", city: "", primary,
});

export function StoreCustomerRegistrationForm() {
  const [kind, setKind] = useState<CustomerKind>("individual");
  const [addresses, setAddresses] = useState<AddressDraft[]>([blankAddress(true)]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [individual, setIndividual] = useState({ firstName: "", lastName: "", nationalId: "", economicCode: "", birthDate: "", phone: "" });
  const [legal, setLegal] = useState({ companyName: "", nationalIdentifier: "", economicCode: "", phone: "" });

  const updateAddress = (id: string, patch: Partial<AddressDraft>) => setAddresses((current) =>
    current.map((address) => address.id === id ? { ...address, ...patch } : patch.primary ? { ...address, primary: false } : address),
  );
  const validate = () => {
    const next: Record<string, string> = {};
    if (kind === "individual" && !individual.firstName.trim()) next.firstName = "نام الزامی است.";
    if (kind === "individual" && !individual.lastName.trim()) next.lastName = "نام خانوادگی الزامی است.";
    if (kind === "legal" && !legal.companyName.trim()) next.companyName = "نام شرکت الزامی است.";
    addresses.forEach((address) => { if (!address.address.trim()) next[`address-${address.id}`] = "آدرس الزامی است."; });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return <form noValidate onSubmit={(event) => { event.preventDefault(); validate(); }} className="space-y-6">
    <Card className="p-5">
      <div className="mb-5"><h2 className="text-base font-semibold text-[#102034]">مشخصات مشتری</h2><p className="mt-1 text-sm text-[#6B7280]">نوع مشتری و اطلاعات هویتی را وارد کنید.</p></div>
      <div className="mb-5 flex gap-2 rounded-xl bg-[#F6F8FB] p-1">
        {([['individual','حقیقی'], ['legal','حقوقی']] as const).map(([value,label]) => <Button key={value} type="button" size="sm" variant={kind === value ? "default" : "ghost"} className="flex-1" onClick={() => setKind(value)}>{label}</Button>)}
      </div>
      {kind === "individual" ? <div className="grid gap-4 md:grid-cols-2">
        <Field label="نام" required value={individual.firstName} error={errors.firstName} onChange={(value) => setIndividual({ ...individual, firstName: value })} />
        <Field label="نام خانوادگی" required value={individual.lastName} error={errors.lastName} onChange={(value) => setIndividual({ ...individual, lastName: value })} />
        <Field label="کد ملی" value={individual.nationalId} onChange={(value) => setIndividual({ ...individual, nationalId: value })} />
        <Field label="کد اقتصادی" value={individual.economicCode} onChange={(value) => setIndividual({ ...individual, economicCode: value })} />
        <Field label="تاریخ تولد" type="date" value={individual.birthDate} onChange={(value) => setIndividual({ ...individual, birthDate: value })} />
        <Field label="شماره تلفن" value={individual.phone} onChange={(value) => setIndividual({ ...individual, phone: value })} />
      </div> : <div className="grid gap-4 md:grid-cols-2">
        <Field label="نام شرکت" required value={legal.companyName} error={errors.companyName} onChange={(value) => setLegal({ ...legal, companyName: value })} />
        <Field label="شناسه ملی" value={legal.nationalIdentifier} onChange={(value) => setLegal({ ...legal, nationalIdentifier: value })} />
        <Field label="کد اقتصادی" value={legal.economicCode} onChange={(value) => setLegal({ ...legal, economicCode: value })} />
        <Field label="شماره تلفن" value={legal.phone} onChange={(value) => setLegal({ ...legal, phone: value })} />
      </div>}
    </Card>
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-[#102034]">آدرس‌ها</h2><p className="mt-1 text-sm text-[#6B7280]">یک آدرس اصلی را مشخص کنید.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setAddresses((current) => [...current, blankAddress()])}><Plus />افزودن آدرس</Button></div>
      <div className="space-y-4">{addresses.map((address, index) => <div key={address.id} className="rounded-xl border border-[#E5E7EB] p-4"><div className="mb-4 flex items-center justify-between"><span className="text-sm font-semibold text-[#334155]">آدرس {index + 1}</span><div className="flex gap-2"><Button type="button" size="sm" variant={address.primary ? "secondary" : "outline"} onClick={() => updateAddress(address.id, { primary: true })}>{address.primary ? "آدرس اصلی" : "انتخاب به‌عنوان اصلی"}</Button><Button type="button" size="icon" variant="ghost" aria-label="حذف آدرس" disabled={addresses.length === 1} onClick={() => setAddresses((current) => current.filter((item) => item.id !== address.id))}><Trash2 /></Button></div></div><div className="grid gap-4 md:grid-cols-2"><Field label="عنوان آدرس" value={address.title} onChange={(value) => updateAddress(address.id, { title: value })} /><Field label="کد پستی" value={address.postalCode} onChange={(value) => updateAddress(address.id, { postalCode: value })} /></div><div className="mt-4"><ProvinceCitySelector /></div><div className="mt-4"><FormField label="آدرس *" error={errors[`address-${address.id}`]}><Textarea value={address.address} onChange={(event) => updateAddress(address.id, { address: event.target.value })} aria-invalid={Boolean(errors[`address-${address.id}`])} /></FormField></div></div>)}</div>
    </Card>
    <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#6B7280]">اتصال به سپیدار در مرحله بعد انجام می‌شود؛ این فرم فعلاً هیچ اطلاعاتی ثبت نمی‌کند.</p><Button type="submit" disabled>ثبت مشتری</Button></Card>
  </form>;
}

function Field({ label, required = false, value, onChange, error, type = "text" }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; error?: string; type?: string }) { return <FormField label={required ? `${label} *` : label} error={error}><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} /></FormField>; }
