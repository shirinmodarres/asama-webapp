"use client";

import { useState } from "react";
import { ConfirmationModal } from "@/components/manager/confirmation-modal";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { returnNajaOrder } from "@/lib/services/naja.service";

interface NajaReturnActionRemoteProps {
  order: Order;
  actorName: string;
  onReturned: (order: Order) => void;
}

export function NajaReturnActionRemote({
  order,
  actorName,
  onReturned,
}: NajaReturnActionRemoteProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isReturned =
    order.orderStatus === "returned" ||
    order.orderStatus === "returnedAfterInvoice";

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("دلیل برگشت را وارد کنید.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const updated = await returnNajaOrder(order.objectId, reason.trim());
      onReturned(updated);
      setOpen(false);
      setReason("");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#102034]">بازگردانی سفارش</h3>
          <p className="mt-1 text-sm leading-7 text-[#6B7280]">
            {isReturned
              ? "این سفارش قبلا بازگردانی شده و وضعیت جدید آن ثبت شده است."
              : `در صورت نیاز ${actorName} می تواند سفارش ناجا را با ثبت دلیل برگرداند.`}
          </p>
        </div>
        {isReturned ? <StatusBadge type="order" status={order.orderStatus} /> : null}
      </div>

      {order.returnReason ? (
        <div className="mt-4 rounded-xl border border-[#F2D8D8] bg-[#FFF7F7] p-4 text-sm leading-7 text-[#8F2C2C]">
          <p className="font-semibold text-[#7B2525]">دلیل برگشت</p>
          <p className="mt-1">{order.returnReason}</p>
          <p className="mt-2 text-xs text-[#A85A5A]">
            آخرین به روزرسانی: {formatDateTime(order.updatedAt)}
          </p>
        </div>
      ) : null}

      {!isReturned ? (
        <div className="mt-5">
          <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
            برگشت سفارش
          </Button>
        </div>
      ) : null}

      {error && !open ? <div className="mt-4"><InlineErrorMessage message={error} /></div> : null}

      <ConfirmationModal
        open={open}
        title="بازگردانی سفارش ناجا"
        message="با ثبت این عملیات، وضعیت سفارش تغییر می کند و دلیل برگشت در سوابق ذخیره می شود."
        confirmText={isSubmitting ? "در حال ثبت..." : "ثبت برگشت سفارش"}
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => {
          if (isSubmitting) return;
          setOpen(false);
          setError("");
        }}
        busy={isSubmitting}
      >
        <label className="grid gap-2 text-sm font-medium text-[#334155]">
          <span>دلیل برگشت</span>
          <Textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
            placeholder="علت بازگردانی سفارش را ثبت کنید"
            aria-invalid={Boolean(error)}
          />
          <FieldError message={error} />
        </label>
      </ConfirmationModal>
    </Card>
  );
}
