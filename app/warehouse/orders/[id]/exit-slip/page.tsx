"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Trash2 } from "lucide-react";
import { CustomerInfoCard } from "@/components/customer/customer-info-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
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
import type {
  ExitSlip,
  WarehouseItemUnit,
} from "@/lib/models/warehouse.model";
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
  const productIdentifierRef = useRef<HTMLInputElement | null>(null);
  const serialNumberRef = useRef<HTMLInputElement | null>(null);
  const trackingCodeRef = useRef<HTMLInputElement | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [scanValues, setScanValues] = useState({
    productIdentifier: "",
    serialNumber: "",
    trackingCode: "",
  });
  const [scannedUnits, setScannedUnits] = useState<WarehouseItemUnit[]>([]);
  const [createdSlip, setCreatedSlip] = useState<ExitSlip | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    if (!isLoading) serialNumberRef.current?.focus();
  }, [isLoading]);

  const expectedRows = useMemo<ExpectedRow[]>(() => {
    if (!order) return [];
    const itemsByProduct = new Map<string, OrderItem>();

    for (const item of order.items) {
      const key = getOrderItemProductKey(item);
      const existing = itemsByProduct.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemsByProduct.set(key, { ...item });
      }
    }

    return Array.from(itemsByProduct.values()).map((item) => {
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
      render: (row) =>
        row.item.productName
          ? formatFaDigits(row.item.productName)
          : formatFaDigits(row.item.productSku),
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

  const focusScanField = (field: keyof typeof scanValues) => {
    const refs = {
      productIdentifier: productIdentifierRef,
      serialNumber: serialNumberRef,
      trackingCode: trackingCodeRef,
    };
    window.setTimeout(() => refs[field].current?.focus(), 0);
  };

  const handleScanFieldEnter = (field: keyof typeof scanValues) => {
    if (field === "productIdentifier") {
      focusScanField("serialNumber");
      return;
    }
    if (field === "serialNumber") {
      void handleAddScannedUnit("serialNumber");
      return;
    }
    void handleAddScannedUnit("trackingCode");
  };

  const handleAddScannedUnit = async (
    sourceField: "serialNumber" | "trackingCode",
  ) => {
    if (!order) return;
    const serialNumber = normalizeDigits(scanValues.serialNumber.trim());
    const trackingCode = normalizeDigits(scanValues.trackingCode.trim());
    const scannedCode =
      sourceField === "serialNumber" ? serialNumber : trackingCode;

    setFieldErrors({});
    if (!scannedCode) {
      setFieldErrors({ [sourceField]: "این فیلد الزامی است." });
      focusScanField(sourceField);
      return;
    }
    if (
      serialNumber &&
      scannedUnits.some((unit) =>
        normalizeDigits(unit.serialNumber).trim() === serialNumber,
      )
    ) {
      setFieldErrors({ serialNumber: "سریال کالا قبلاً ثبت شده است." });
      focusScanField("serialNumber");
      return;
    }
    if (
      trackingCode &&
      scannedUnits.some((unit) =>
        normalizeDigits(unit.trackingCode).trim() === trackingCode,
      )
    ) {
      setFieldErrors({ trackingCode: "کد رهگیری قبلاً ثبت شده است." });
      focusScanField("trackingCode");
      return;
    }

    setIsValidating(true);
    setError("");
    setMessage("");
    try {
      const unit = await validateExitSlipScan(order.objectId, {
        scannedCode,
        currentScannedUnitIds: scannedUnits
          .map((entry) => entry.objectId)
          .filter(Boolean),
      });
      if (!unit.objectId) {
        setError("اطلاعات کالای اسکن‌شده کامل نیست.");
        focusScanField("trackingCode");
        return;
      }
      if (
        sourceField === "serialNumber" &&
        unit.serialNumber &&
        normalizeDigits(unit.serialNumber).trim() !== serialNumber
      ) {
        setFieldErrors({
          serialNumber: "سریال واردشده با کالای اسکن‌شده تطابق ندارد.",
        });
        focusScanField("serialNumber");
        return;
      }
      if (
        sourceField === "trackingCode" &&
        unit.trackingCode &&
        normalizeDigits(unit.trackingCode).trim() !== trackingCode
      ) {
        setFieldErrors({
          trackingCode: "کد رهگیری واردشده با کالای اسکن‌شده تطابق ندارد.",
        });
        focusScanField("trackingCode");
        return;
      }
      if (
        scannedUnits.some((entry) => entry.objectId === unit.objectId) ||
        (unit.serialNumber &&
          scannedUnits.some(
            (entry) =>
              normalizeDigits(entry.serialNumber).trim() ===
              normalizeDigits(unit.serialNumber).trim(),
          )) ||
        (unit.trackingCode &&
          scannedUnits.some(
            (entry) =>
              normalizeDigits(entry.trackingCode).trim() ===
              normalizeDigits(unit.trackingCode).trim(),
          ))
      ) {
        setFieldErrors({
          [sourceField]:
            sourceField === "serialNumber"
              ? "سریال کالا قبلاً ثبت شده است."
              : "کد رهگیری قبلاً ثبت شده است.",
        });
        focusScanField(sourceField);
        return;
      }
      const expectedRow = expectedRows.find((row) =>
        unitMatchesOrderItem(unit, row.item),
      );
      if (!expectedRow) {
        setError("کالای اسکن‌شده در این سفارش وجود ندارد.");
        focusScanField("trackingCode");
        return;
      }
      if (expectedRow.scannedQuantity >= expectedRow.item.quantity) {
        setFieldErrors({
          trackingCode: "تعداد کالاهای ثبت‌شده بیشتر از تعداد سفارش است.",
        });
        focusScanField("trackingCode");
        return;
      }
      setScannedUnits((current) =>
        current.some((entry) => entry.objectId === unit.objectId)
          ? current
          : [...current, unit],
      );
      setScanValues((current) => ({
        productIdentifier:
          unit.productIdentifier || current.productIdentifier || "",
        serialNumber: "",
        trackingCode: "",
      }));
      focusScanField("serialNumber");
    } catch (scanError) {
      setFieldErrors({ [sourceField]: getErrorMessage(scanError) });
      focusScanField(sourceField);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!order) return;
    const unitObjectIds = scannedUnits
      .map((unit) => unit.objectId)
      .filter(Boolean);

    if (!canSubmit || unitObjectIds.length !== scannedUnits.length) {
      setError("تعداد کالاهای ثبت‌شده با سفارش برابر نیست.");
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
      setCreatedSlip(slip);
      setMessage("حواله خروج صادر شد و فاکتور داخلی برای حسابداری ایجاد شد.");
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

          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoItem
                label="شماره سفارش"
                value={formatFaDigits(order.code || order.id)}
              />
              <InfoItem
                label="نوع سفارش"
                value={order.orderType === "naja" ? "ناجا" : "عادی"}
              />
              <InfoItem
                label="انبار خروج"
                value={order.stockTitle || order.warehouseName || "-"}
              />
              <InfoItem
                label="لیست قیمت"
                value={order.saleTypeTitle || order.saleType?.title || "-"}
              />
            </div>
            {!order.stockTitle && !order.warehouseName ? (
              <p className="mt-3 text-xs font-medium text-red-600">
                برای این سفارش انبار خروج مشخص نشده است.
              </p>
            ) : null}
          </Card>

          <DataTable
            columns={expectedColumns}
            rows={expectedRows}
            rowKey={(row) => row.item.objectId || row.item.productId}
          />

          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <ScanField
                ref={productIdentifierRef}
                label="شناسه محصول ثابت"
                value={scanValues.productIdentifier}
                error={fieldErrors.productIdentifier}
                disabled={isValidating}
                onChange={(value) => {
                  setScanValues((current) => ({
                    ...current,
                    productIdentifier: value,
                  }));
                  setFieldErrors((current) => ({
                    ...current,
                    productIdentifier: "",
                  }));
                }}
                onCommit={() => handleScanFieldEnter("productIdentifier")}
              />
              <ScanField
                ref={serialNumberRef}
                label="سریال محصول"
                value={scanValues.serialNumber}
                error={fieldErrors.serialNumber}
                disabled={isValidating}
                onChange={(value) => {
                  setScanValues((current) => ({
                    ...current,
                    serialNumber: value,
                  }));
                  setFieldErrors((current) => ({
                    ...current,
                    serialNumber: "",
                  }));
                }}
                onCommit={() => handleScanFieldEnter("serialNumber")}
              />
              <ScanField
                ref={trackingCodeRef}
                label="کد رهگیری"
                value={scanValues.trackingCode}
                error={fieldErrors.trackingCode}
                disabled={isValidating}
                onChange={(value) => {
                  setScanValues((current) => ({
                    ...current,
                    trackingCode: value,
                  }));
                  setFieldErrors((current) => ({
                    ...current,
                    trackingCode: "",
                  }));
                }}
                onCommit={() => handleScanFieldEnter("trackingCode")}
              />
            </div>
            <p className="mt-3 text-xs leading-6 text-[#6B7280]">
              شناسه محصول می‌تواند تکراری باشد. Enter روی شناسه محصول فقط به
              سریال می‌رود؛ Enter روی سریال یا کد رهگیری کالا را پیدا و ثبت
              می‌کند.
            </p>
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
              disabled={!canSubmit || isSubmitting || Boolean(createdSlip)}
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت حواله خروج"}
            </Button>
            {!canSubmit ? (
              <p className="mt-3 text-xs leading-6 text-[#8A5A00]">
                تعداد کالاهای ثبت‌شده کمتر از سفارش است.
              </p>
            ) : null}
          </Card>

          {createdSlip ? (
            <Card className="border-[#B9DFC0] bg-[#F3FAF4] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-[#2F6B3A]">
                    <CheckCircle2 className="size-5" />
                    حواله خروج صادر شد و فاکتور داخلی برای حسابداری ایجاد شد.
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-[#334155]">
                    <span>
                      شماره حواله:{" "}
                      {formatFaDigits(createdSlip.slipCode || createdSlip.id)}
                    </span>
                    <span>
                      شماره فاکتور داخلی:{" "}
                      {createdSlip.internalInvoiceNumber
                        ? formatFaDigits(createdSlip.internalInvoiceNumber)
                        : "-"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link
                      href={`/warehouse/exit-slips/${createdSlip.objectId || createdSlip.id}`}
                    >
                      مشاهده حواله
                    </Link>
                  </Button>
                  {createdSlip.internalInvoiceObjectId ? (
                    <Button asChild>
                      <Link
                        href={`/accounting/internal-invoices/${createdSlip.internalInvoiceObjectId}`}
                      >
                        مشاهده فاکتور داخلی
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </DashboardLayout>
  );
}

const ScanField = forwardRef<
  HTMLInputElement,
  {
    label: string;
    value: string;
    error?: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onCommit: () => void;
  }
>(function ScanField(
  { label, value, error, disabled, onChange, onCommit },
  ref,
) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      <Input
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onCommit();
          }
        }}
        disabled={disabled}
        aria-invalid={Boolean(error)}
      />
      <FieldError message={error} />
    </label>
  );
});

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#102034]">{value}</p>
    </div>
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

function getOrderItemProductKey(item: OrderItem): string {
  if (item.productId) return item.productId;
  if (item.productSku) return `sku:${item.productSku}`;
  return `name:${item.productName}`;
}
