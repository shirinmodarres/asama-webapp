"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { TransferCancelDialog } from "@/components/stock-transfer/transfer-cancel-dialog";
import { TransferStatusBadge } from "@/components/stock-transfer/transfer-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { StockTransferRequest } from "@/lib/models/stock.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  approveStockTransfer,
  cancelManagerStockTransfer,
  getManagerStockTransfer,
  rejectStockTransfer,
} from "@/lib/services/stock.service";

export default function ManagerStockTransferDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [transfer, setTransfer] = useState<StockTransferRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"approve" | "reject" | "cancel" | "">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getManagerStockTransfer(params.id);
        if (isMounted) setTransfer(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const actorName =
    getStoredCurrentUser()?.fullName ||
    getStoredCurrentUser()?.username ||
    "مدیر فروش";

  const handleCancel = async () => {
    if (!transfer || transfer.status !== "approved_waiting_warehouse_scan") return;
    setIsCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!transfer || transfer.status !== "approved_waiting_warehouse_scan" || submitting) return;
    setSubmitting("cancel");
    setError("");
    try {
      const updated = await cancelManagerStockTransfer(transfer.objectId, { cancelledByName: actorName });
      setTransfer(updated);
      setIsCancelDialogOpen(false);
      setMessage("انتقال لغو شد و رزرو موجودی آزاد شد.");
      toast.success("انتقال لغو شد و رزرو موجودی آزاد شد.");
    } catch (actionError) {
      const nextError = getErrorMessage(actionError);
      setError(nextError);
      toast.error(nextError);
    } finally {
      setSubmitting("");
    }
  };

  const itemRows = useMemo(() => transfer?.items ?? [], [transfer]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!transfer) return;
    setSubmitting(action);
    setError("");
    setMessage("");
    try {
      if (action === "approve") {
        await approveStockTransfer(transfer.objectId, {
          approvedByName: actorName,
        });
        setMessage("درخواست انتقال موجودی تأیید شد.");
        toast.success("انتقال تأیید شد و برای اسکن انبار ارسال شد.");
      } else {
        await rejectStockTransfer(transfer.objectId, {
          rejectedByName: actorName,
        });
        setMessage("درخواست انتقال موجودی رد شد.");
        toast.success("درخواست انتقال رد شد.");
      }
      const refreshed = await getManagerStockTransfer(transfer.objectId);
      setTransfer(refreshed);
      router.refresh();
    } catch (actionError) {
      const nextError = formatTransferActionError(actionError);
      setError(nextError);
      toast.error(nextError);
    } finally {
      setSubmitting("");
    }
  };

  return (
    <DashboardLayout role="manager" title="جزئیات انتقال">
      <SectionHeader
        title="جزئیات درخواست انتقال"
        description="اقلام این درخواست را قبل از تأیید بررسی کنید."
        actions={
          <Link
            href="/manager/stock-transfers"
            className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155]"
          >
            بازگشت
          </Link>
        }
      />

      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}

      {isLoading ? (
        <LoadingState title="در حال دریافت جزئیات انتقال" />
      ) : !transfer ? (
        <EmptyState
          title="درخواست انتقال یافت نشد"
          description="شناسه انتقال معتبر نیست."
        />
      ) : (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoItem label="وضعیت" value={<TransferStatusBadge status={transfer.status} />} />
              <InfoItem
                label="انبار مبدأ"
                value={transfer.sourceStockTitle || transfer.sourceStockObjectId || "-"}
              />
              <InfoItem
                label="انبار مقصد"
                value={transfer.destinationStockTitle || transfer.destinationStockObjectId || "-"}
              />
              <InfoItem label="تعداد کل" value={formatNumber(transfer.quantity)} />
              <InfoItem
                label="درخواست‌کننده"
                value={transfer.requestedByName || "-"}
              />
              <InfoItem
                label="زمان درخواست"
                value={transfer.requestedAt ? formatDateTime(transfer.requestedAt) : "-"}
              />
              <InfoItem
                label="تأییدکننده"
                value={transfer.approvedByName || "-"}
              />
              <InfoItem
                label="زمان تأیید"
                value={transfer.approvedAt ? formatDateTime(transfer.approvedAt) : "-"}
              />
            </div>
            {transfer.note ? (
              <p className="mt-4 rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm leading-7 text-[#334155]">
                {transfer.note}
              </p>
            ) : null}
            {transfer.status === "pending_manager_approval" ? <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => handleAction("approve")}
                disabled={Boolean(submitting)}
              >
                <CheckCircle2 className="size-4" />
                تأیید
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAction("reject")}
                disabled={Boolean(submitting)}
              >
                <XCircle className="size-4" />
                رد
              </Button>
            </div> : transfer.status === "approved_waiting_warehouse_scan" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="destructive" onClick={handleCancel} disabled={Boolean(submitting)}>
                  <XCircle className="size-4" /> لغو و آزادسازی رزرو
                </Button>
              </div>
            ) : null}
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <h2 className="text-base font-bold text-[#102034]">اقلام درخواست</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right text-sm">
                <thead className="bg-[#F8FAFC] text-[#334155]">
                  <tr>
                    <Th>ردیف</Th>
                    <Th>نام کالا</Th>
                    <Th>تعداد</Th>
                  </tr>
                </thead>
                <tbody>
                  {itemRows.map((item, index) => (
                    <tr key={`${item.productObjectId}-${index}`} className="border-t border-[#E5E7EB]">
                      <Td>{formatNumber(index + 1)}</Td>
                      <Td>{item.productName || "-"}</Td>
                      <Td>{formatNumber(item.quantity)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      <TransferCancelDialog transfer={transfer} mode="manager" open={isCancelDialogOpen} submitting={submitting === "cancel"} onOpenChange={setIsCancelDialogOpen} onConfirm={confirmCancel} />
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[#102034]">{value}</div>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="border-b border-[#E5E7EB] px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

function formatTransferActionError(error: unknown): string {
  const baseMessage = getErrorMessage(error);
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object") {
    return baseMessage;
  }
  const details = error.details as {
    productName?: string | null;
    productCode?: string | null;
    productIdentifier?: string | null;
  };
  const productParts = [
    details.productName ? `کالا: ${details.productName}` : "",
    details.productCode ? `کد کالا: ${details.productCode}` : "",
    details.productIdentifier ? `شناسه کالا: ${details.productIdentifier}` : "",
  ].filter(Boolean);
  if (productParts.length) return `${baseMessage} (${productParts.join("، ")})`;
  return baseMessage;
}
