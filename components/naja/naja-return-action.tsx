"use client";

import { useState } from "react";
import type { ExpertOrder } from "@/lib/expert/types";
import { useExpertStore } from "@/components/expert/expert-store-provider";
import { ConfirmationModal } from "@/components/manager/confirmation-modal";
import { FieldError } from "@/components/shared/field-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/expert/utils";

interface NajaReturnActionProps {
  order: ExpertOrder;
  actorName: string;
}

export function NajaReturnAction({ order, actorName }: NajaReturnActionProps) {
  const { returnNajaOrder } = useExpertStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const alreadyReturned =
    order.status === "returned" || order.status === "returnedAfterInvoice";

  const handleConfirm = () => {
    if (!reason.trim()) {
      setMessage("دلیل برگشت را وارد کنید.");
      return;
    }

    const result = returnNajaOrder({
      orderId: order.id,
      reason,
      createdBy: actorName,
    });

    if (!result.ok) {
      setMessage(result.error ?? "بازگردانی سفارش انجام نشد.");
      return;
    }

    setMessage(result.message ?? "سفارش بازگردانی شد.");
    setReason("");
    setOpen(false);
  };

  if (alreadyReturned) {
    return (
      <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEA] p-4 text-sm leading-7 text-[#7C5E10] shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge type="order" status={order.status} />
          <span className="text-xs text-[#8B6A16]">
            {order.returnedAt ? formatDateTime(order.returnedAt) : ""}
          </span>
        </div>
        <p className="mt-3 font-semibold text-[#102034]">دلیل برگشت</p>
        <p className="mt-1">{order.returnReason ?? "ثبت نشده"}</p>
        {order.returnedBy ? (
          <p className="mt-2 text-xs text-[#8B6A16]">ثبت کننده برگشت: {order.returnedBy}</p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-[#F3D7D7] bg-[#FFF8F8] p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#102034]">بازگردانی سفارش ناجا</p>
        <p className="mt-2 text-sm leading-7 text-[#6B7280]">
          در هر مرحله می توانید سفارش ناجا را با ثبت دلیل برگشت، به جریان بازگردانی منتقل کنید.
        </p>
        {order.status === "invoiced" ? (
          <p className="mt-2 text-xs text-[#9C3B3B]">
            این سفارش فاکتور شده است و بازگردانی آن نیازمند پیگیری مالی خواهد بود.
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 rounded-[14px] border border-[#F0D0D0] bg-white px-3 py-2 text-xs text-[#9C3B3B]">
            {message}
          </p>
        ) : null}
        <Button type="button" variant="outline" fullWidth className="mt-4" onClick={() => setOpen(true)}>
          برگشت سفارش
        </Button>
      </div>

      <ConfirmationModal
        open={open}
        title="بازگردانی سفارش ناجا"
        message="دلیل برگشت را ثبت کنید. موجودی ناجا در این نسخه نمایشی متناسب با برگشت سفارش به روز می شود."
        confirmText="ثبت برگشت سفارش"
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      >
        <Textarea
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setMessage("");
          }}
          placeholder="دلیل برگشت را وارد کنید"
          className="min-h-28"
          aria-invalid={Boolean(message)}
        />
        <FieldError message={message} />
      </ConfirmationModal>
    </>
  );
}
