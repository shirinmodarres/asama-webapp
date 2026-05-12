"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { Order, OrderItem } from "@/lib/models/order.model";
import type { WarehouseItemUnit } from "@/lib/models/warehouse.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { getOrder } from "@/lib/services/order.service";
import {
  createExitSlip,
  validateExitSlipScan,
} from "@/lib/services/warehouse.service";
import { formatFaDigits, normalizeDigits } from "@/lib/utils/number-format";

interface ExpectedRow {
  item: OrderItem;
  scannedQuantity: number;
  remainingQuantity: number;
}

export default function ExitSlipCreatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [scannedCode, setScannedCode] = useState("");
  const [scannedUnits, setScannedUnits] = useState<WarehouseItemUnit[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getOrder(params.id);
        if (isMounted) setOrder(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!isLoading) scanInputRef.current?.focus();
  }, [isLoading, scannedUnits.length]);

  const expectedRows = useMemo<ExpectedRow[]>(() => {
    if (!order) return [];
    return order.items.map((item) => {
      const scannedQuantity = scannedUnits.filter((unit) =>
        unitMatchesOrderItem(unit, item),
      ).length;
      return {
        item,
        scannedQuantity,
        remainingQuantity: item.quantity - scannedQuantity,
      };
    });
  }, [order, scannedUnits]);

  const canSubmit =
    scannedUnits.length > 0 &&
    expectedRows.length > 0 &&
    expectedRows.every((row) => row.scannedQuantity === row.item.quantity) &&
    scannedUnits.every((unit) =>
      expectedRows.some((row) => unitMatchesOrderItem(unit, row.item)),
    ) &&
    scannedUnits.length ===
      expectedRows.reduce((sum, row) => sum + row.item.quantity, 0);

  const expectedColumns: DataTableColumn<ExpectedRow>[] = [
    {
      key: "product",
      header: "کالا",
      render: (row) => row.item.productName || row.item.productSku,
    },
    {
      key: "ordered",
      header: "تعداد سفارش",
      render: (row) => formatNumber(row.item.quantity),
    },
    {
      key: "scanned",
      header: "تعداد اسکن‌شده",
      render: (row) => formatNumber(row.scannedQuantity),
    },
    {
      key: "remaining",
      header: "باقی‌مانده",
      render: (row) => formatNumber(Math.max(row.remainingQuantity, 0)),
    },
  ];

  const scannedColumns: DataTableColumn<WarehouseItemUnit>[] = [
    {
      key: "productName",
      header: "کالا",
      render: (row) => row.productName || "-",
    },
    {
      key: "productIdentifier",
      header: "شناسه محصول",
      render: (row) =>
        row.productIdentifier ? formatFaDigits(row.productIdentifier) : "-",
    },
    {
      key: "serialNumber",
      header: "سریال",
      render: (row) =>
        row.serialNumber ? formatFaDigits(row.serialNumber) : "-",
    },
    {
      key: "trackingCode",
      header: "کد رهگیری",
      render: (row) =>
        row.trackingCode ? formatFaDigits(row.trackingCode) : "-",
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="حذف"
          onClick={() =>
            setScannedUnits((current) =>
              current.filter((unit) => unit.objectId !== row.objectId),
            )
          }
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  const handleScan = async () => {
    if (!order) return;
    const normalizedCode = normalizeDigits(scannedCode.trim());
    if (!normalizedCode) {
      setError("کد اسکن‌شده را وارد کنید.");
      scanInputRef.current?.focus();
      return;
    }

    setIsValidating(true);
    setError("");
    setMessage("");
    try {
      const unit = await validateExitSlipScan(order.objectId, {
        scannedCode: normalizedCode,
        currentScannedUnitIds: scannedUnits
          .map((entry) => entry.objectId)
          .filter(Boolean),
      });
      if (!unit.objectId) {
        setError("اطلاعات کالای اسکن‌شده کامل نیست.");
        return;
      }
      setScannedUnits((current) =>
        current.some((entry) => entry.objectId === unit.objectId)
          ? current
          : [...current, unit],
      );
      setScannedCode("");
    } catch (scanError) {
      setError(getErrorMessage(scanError));
    } finally {
      setIsValidating(false);
      window.setTimeout(() => scanInputRef.current?.focus(), 0);
    }
  };

  const handleSubmit = async () => {
    if (!order) return;
    const unitObjectIds = scannedUnits
      .map((unit) => unit.objectId)
      .filter(Boolean);

    if (!canSubmit || unitObjectIds.length !== scannedUnits.length) {
      setError("تعداد کالاهای اسکن‌شده با سفارش برابر نیست.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const slip = await createExitSlip(order.objectId, {
        issuedByName: getStoredCurrentUser()?.fullName ?? undefined,
        notes: notes.trim() || undefined,
        unitObjectIds,
      });
      setMessage(
        "حواله خروج صادر شد و پیامک تأیید دریافت برای گیرنده ثبت/ارسال شد.",
      );
      router.push(
        `/warehouse/exit-slips/${slip.objectId || slip.id}?created=1`,
      );
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="warehouse" title="صدور حواله خروج">
      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش" />
      ) : error && !order ? (
        <PageErrorMessage title="دریافت سفارش انجام نشد" message={error} />
      ) : !order ? (
        <EmptyState
          title="سفارش یافت نشد"
          description="شناسه سفارش معتبر نیست."
        />
      ) : (
        <div className="space-y-5">
          <SectionHeader
            title={`صدور حواله ${formatFaDigits(order.code || order.id)}`}
            description="برای صدور حواله، کالاهای فیزیکی سفارش را اسکن کنید."
          />
          {message ? (
            <div className="asama-banner px-4 py-3 text-sm">{message}</div>
          ) : null}
          {error ? <InlineErrorMessage message={error} /> : null}

          <CustomerInfoCard order={order} />

          <DataTable
            columns={expectedColumns}
            rows={expectedRows}
            rowKey={(row) => row.item.objectId || row.item.productId}
          />

          <Card className="p-5">
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>اسکن شناسه / سریال / کد رهگیری</span>
              <Input
                ref={scanInputRef}
                value={scannedCode}
                onChange={(event) => setScannedCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleScan();
                  }
                }}
                disabled={isValidating}
              />
            </label>
            <Button
              type="button"
              className="mt-4"
              onClick={handleScan}
              disabled={isValidating}
            >
              {isValidating ? "در حال بررسی..." : "ثبت اسکن"}
            </Button>
          </Card>

          {scannedUnits.length > 0 ? (
            <DataTable
              columns={scannedColumns}
              rows={scannedUnits}
              rowKey={(row) => row.objectId}
            />
          ) : null}

          <Card className="p-5">
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>توضیحات</span>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <Button
              type="button"
              className="mt-4"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت حواله خروج"}
            </Button>
            {!canSubmit ? (
              <p className="mt-3 text-xs leading-6 text-[#8A5A00]">
                تا زمانی که تعداد اسکن‌شده هر کالا با تعداد سفارش برابر نشود،
                امکان ثبت حواله وجود ندارد.
              </p>
            ) : null}
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

function unitMatchesOrderItem(
  unit: WarehouseItemUnit,
  item: OrderItem,
): boolean {
  if (unit.productObjectId && item.productId) {
    return unit.productObjectId === item.productId;
  }
  if (unit.productSku && item.productSku) {
    return unit.productSku === item.productSku;
  }
  return Boolean(
    unit.productName &&
    item.productName &&
    unit.productName.trim() === item.productName.trim(),
  );
}
