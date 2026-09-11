"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TransferStatusBadge } from "@/components/stock-transfer/transfer-status-badge";
import { formatNumber } from "@/lib/expert/utils";
import type { StockTransferRequest } from "@/lib/models/stock.model";

export function TransferCancelDialog({ transfer, mode, open, submitting, onOpenChange, onConfirm }: {
  transfer: StockTransferRequest | null;
  mode: "support" | "manager";
  open: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  if (!transfer) return null;
  const manager = mode === "manager";
  return <AlertDialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{manager ? "لغو انتقال و آزادسازی رزرو" : "لغو درخواست انتقال"}</AlertDialogTitle>
        <AlertDialogDescription>
          {manager
            ? "با لغو این انتقال، رزرو موجودی آزاد می‌شود. موجودی واقعی و واحدهای فیزیکی تغییر نمی‌کنند."
            : "این درخواست قبل از تأیید مدیر لغو می‌شود و تغییری در موجودی واقعی ایجاد نمی‌کند."}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="grid gap-3 rounded-xl border border-[#E5EAF0] bg-[#F8FAFC] p-4 text-sm sm:grid-cols-2">
        <Info label="شناسه انتقال" value={transfer.objectId} />
        <Info label="وضعیت" value={<TransferStatusBadge status={transfer.status} />} />
        <Info label="مبدأ" value={transfer.sourceStockTitle || "-"} />
        <Info label="مقصد" value={transfer.destinationStockTitle || "-"} />
        <Info label="تعداد کل" value={formatNumber(transfer.quantity)} />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={submitting}>انصراف</AlertDialogCancel>
        <Button variant="destructive" disabled={submitting} onClick={onConfirm}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting ? "در حال لغو..." : "تأیید لغو"}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="mb-1 text-xs text-[#64748B]">{label}</div><div className="font-semibold text-[#102034]">{value}</div></div>;
}
