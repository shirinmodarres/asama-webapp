"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
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
  isNajaExitSlip,
  resolveExitSlipCustomer,
  resolveExitSlipRecipient,
} from "@/lib/utils/exit-slip-customer";
import {
  formatFaDigits,
  normalizeDigits,
  normalizePhone,
} from "@/lib/utils/number-format";
import {
  isRequired,
  isValidPhone,
  PHONE_MESSAGE,
  REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";

export default function DeliveryConfirmationPage() {
  const params = useParams<{ token: string }>();
  const [delivery, setDelivery] = useState<ExitSlip | null>(null);
  const [phone, setPhone] = useState("");
  const [deliveryCode, setDeliveryCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const resolvedCustomer = delivery
    ? resolveExitSlipCustomer(delivery)
    : null;
  const resolvedRecipient = delivery
    ? resolveExitSlipRecipient(delivery)
    : null;
  const isNajaOrder =
    delivery && resolvedRecipient
      ? isNajaExitSlip(delivery.order?.orderType, resolvedRecipient)
      : false;

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
    setFieldErrors({});

    const normalizedPhone = normalizePhone(phone);
    const normalizedCode = normalizeDigits(deliveryCode.trim());
    const nextErrors: Record<string, string> = {};
    if (!isRequired(phone)) {
      nextErrors.phone = REQUIRED_MESSAGE;
    } else if (!isValidPhone(phone)) {
      nextErrors.phone = PHONE_MESSAGE;
    }
    if (!normalizedCode) nextErrors.deliveryCode = REQUIRED_MESSAGE;
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
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

            {isNajaOrder ? null : (
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
                  <StatusInfoItem
                    label="وضعیت تحویل"
                    confirmed={delivery.deliveryConfirmed}
                  />
                </dl>
              </Card>
            )}

            <Card className="p-5">
              <h2 className="text-base font-semibold text-[#1F3A5F]">
                اطلاعات مرکز / مشتری سپیدار
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoItem
                  label="نام مشتری/مرکز"
                  value={resolvedCustomer?.name || "-"}
                />
                <InfoItem
                  label="کد مشتری سپیدار"
                  value={
                    resolvedCustomer?.sepidarCustomerCode
                      ? formatFaDigits(resolvedCustomer.sepidarCustomerCode)
                      : "-"
                  }
                />
                <InfoItem
                  label="موبایل/تلفن"
                  value={
                    resolvedCustomer?.phone
                      ? formatFaDigits(resolvedCustomer.phone)
                      : "-"
                  }
                />
                <InfoItem
                  label="آدرس"
                  value={resolvedCustomer?.address || "-"}
                  className="sm:col-span-2"
                />
              </dl>
            </Card>

            {isNajaOrder ? (
              <Card className="p-5">
                <h2 className="text-base font-semibold text-[#1F3A5F]">
                  اطلاعات تحویل‌گیرنده ناجا
                </h2>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoItem
                    label="نام و نام خانوادگی"
                    value={resolvedRecipient?.fullName || "-"}
                  />
                  <InfoItem
                    label="کد ملی"
                    value={
                      resolvedRecipient?.nationalId
                        ? formatFaDigits(resolvedRecipient.nationalId)
                        : "-"
                    }
                  />
                  <InfoItem
                    label="موبایل"
                    value={
                      resolvedRecipient?.mobile
                        ? formatFaDigits(resolvedRecipient.mobile)
                        : "-"
                    }
                  />
                  <InfoItem
                    label="شماره سفارش ناجا"
                    value={
                      resolvedRecipient?.najaOrderNumber
                        ? formatFaDigits(resolvedRecipient.najaOrderNumber)
                        : "-"
                    }
                  />
                </dl>
              </Card>
            ) : (
              <Card className="p-5">
                <h2 className="text-base font-semibold text-[#1F3A5F]">
                  اطلاعات تحویل
                </h2>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoItem
                    label="گیرنده بار"
                    value={delivery.receiverFullName || "-"}
                  />
                  <InfoItem
                    label="موبایل گیرنده"
                    value={
                      delivery.receiverPhone
                        ? formatFaDigits(delivery.receiverPhone)
                        : "-"
                    }
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
            )}

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

            {isNajaOrder ? null : (
              <Card className="p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-[#334155]">
                    <span>شماره موبایل</span>
                    <Input
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setFieldErrors((current) => ({ ...current, phone: "" }));
                      }}
                      inputMode="tel"
                      aria-invalid={Boolean(fieldErrors.phone)}
                    />
                    <FieldError message={fieldErrors.phone} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-[#334155]">
                    <span>کد تأیید دریافت</span>
                    <Input
                      value={deliveryCode}
                      onChange={(event) => {
                        setDeliveryCode(event.target.value);
                        setFieldErrors((current) => ({
                          ...current,
                          deliveryCode: "",
                        }));
                      }}
                      inputMode="numeric"
                      aria-invalid={Boolean(fieldErrors.deliveryCode)}
                    />
                    <FieldError message={fieldErrors.deliveryCode} />
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
            )}
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
