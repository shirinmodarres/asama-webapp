"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AsamaLogo } from "@/components/branding/asama-logo";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import {
  confirmDelivery,
  getDeliveryByToken,
} from "@/lib/services/warehouse.service";
import {
  formatFaDigits,
  normalizeDigits,
  normalizePhone,
} from "@/lib/utils/number-format";

export default function DeliveryConfirmationPage() {
  const params = useParams<{ token: string }>();
  const [delivery, setDelivery] = useState<ExitSlip | null>(null);
  const [phone, setPhone] = useState("");
  const [deliveryCode, setDeliveryCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDelivery() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getDeliveryByToken(params.token);
        if (isMounted) setDelivery(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDelivery();
    return () => {
      isMounted = false;
    };
  }, [params.token]);

  const submitConfirmation = async () => {
    setError("");
    setMessage("");

    const normalizedPhone = normalizePhone(phone);
    const normalizedCode = normalizeDigits(deliveryCode.trim());
    if (!normalizedPhone || !normalizedCode) {
      setError("شماره موبایل و کد تأیید دریافت الزامی است.");
      return;
    }

    setIsSubmitting(true);
    try {
      const confirmed = await confirmDelivery(params.token, {
        phone: normalizedPhone,
        deliveryCode: normalizedCode,
      });
      setDelivery(confirmed);
      setMessage("دریافت بار با موفقیت تأیید شد.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F6F8FA] p-4 text-[#102034]">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <AsamaLogo className="h-9 w-auto " />
          <h1 className="mt-2 text-center text-xl font-semibold">
            تأیید دریافت بار
          </h1>
        </header>

        {isLoading ? (
          <LoadingState title="در حال دریافت اطلاعات تحویل" />
        ) : !delivery ? (
          <EmptyState
            title="اطلاعات تحویل یافت نشد"
            description={error || "لینک تأیید دریافت معتبر نیست."}
          />
        ) : (
          <>
            {message ? (
              <div className="asama-banner px-4 py-3 text-sm">{message}</div>
            ) : null}
            {error ? <InlineErrorMessage message={error} /> : null}

            <Card className="p-5">
              <dl className="grid gap-3 sm:grid-cols-2">
                <InfoItem
                  label="کد سفارش"
                  value={formatFaDigits(delivery.orderCode)}
                />
                <InfoItem
                  label="شماره حواله"
                  value={formatFaDigits(delivery.slipCode)}
                />
                <InfoItem
                  label="گیرنده"
                  value={delivery.receiverFullName || "-"}
                />
                <StatusInfoItem
                  label="وضعیت تحویل"
                  confirmed={delivery.deliveryConfirmed}
                />
                <InfoItem
                  label="آدرس تحویل"
                  value={
                    delivery.deliveryAddress ||
                    delivery.deliveryFullAddress ||
                    "-"
                  }
                  className="sm:col-span-2"
                />
              </dl>
            </Card>

            {delivery.items.length > 0 ? (
              <Card className="p-5">
                <h2 className="text-base font-semibold text-[#1F3A5F]">
                  کالاها
                </h2>
                <div className="mt-4 overflow-x-auto rounded-xl border border-[#E5E7EB]">
                  <table className="min-w-full border-collapse text-right text-sm">
                    <thead>
                      <tr className="bg-[#F8FBFD] text-[#1F3A5F]">
                        <th className="px-3 py-2 font-semibold">کالا</th>
                        <th className="px-3 py-2 font-semibold">تعداد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delivery.items.map((item) => (
                        <tr
                          key={
                            item.productObjectId ||
                            item.productSku ||
                            item.productName
                          }
                          className="border-t border-[#E5E7EB]"
                        >
                          <td className="px-3 py-2">
                            {item.productName || item.productSku || "-"}
                          </td>
                          <td className="px-3 py-2">
                            {formatNumber(item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : null}

            <Card className="p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-[#334155]">
                  <span>شماره موبایل</span>
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    inputMode="tel"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#334155]">
                  <span>کد تأیید دریافت</span>
                  <Input
                    value={deliveryCode}
                    onChange={(event) => setDeliveryCode(event.target.value)}
                    inputMode="numeric"
                  />
                </label>
              </div>
              <Button
                type="button"
                className="mt-4"
                onClick={submitConfirmation}
                disabled={isSubmitting || delivery.deliveryConfirmed}
              >
                {delivery.deliveryConfirmed
                  ? "دریافت بار تأیید شده است"
                  : isSubmitting
                    ? "در حال ثبت..."
                    : "تأیید دریافت بار"}
              </Button>
            </Card>
          </>
        )}
      </div>
    </main>
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
      <dd className="mt-1 text-sm font-semibold leading-7 text-[#1F3A5F]">
        {value}
      </dd>
    </div>
  );
}

function StatusInfoItem({
  label,
  confirmed,
}: {
  label: string;
  confirmed: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-2">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            confirmed
              ? "bg-[#E9F8EE] text-[#2F7D46]"
              : "bg-[#FFF7E6] text-[#9A6700]"
          }`}
        >
          {confirmed ? "تأیید شده" : "در انتظار تأیید"}
        </span>
      </dd>
    </div>
  );
}
