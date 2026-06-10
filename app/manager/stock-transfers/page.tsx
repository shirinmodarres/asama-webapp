"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { StockTransferRequest } from "@/lib/models/stock.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  approveStockTransfer,
  listManagerStockTransfers,
  rejectStockTransfer,
} from "@/lib/services/stock.service";

export default function ManagerStockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTransfers = async () => {
    const data = await listManagerStockTransfers({ status: "pending" });
    setTransfers(data);
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        await loadTransfers();
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
  }, []);

  const actorName =
    getStoredCurrentUser()?.fullName ||
    getStoredCurrentUser()?.username ||
    "مدیر فروش";

  const runAction = async (
    transfer: StockTransferRequest,
    action: "approve" | "reject",
  ) => {
    setSubmittingId(transfer.objectId);
    setError("");
    setMessage("");
    try {
      if (action === "approve") {
        await approveStockTransfer(transfer.objectId, {
          approvedByName: actorName,
        });
        setMessage("درخواست انتقال موجودی تأیید شد.");
      } else {
        await rejectStockTransfer(transfer.objectId, {
          rejectedByName: actorName,
        });
        setMessage("درخواست انتقال موجودی رد شد.");
      }
      await loadTransfers();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSubmittingId("");
    }
  };

  const columns: DataTableColumn<StockTransferRequest>[] = [
    { key: "product", header: "کالا", render: (row) => row.productName || "-" },
    {
      key: "source",
      header: "انبار مبدأ",
      render: (row) => row.sourceStockTitle || "انبار زاگرس",
    },
    {
      key: "destination",
      header: "انبار مقصد",
      render: (row) => row.destinationStockTitle || "-",
    },
    {
      key: "quantity",
      header: "تعداد کالا",
      render: (row) => formatNumber(row.quantity),
    },
    {
      key: "requestedAt",
      header: "تاریخ",
      render: (row) => (row.requestedAt ? formatDateTime(row.requestedAt) : "-"),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => runAction(row, "approve")}
            disabled={Boolean(submittingId)}
          >
            <CheckCircle2 className="size-4" />
            تأیید
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => runAction(row, "reject")}
            disabled={Boolean(submittingId)}
          >
            <XCircle className="size-4" />
            رد
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="manager" title="انتقال موجودی">
      <SectionHeader
        title="تأیید انتقال موجودی"
        description="درخواست‌های انتقال از انبار زاگرس به انبارهای فروش را بررسی کنید."
      />
      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? (
        <LoadingState title="در حال دریافت درخواست‌های انتقال" />
      ) : transfers.length ? (
        <DataTable columns={columns} rows={transfers} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState
          title="درخواست انتقالی در انتظار تأیید نیست"
          description="درخواست‌های جدید پشتیبان در این بخش نمایش داده می‌شوند."
        />
      )}
    </DashboardLayout>
  );
}
