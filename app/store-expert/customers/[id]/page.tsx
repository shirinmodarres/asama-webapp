"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Card } from "@/components/ui/card";
import { httpClient } from "@/lib/api/http-client";
import { getErrorMessage } from "@/lib/api/api-error";
import { mapCustomerDto } from "@/lib/mappers/customer.mapper";
import type { Customer } from "@/lib/models/customer.model";

export default function StoreExpertCustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void params.then(async ({ id }) => { try { setCustomer(mapCustomerDto(await httpClient.get(`/api/store-expert/customers/${id}`))); } catch (loadError) { setError(getErrorMessage(loadError)); } }); }, [params]);
  return <DashboardLayout role="store-expert" title="جزئیات مشتری"><SectionHeader title="جزئیات مشتری" />{error ? <PageErrorMessage title="دریافت مشتری انجام نشد" message={error} /> : !customer ? <LoadingState title="در حال دریافت مشتری" /> : <div className="grid gap-4 md:grid-cols-2"><Card className="p-5"><h2 className="font-semibold">{customer.fullName}</h2><dl className="mt-4 grid gap-3 text-sm text-[#475569]"><Info label="کد سپیدار" value={customer.sepidarCustomerCode} /><Info label="تلفن" value={customer.phone} /><Info label="گروه مشتری" value={customer.grouping?.title} /><Info label="کانال" value={customer.channel} /><Info label="زیرکانال" value={customer.subChannel} /></dl></Card><Card className="p-5"><h2 className="font-semibold">آدرس‌ها</h2>{customer.sepidarAddresses.length ? <ul className="mt-4 space-y-3 text-sm text-[#475569]">{customer.sepidarAddresses.map((address) => <li key={address.objectId || address.id}>{address.title}: {address.address || "-"}</li>)}</ul> : <EmptyState title="آدرسی ثبت نشده است" description="برای این مشتری آدرسی از سپیدار دریافت نشده است." />}</Card></div>}</DashboardLayout>;
}

function Info({ label, value }: { label: string; value?: string | null }) { return <div className="flex justify-between gap-4"><dt>{label}</dt><dd className="font-medium text-[#102034]">{value || "-"}</dd></div>; }
