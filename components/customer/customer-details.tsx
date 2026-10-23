import { CalendarClock, MapPin, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Customer } from "@/lib/models/customer.model";
import { formatDeliveryAddress } from "@/lib/utils/address-format";
import { formatJalaliDateTime } from "@/lib/utils/date-format";
import { formatFaDigits } from "@/lib/utils/number-format";

export function CustomerDetails({ customer }: { customer: Customer }) {
  const addresses = customer.addresses.length ? customer.addresses : customer.sepidarAddresses;
  return <div className="space-y-6">
    <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E9EEF3] pb-5"><div><h2 className="text-lg font-bold text-[#102034]">{customer.fullName || "-"}</h2><p className="mt-2 text-sm text-[#64748B]">کد سپیدار: {customer.sepidarCustomerCode ? formatFaDigits(customer.sepidarCustomerCode) : "-"}</p></div><Badge variant={customer.status === "active" ? "success" : "neutral"} dot>{customer.status === "active" ? "فعال" : "غیرفعال"}</Badge></div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Info label="تلفن" value={customer.phone ? formatFaDigits(customer.phone) : "-"} icon={<Phone className="size-4" />} /><Info label="موبایل" value={customer.mobile ? formatFaDigits(customer.mobile) : "-"} icon={<Phone className="size-4" />} /><Info label="کد/شناسه ملی" value={customer.nationalId ? formatFaDigits(customer.nationalId) : "-"} icon={<UserRound className="size-4" />} /><Info label="کارشناس فروش" value={customer.assignedExpertName || "-"} icon={<UserRound className="size-4" />} /></div></Card>
    <section className="grid gap-6 xl:grid-cols-2"><DetailsCard title="دسته‌بندی فروش"><Info label="گروه مشتری" value={customer.grouping?.title || "-"} /><Info label="کد گروه" value={customer.grouping?.code || "-"} /><Info label="کانال" value={customer.channel || "-"} /><Info label="زیرکانال" value={customer.subChannel || "-"} /></DetailsCard><DetailsCard title="همگام‌سازی سپیدار"><Info label="وضعیت" value={customer.isSyncedFromSepidar ? "همگام‌سازی شده" : "ثبت داخلی"} /><Info label="آخرین همگام‌سازی" value={customer.lastSepidarSyncAt ? formatJalaliDateTime(customer.lastSepidarSyncAt) : "-"} icon={<CalendarClock className="size-4" />} /><Info label="شناسه سپیدار" value={customer.sepidarCustomerId ? formatFaDigits(customer.sepidarCustomerId) : "-"} /></DetailsCard></section>
    <DetailsCard title="لیست‌های قیمت"><div className="flex flex-wrap gap-2">{customer.priceLists.length ? customer.priceLists.map((priceList) => <Badge key={priceList.objectId} variant="neutral">{priceList.name || priceList.title || "بدون عنوان"}</Badge>) : <span className="text-sm text-[#64748B]">لیست قیمت اختصاصی ثبت نشده است.</span>}</div></DetailsCard>
    <DetailsCard title="آدرس‌ها">{addresses.length ? <div className="grid gap-3">{addresses.map((address) => <div key={address.objectId || address.id} className="rounded-lg border border-[#E5E7EB] bg-[#FBFCFD] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-[#1F3A5F]">{address.title || "آدرس"}</p>{address.isDefault ? <Badge variant="success">پیش‌فرض</Badge> : null}</div><p className="mt-2 text-sm leading-7 text-[#475569]">{formatDeliveryAddress(address) || "-"}</p></div>)}</div> : <div className="flex items-center gap-2 text-sm text-[#64748B]"><MapPin className="size-4" />آدرسی برای این مشتری ثبت نشده است.</div>}</DetailsCard>
  </div>;
}

function DetailsCard({ title, children }: { title: string; children: ReactNode }) { return <Card className="p-5"><h3 className="text-base font-semibold text-[#102034]">{title}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div></Card>; }
function Info({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) { return <div className="min-w-0"><p className="flex items-center gap-2 text-xs font-medium text-[#64748B]">{icon}{label}</p><p className="mt-1.5 break-words text-sm font-semibold text-[#334155]">{value}</p></div>; }
