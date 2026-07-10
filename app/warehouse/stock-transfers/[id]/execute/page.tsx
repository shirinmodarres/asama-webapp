"use client";

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ScanLine, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type { StockTransferItem, StockTransferRequest } from "@/lib/models/stock.model";
import type { WarehouseItemUnit } from "@/lib/models/warehouse.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  executeStockTransfer,
  getWarehouseStockTransfer,
  validateStockTransferScan,
} from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

type ScannedByProduct = Record<string, WarehouseItemUnit[]>;
type ScanInputByProduct = Record<string, string>;
type ErrorByProduct = Record<string, string>;

export default function WarehouseStockTransferExecutePage() {
  const params = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<StockTransferRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [scanInputs, setScanInputs] = useState<ScanInputByProduct>({});
  const [scanErrors, setScanErrors] = useState<ErrorByProduct>({});
  const [scanned, setScanned] = useState<ScannedByProduct>({});
  const [activeProductId, setActiveProductId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadTransfer() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getWarehouseStockTransfer(params.id);
        if (!isMounted) return;
        setTransfer(data);
        const firstProductId = data.items[0]?.productObjectId || "";
        setActiveProductId(firstProductId);
        window.setTimeout(() => inputRefs.current[firstProductId]?.focus(), 0);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadTransfer();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const allScannedUnitIds = useMemo(
    () => Object.values(scanned).flat().map((unit) => unit.objectId),
    [scanned],
  );

  const canSubmit = Boolean(
    transfer?.items.length &&
      transfer.items.every(
        (item) =>
          (scanned[item.productObjectId]?.length || 0) === item.quantity,
      ),
  );

  const focusProduct = (productObjectId: string) => {
    setActiveProductId(productObjectId);
    window.setTimeout(() => inputRefs.current[productObjectId]?.focus(), 0);
  };

  const focusNextIncomplete = (items: StockTransferItem[], currentProductId: string) => {
    const currentIndex = items.findIndex((item) => item.productObjectId === currentProductId);
    const ordered = [
      ...items.slice(Math.max(0, currentIndex)),
      ...items.slice(0, Math.max(0, currentIndex)),
    ];
    const next = ordered.find(
      (item) => (scanned[item.productObjectId]?.length || 0) < item.quantity,
    );
    if (next) focusProduct(next.productObjectId);
  };

  const handleScan = async (item: StockTransferItem) => {
    if (!transfer) return;
    const code = (scanInputs[item.productObjectId] || "").trim();
    if (!code) {
      setScanErrors((current) => ({
        ...current,
        [item.productObjectId]: "کد رهگیری/سریال را وارد کنید.",
      }));
      focusProduct(item.productObjectId);
      return;
    }
    const currentForItem = scanned[item.productObjectId] || [];
    if (currentForItem.length >= item.quantity) {
      setScanErrors((current) => ({
        ...current,
        [item.productObjectId]: "تعداد اسکن‌شده بیشتر از تعداد درخواست است.",
      }));
      setScanInputs((current) => ({ ...current, [item.productObjectId]: "" }));
      focusProduct(item.productObjectId);
      return;
    }

    setIsSubmitting(true);
    setScanErrors((current) => ({ ...current, [item.productObjectId]: "" }));
    try {
      const unit = await validateStockTransferScan(transfer.objectId, {
        scannedCode: code,
        productObjectId: item.productObjectId,
        currentScannedUnitIds: allScannedUnitIds,
      });
      const validationError = validateScannedUnitForItem(
        unit,
        item,
        transfer,
        allScannedUnitIds,
      );
      if (validationError) {
        setScanErrors((current) => ({
          ...current,
          [item.productObjectId]: validationError,
        }));
        setScanInputs((current) => ({ ...current, [item.productObjectId]: "" }));
        focusProduct(item.productObjectId);
        return;
      }
      setScanned((current) => ({
        ...current,
        [item.productObjectId]: [
          ...(current[item.productObjectId] || []),
          unit,
        ],
      }));
      setScanInputs((current) => ({ ...current, [item.productObjectId]: "" }));
      window.setTimeout(() => {
        const nextCount = currentForItem.length + 1;
        if (nextCount >= item.quantity) {
          focusNextIncomplete(transfer.items, item.productObjectId);
        } else {
          focusProduct(item.productObjectId);
        }
      }, 0);
    } catch (scanError) {
      setScanErrors((current) => ({
        ...current,
        [item.productObjectId]: getErrorMessage(scanError),
      }));
      focusProduct(item.productObjectId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    item: StockTransferItem,
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void handleScan(item);
  };

  const removeScannedUnit = (productObjectId: string, unitObjectId: string) => {
    setScanned((current) => ({
      ...current,
      [productObjectId]: (current[productObjectId] || []).filter(
        (unit) => unit.objectId !== unitObjectId,
      ),
    }));
    focusProduct(productObjectId);
  };

  const submitExecution = async () => {
    if (!transfer || !canSubmit) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      await executeStockTransfer(transfer.objectId, {
        items: transfer.items.map((item) => ({
          productObjectId: item.productObjectId,
          sepidarItemId: item.sepidarItemId,
          unitObjectIds: (scanned[item.productObjectId] || []).map(
            (unit) => unit.objectId,
          ),
        })),
        executedByName:
          getStoredCurrentUser()?.fullName ||
          getStoredCurrentUser()?.username ||
          "انباردار",
      });
      setMessage("انتقال با کدهای رهگیری ثبت‌شده تکمیل شد.");
      const refreshed = await getWarehouseStockTransfer(transfer.objectId);
      setTransfer(refreshed);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="warehouse" title="اجرای انتقال">
      {isLoading ? (
        <LoadingState title="در حال دریافت حواله انتقال" />
      ) : error && !transfer ? (
        <PageErrorMessage title="دریافت انتقال انجام نشد" message={error} />
      ) : !transfer ? (
        <EmptyState title="انتقال یافت نشد" description="شناسه انتقال معتبر نیست." />
      ) : (
        <div className="space-y-5">
          <SectionHeader
            title="اسکن کدهای انتقال"
            description={`${transfer.sourceStockTitle || "-"} به ${transfer.destinationStockTitle || "-"}`}
            actions={
              <Button asChild variant="outline">
                <Link href="/warehouse/stock-transfers">بازگشت</Link>
              </Button>
            }
          />

          {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
          {error ? <InlineErrorMessage message={error} /> : null}

          {transfer.status === "completed" ? (
            <Card className="p-5">
              <Badge variant="success">این انتقال تکمیل شده است.</Badge>
            </Card>
          ) : null}

          {transfer.items.map((item) => {
            const scannedUnits = scanned[item.productObjectId] || [];
            const remaining = Math.max(0, item.quantity - scannedUnits.length);
            return (
              <Card
                key={item.productObjectId}
                className={`p-5 ${activeProductId === item.productObjectId ? "ring-2 ring-[#6CAE75]/30" : ""}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#102034]">
                      {item.productName || "-"}
                    </h2>
                    <p className="mt-1 text-sm text-[#64748B]">
                      تعداد درخواست: {formatNumber(item.quantity)} • اسکن‌شده: {formatNumber(scannedUnits.length)} • باقی‌مانده: {formatNumber(remaining)}
                    </p>
                  </div>
                  <Badge variant={remaining === 0 ? "success" : "warning"}>
                    {remaining === 0 ? "کامل" : `${formatNumber(remaining)} باقی‌مانده`}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <label className="grid gap-2 text-sm font-medium text-[#334155]">
                    <span>اسکن کد رهگیری / سریال</span>
                    <Input
                      ref={(node) => {
                        inputRefs.current[item.productObjectId] = node;
                      }}
                      value={scanInputs[item.productObjectId] || ""}
                      onFocus={() => setActiveProductId(item.productObjectId)}
                      onChange={(event) =>
                        setScanInputs((current) => ({
                          ...current,
                          [item.productObjectId]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => handleKeyDown(event, item)}
                      placeholder="اسکن کنید و Enter بزنید"
                      className="h-14 text-lg"
                      disabled={transfer.status === "completed"}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleScan(item)}
                    disabled={isSubmitting || transfer.status === "completed"}
                  >
                    <ScanLine className="size-4" />
                    ثبت اسکن
                  </Button>
                </div>

                {scanErrors[item.productObjectId] ? (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    {scanErrors[item.productObjectId]}
                  </p>
                ) : null}

                {scannedUnits.length ? (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-[#E5E7EB]">
                    <table className="min-w-full text-right text-sm">
                      <thead className="bg-[#F8FAFC] text-[#64748B]">
                        <tr>
                          <th className="px-3 py-2">ردیف</th>
                          <th className="px-3 py-2">شناسه محصول</th>
                          <th className="px-3 py-2">سریال</th>
                          <th className="px-3 py-2">کد رهگیری</th>
                          <th className="px-3 py-2">عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scannedUnits.map((unit, index) => (
                          <tr key={unit.objectId} className="border-t border-[#E5E7EB]">
                            <td className="px-3 py-2">{formatNumber(index + 1)}</td>
                            <td className="px-3 py-2">{unit.productIdentifier ? formatFaDigits(unit.productIdentifier) : "-"}</td>
                            <td className="px-3 py-2">{unit.serialNumber ? formatFaDigits(unit.serialNumber) : "-"}</td>
                            <td className="px-3 py-2">{unit.trackingCode ? formatFaDigits(unit.trackingCode) : "-"}</td>
                            <td className="px-3 py-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                aria-label="حذف کد اسکن‌شده"
                                onClick={() =>
                                  removeScannedUnit(item.productObjectId, unit.objectId)
                                }
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </Card>
            );
          })}

          <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[#64748B]">
              انتقال فقط وقتی قابل ثبت است که تعداد اسکن‌شده همه کالاها با تعداد درخواست برابر باشد.
            </p>
            <Button
              type="button"
              onClick={submitExecution}
              disabled={!canSubmit || isSubmitting || transfer.status === "completed"}
            >
              <CheckCircle2 className="size-4" />
              تأیید نهایی انتقال
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function validateScannedUnitForItem(
  unit: WarehouseItemUnit,
  item: StockTransferItem,
  transfer: StockTransferRequest,
  allScannedUnitIds: string[],
): string {
  if (allScannedUnitIds.includes(unit.objectId)) {
    return "این کالا قبلاً در همین انتقال اسکن شده است.";
  }

  if (String(unit.status) !== "in_stock") {
    return `این واحد در وضعیت ${unit.statusLabel || unit.status} است و قابل انتقال نیست.`;
  }

  if (unit.stockObjectId !== transfer.sourceStockObjectId) {
    return `این واحد متعلق به ${unit.stockTitle || "انبار دیگری"} است، نه ${transfer.sourceStockTitle || "انبار مبدأ"}.`;
  }

  if (unit.productObjectId !== item.productObjectId) {
    return `کالای اسکن‌شده ${unit.productName || "-"} است، اما این ردیف برای ${item.productName || "-"} است.`;
  }

  return "";
}
