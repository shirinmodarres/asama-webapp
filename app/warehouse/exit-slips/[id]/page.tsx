"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SlipDetailsCard } from "@/components/warehouse/slip-details-card";
import { getErrorMessage } from "@/lib/api/api-error";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { getExitSlip } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ExitSlipDetailsPage() {
  const params = useParams<{ id: string }>();
  const [slip, setSlip] = useState<ExitSlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <DashboardLayout role="warehouse" title="جزئیات حواله خروج">
      {isLoading ? (
        <LoadingState title="در حال دریافت حواله خروج" />
      ) : error ? (
        <PageErrorMessage title="دریافت حواله خروج انجام نشد" message={error} />
      ) : !slip ? (
        <EmptyState title="حواله خروج یافت نشد" description="شناسه حواله معتبر نیست." />
      ) : (
        <>
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
            <h3 className="text-base font-semibold text-[#1F3A5F]">
              مشتری و آدرس تحویل
            </h3>
            {slip.customerName || slip.customerPhone || slip.deliveryFullAddress ? (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoItem label="نام مشتری" value={slip.customerName || "-"} />
                <InfoItem label="شماره موبایل" value={slip.customerPhone ? formatFaDigits(slip.customerPhone) : "-"} />
                <InfoItem label="آدرس تحویل" value={slip.deliveryFullAddress || "-"} className="sm:col-span-2" />
                <InfoItem label="گیرنده بار" value={slip.receiverFullName || "-"} />
                <InfoItem label="موبایل گیرنده" value={slip.receiverPhone ? formatFaDigits(slip.receiverPhone) : "-"} />
              </dl>
            ) : (
              <p className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm text-[#6B7280]">
                اطلاعات مشتری ثبت نشده است.
              </p>
            )}
          </section>
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
    <div className={`rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 ${className}`}>
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 whitespace-normal text-sm font-medium leading-7 text-[#1F3A5F]">
        {value}
      </dd>
    </div>
  );
}
