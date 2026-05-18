"use client";

import Link from "next/link";
import { Copy, FileText } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { ExitSlipProductGroups } from "@/components/warehouse/exit-slip-product-groups";
import { SlipDetailsCard } from "@/components/warehouse/slip-details-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { getExitSlip } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ExitSlipDetailsPage() {
  const params = useParams<{ id: string }>();
  const [slip, setSlip] = useState<ExitSlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [showCreatedMessage] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("created") === "1",
  );

  useEffect(() => {
    let isMounted = true;
    async function loadSlip() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getExitSlip(params.id);
        if (isMounted) setSlip(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadSlip();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const deliveryLink =
    slip?.deliveryLink ||
    (slip?.deliveryToken ? `/delivery/${slip.deliveryToken}` : "");
  const totalQuantity =
    slip?.items.reduce((sum, item) => sum + item.quantity, 0) ??
    slip?.units.length ??
    0;

  const getAbsoluteDeliveryLink = () =>
    typeof window !== "undefined" && deliveryLink.startsWith("/")
      ? `${window.location.origin}${deliveryLink}`
      : deliveryLink;

  const copyDeliveryLink = async () => {
    if (!deliveryLink) return;
    await navigator.clipboard.writeText(getAbsoluteDeliveryLink());
    setCopyMessage("لینک تأیید دریافت کپی شد.");
  };

  return (
    <DashboardLayout role="warehouse" title="جزئیات حواله خروج">
      {isLoading ? (
        <LoadingState title="در حال دریافت حواله خروج" />
      ) : error ? (
        <PageErrorMessage title="دریافت حواله خروج انجام نشد" message={error} />
      ) : !slip ? (
        <EmptyState
          title="حواله خروج یافت نشد"
          description="شناسه حواله معتبر نیست."
        />
      ) : (
        <>
          {showCreatedMessage ? (
            <div className="asama-banner px-4 py-3 text-sm">
              حواله خروج صادر شد و پیامک تأیید دریافت برای گیرنده ثبت/ارسال شد.
            </div>
          ) : null}
          {copyMessage ? (
            <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">
              {copyMessage}
            </div>
          ) : null}
          <SlipDetailsCard
            slipNumber={slip.slipCode || slip.id}
            orderCode={slip.orderCode}
            exitDate={slip.exitDate}
            createdBy={slip.issuedByName}
            createdAt={slip.createdAt}
            deliveredAt={slip.deliveryConfirmedAt ?? undefined}
            notes={slip.notes ?? ""}
          />
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link
                  href={`/warehouse/exit-slips/${slip.objectId || slip.id}/pdf`}
                >
                  <FileText className="size-4" />
                  مشاهده حواله خروج
                </Link>
              </Button>
            </div>
          </section>
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#1F3A5F]">
              وضعیت تحویل
            </h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="کد تحویل"
                value={
                  slip.deliveryCode ? formatFaDigits(slip.deliveryCode) : "-"
                }
              />
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
                <dt className="text-xs text-[#6B7280]">لینک تأیید دریافت</dt>
                <dd className="mt-2 flex items-center justify-between gap-3 text-sm font-medium text-[#1F3A5F]">
                  <span className="max-w-[220px] truncate text-left" dir="ltr">
                    {deliveryLink ? getAbsoluteDeliveryLink() : "-"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={copyDeliveryLink}
                    disabled={!deliveryLink}
                    aria-label="کپی لینک تأیید دریافت"
                    title="کپی لینک تأیید دریافت"
                    className="size-8"
                  >
                    <Copy className="size-4" />
                  </Button>
                </dd>
              </div>
              <InfoItem
                label="وضعیت"
                value={slip.deliveryConfirmed ? "تأیید شده" : "در انتظار تأیید"}
              />
              <InfoItem
                label="تعداد کالا"
                value={formatNumber(totalQuantity)}
              />
            </dl>
          </section>
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#1F3A5F]">
              مشتری و آدرس تحویل
            </h3>
            {slip.customerName ||
            slip.customerPhone ||
            slip.deliveryFullAddress ? (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoItem label="نام مشتری" value={slip.customerName || "-"} />
                <InfoItem
                  label="شماره موبایل"
                  value={
                    slip.customerPhone
                      ? formatFaDigits(slip.customerPhone)
                      : "-"
                  }
                />
                <InfoItem
                  label="آدرس تحویل"
                  value={
                    slip.deliveryAddress || slip.deliveryFullAddress || "-"
                  }
                  className="sm:col-span-2"
                />
                <InfoItem
                  label="گیرنده بار"
                  value={slip.receiverFullName || "-"}
                />
                <InfoItem
                  label="موبایل گیرنده"
                  value={
                    slip.receiverPhone
                      ? formatFaDigits(slip.receiverPhone)
                      : "-"
                  }
                />
                <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
                  <dt className="text-xs text-[#6B7280]">وضعیت تأیید تحویل</dt>
                  <dd className="mt-2">
                    <Badge
                      variant={slip.deliveryConfirmed ? "success" : "warning"}
                    >
                      {slip.deliveryConfirmed ? "تأیید شده" : "در انتظار تأیید"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm text-[#6B7280]">
                اطلاعات مشتری ثبت نشده است.
              </p>
            )}
          </section>
          {slip.items.length > 0 ? (
            <ExitSlipProductGroups items={slip.items} />
          ) : null}
        </>
      )}
    </DashboardLayout>
  );
}

function InfoItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 ${className}`}
    >
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 whitespace-normal text-sm font-medium leading-7 text-[#1F3A5F]">
        {value}
      </dd>
    </div>
  );
}
