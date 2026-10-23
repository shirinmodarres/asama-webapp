"use client";

import { ArrowRight, CalendarClock, MapPin, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Customer } from "@/lib/models/customer.model";
import { getCustomer } from "@/lib/services/customer.service";
import { getAssignedCustomerDetailsForExpert } from "@/lib/services/expert-customer.service";
import { formatDeliveryAddress } from "@/lib/utils/address-format";
import { formatJalaliDateTime } from "@/lib/utils/date-format";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ExpertCustomerDetailsPage() {
  const params = useParams<{ objectId: string }>();
  const objectId = decodeURIComponent(params.objectId);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadCustomer() {
      setIsLoading(true);
      setError("");
      try {
        const [baseCustomer, assignedCustomer] = await Promise.all([
          getCustomer(objectId),
          getAssignedCustomerDetailsForExpert(objectId),
        ]);
        if (mounted) {
          setCustomer({
            ...baseCustomer,
            ...assignedCustomer,
            addresses: baseCustomer.addresses,
            defaultAddress: baseCustomer.defaultAddress,
            sepidarAddress: baseCustomer.sepidarAddress,
            sepidarAddresses: baseCustomer.sepidarAddresses,
            grouping: assignedCustomer.grouping ?? baseCustomer.grouping,
            channel: assignedCustomer.channel ?? baseCustomer.channel,
            subChannel: assignedCustomer.subChannel ?? baseCustomer.subChannel,
          });
        }
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadCustomer();
    return () => { mounted = false; };
  }, [objectId]);

  return <DashboardLayout role="expert" title="جزئیات مشتری">
    <SectionHeader title="جزئیات مشتری" description="اطلاعات سپیدار، دسته‌بندی فروش و تنظیمات اختصاصی مشتری." actions={<Button asChild variant="outline"><Link href="/expert/customers"><ArrowRight className="size-4" />بازگشت</Link></Button>} />
    {isLoading ? <LoadingState title="در حال دریافت اطلاعات مشتری" /> : error ? <PageErrorMessage title="دریافت اطلاعات مشتری انجام نشد" message={error} /> : !customer ? <EmptyState title="مشتری پیدا نشد" description="شناسه مشتری معتبر نیست یا به شما اختصاص ندارد." /> : <CustomerDetails customer={customer} />}
  </DashboardLayout>;
}

function CustomerDetails({ customer }: { customer: Customer }) {
  const addresses = customer.addresses.length ? customer.addresses : customer.sepidarAddresses;
  return <div className="space-y-6">
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E9EEF3] pb-5">
        <div><h2 className="text-lg font-bold text-[#102034]">{customer.fullName || "-"}</h2><p className="mt-2 text-sm text-[#64748B]">کد سپیدار: {customer.sepidarCustomerCode ? formatFaDigits(customer.sepidarCustomerCode) : "-"}</p></div>
        <Badge variant={customer.status === "active" ? "success" : "neutral"} dot>{customer.status === "active" ? "فعال" : "غیرفعال"}</Badge>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Info label="تلفن" value={customer.phone ? formatFaDigits(customer.phone) : "-"} icon={<Phone className="size-4" />} />
        <Info label="موبایل" value={customer.mobile ? formatFaDigits(customer.mobile) : "-"} icon={<Phone className="size-4" />} />
        <Info label="کد/شناسه ملی" value={customer.nationalId ? formatFaDigits(customer.nationalId) : "-"} icon={<UserRound className="size-4" />} />
        <Info label="کارشناس فروش" value={customer.assignedExpertName || "-"} icon={<UserRound className="size-4" />} />
      </div>
    </Card>
    <section className="grid gap-6 xl:grid-cols-2">
      <DetailsCard title="دسته‌بندی فروش"><Info label="گروه مشتری" value={customer.grouping?.title || "-"} /><Info label="کد گروه" value={customer.grouping?.code || "-"} /><Info label="کانال" value={customer.channel || "-"} /><Info label="زیرکانال" value={customer.subChannel || "-"} /></DetailsCard>
      <DetailsCard title="همگام‌سازی سپیدار"><Info label="وضعیت" value={customer.isSyncedFromSepidar ? "همگام‌سازی شده" : "ثبت داخلی"} /><Info label="آخرین همگام‌سازی" value={customer.lastSepidarSyncAt ? formatJalaliDateTime(customer.lastSepidarSyncAt) : "-"} icon={<CalendarClock className="size-4" />} /><Info label="شناسه سپیدار" value={customer.sepidarCustomerId ? formatFaDigits(customer.sepidarCustomerId) : "-"} /></DetailsCard>
    </section>
    <DetailsCard title="لیست‌های قیمت"><div className="flex flex-wrap gap-2">{customer.priceLists.length ? customer.priceLists.map((priceList) => <Badge key={priceList.objectId} variant="neutral">{priceList.name || priceList.title || "بدون عنوان"}</Badge>) : <span className="text-sm text-[#64748B]">لیست قیمت اختصاصی ثبت نشده است.</span>}</div></DetailsCard>
    <DetailsCard title="آدرس‌ها">{addresses.length ? <div className="grid gap-3">{addresses.map((address) => <div key={address.objectId || address.id} className="rounded-lg border border-[#E5E7EB] bg-[#FBFCFD] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-[#1F3A5F]">{address.title || "آدرس"}</p>{address.isDefault ? <Badge variant="success">پیش‌فرض</Badge> : null}</div><p className="mt-2 text-sm leading-7 text-[#475569]">{formatDeliveryAddress(address) || "-"}</p></div>)}</div> : <div className="flex items-center gap-2 text-sm text-[#64748B]"><MapPin className="size-4" />آدرسی برای این مشتری ثبت نشده است.</div>}</DetailsCard>
  </div>;
}

function DetailsCard({ title, children }: { title: string; children: React.ReactNode }) { return <Card className="p-5"><h3 className="text-base font-semibold text-[#102034]">{title}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div></Card>; }
function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="min-w-0"><p className="flex items-center gap-2 text-xs font-medium text-[#64748B]">{icon}{label}</p><p className="mt-1.5 break-words text-sm font-semibold text-[#334155]">{value}</p></div>; }
