"use client";

import Link from "next/link";
import { ArrowRight, Building2, CreditCard, MapPin, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { httpClient } from "@/lib/api/http-client";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatDate } from "@/lib/expert/utils";
import { mapCustomerDto } from "@/lib/mappers/customer.mapper";
import type { Customer } from "@/lib/models/customer.model";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function StoreExpertCustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void params.then(async ({ id }) => {
      try {
        const result = mapCustomerDto(await httpClient.get(`/api/store-expert/customers/${id}`));
        if (active) setCustomer(result);
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      }
    });
    return () => { active = false; };
  }, [params]);

  return (
    <DashboardLayout role="store-expert" title="جزئیات مشتری">
      <SectionHeader
        title={customer?.fullName || "جزئیات مشتری"}
        description="اطلاعات ثبت‌شده و آخرین داده‌ی همگام‌شده از سپیدار"
        actions={<Link href="/store-expert/customers" className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-medium text-[var(--foreground)] hover:bg-muted"><ArrowRight className="size-4" />بازگشت</Link>}
      />
      {error ? <PageErrorMessage title="دریافت مشتری انجام نشد" message={error} /> : !customer ? <LoadingState title="در حال دریافت مشتری" /> : <CustomerDetails customer={customer} />}
    </DashboardLayout>
  );
}

function CustomerDetails({ customer }: { customer: Customer }) {
  const details = customer.sepidarDetails || {
    title: null, code: null, customerType: null, name: null, lastName: null,
    birthDate: null, nationalId: null, economicCode: null, registrationCode: null,
    version: null, groupingRef: null, discountRate: null, accountingRemainder: null,
    creditRemainder: null, remainderWithoutCheque: null,
  };
  const customerType = details.customerType === 2 ? "حقوقی" : details.customerType === 1 ? "حقیقی" : "ثبت نشده";
  return <div className="space-y-5">
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"><UserRound className="size-5" /></span><div><h2 className="font-semibold text-foreground">{customer.fullName}</h2><p className="mt-1 text-sm text-muted-foreground">کد سپیدار: {formatFaDigits(customer.sepidarCustomerCode || details.code || "-")}</p></div></div><Badge variant={customer.status === "active" ? "success" : "neutral"}>{customer.statusLabel}</Badge></div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><Info label="نوع مشتری" value={customerType} /><Info label="تلفن" value={formatFaDigits(customer.phone || customer.mobile || "-")} /><Info label="کد ملی / شناسه ملی" value={formatFaDigits(details.nationalId || customer.nationalId || "-")} /><Info label="کد اقتصادی" value={formatFaDigits(details.economicCode || "-")} /><Info label="شماره ثبت" value={formatFaDigits(details.registrationCode || "-")} /><Info label="تاریخ تولد" value={details.birthDate ? formatDate(details.birthDate) : "-"} /></dl>
      </Card>
      <Card className="p-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"><Building2 className="size-5" /></span><div><h2 className="font-semibold text-foreground">طبقه‌بندی فروش</h2><p className="mt-1 text-sm text-muted-foreground">مسیر دسترسی مادسنتر</p></div></div><dl className="mt-5 grid gap-3"><Info label="گروه مشتری" value={customer.grouping?.title || "-"} /><Info label="کانال" value={customer.channel || "-"} /><Info label="زیرکانال" value={customer.subChannel || "-"} /><Info label="کارشناس" value={customer.assignedExpertName || "کارشناس فروشگاه"} /></dl></Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"><CreditCard className="size-5" /></span><div><h2 className="font-semibold text-foreground">وضعیت مالی سپیدار</h2><p className="mt-1 text-sm text-muted-foreground">آخرین مقادیر دریافت‌شده از سپیدار</p></div></div><dl className="mt-5 grid gap-3 sm:grid-cols-3"><Info label="مانده حساب" value={money(details.accountingRemainder)} /><Info label="اعتبار مشتری" value={money(details.creditRemainder)} /><Info label="مانده بدون چک" value={money(details.remainderWithoutCheque)} /><Info label="نرخ تخفیف" value={details.discountRate === null ? "-" : `${formatFaDigits(details.discountRate)}٪`} /><Info label="شناسه مشتری سپیدار" value={formatFaDigits(customer.sepidarCustomerId || "-")} /><Info label="نسخه اطلاعات" value={formatFaDigits(details.version ?? "-")} /></dl></Card>
      <Card className="p-5"><h2 className="font-semibold text-foreground">همگام‌سازی</h2><dl className="mt-5 grid gap-3"><Info label="GUID سپیدار" value={customer.sepidarGuid || "-"} /><Info label="آخرین همگام‌سازی" value={customer.lastSepidarSyncAt ? formatDate(customer.lastSepidarSyncAt) : "ثبت نشده"} /><Info label="شناسه گروه" value={formatFaDigits(details.groupingRef ?? customer.grouping?.sepidarGroupingId ?? "-")} /></dl></Card>
    </div>
    <Card className="p-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"><MapPin className="size-5" /></span><div><h2 className="font-semibold text-foreground">آدرس‌ها</h2><p className="mt-1 text-sm text-muted-foreground">آدرس‌های ثبت‌شده در سپیدار</p></div></div>{customer.sepidarAddresses.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{customer.sepidarAddresses.map((address, index) => <div key={address.objectId || address.id || String(index)} className="rounded-lg border border-[var(--border)] p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-foreground">{address.title || `آدرس ${formatFaDigits(index + 1)}`}</p>{address.isMain ? <Badge variant="success">اصلی</Badge> : null}</div><p className="mt-3 text-sm leading-7 text-muted-foreground">{address.fullAddress || address.address || "ثبت نشده"}</p><div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><span>کدپستی: {formatFaDigits(address.postalCode || address.zipCode || "-")}</span><span>شهر: {address.cityTitle || address.city || "ثبت نشده"}{address.cityRef ? ` (${formatFaDigits(address.cityRef)})` : ""}</span></div></div>)}</div> : <div className="mt-5"><EmptyState title="آدرسی ثبت نشده است" description="در آخرین همگام‌سازی سپیدار آدرسی برای این مشتری دریافت نشده است." /></div>}</Card>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[var(--border)] bg-muted/30 p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd></div>;
}

function money(value: number | null): string {
  return value === null ? "-" : formatCurrency(value);
}
