"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import type { WarehouseInboundReceipt } from "@/lib/models/warehouse.model";
import {
  getInboundReceipt,
  updateInboundReceipt,
} from "@/lib/services/warehouse.service";
import { formatFaDigits, normalizeDigits } from "@/lib/utils/number-format";

interface EditableUnit {
  rowId: string;
  objectId?: string;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
}

export default function WarehouseInboundReceiptEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<WarehouseInboundReceipt | null>(null);
  const [units, setUnits] = useState<EditableUnit[]>([]);
  const [notes, setNotes] = useState("");
  const [newProductIdentifier, setNewProductIdentifier] = useState("");
  const [newSerialNumber, setNewSerialNumber] = useState("");
  const [newTrackingCode, setNewTrackingCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReceipt() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getInboundReceipt(params.id);
        if (!isMounted) return;
        setReceipt(data);
        setNotes(data.notes || "");
        setUnits(
          data.units.map((unit, index) => ({
            rowId: `${unit.objectId || "unit"}-${index}`,
            objectId: unit.objectId,
            productIdentifier: unit.productIdentifier,
            serialNumber: unit.serialNumber,
            trackingCode: unit.trackingCode,
          })),
        );
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReceipt();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const isEditable = useMemo(
    () => Boolean(receipt?.units.every((unit) => unit.status === "in_stock")),
    [receipt],
  );

  const columns: DataTableColumn<EditableUnit>[] = [
    {
      key: "productIdentifier",
      header: "شناسه محصول",
      render: (row) => (
        <Input
          value={row.productIdentifier}
          onChange={(event) =>
            updateUnit(row.rowId, { productIdentifier: event.target.value })
          }
        />
      ),
    },
    {
      key: "serialNumber",
      header: "سریال محصول",
      render: (row) => (
        <Input
          value={row.serialNumber}
          onChange={(event) =>
            updateUnit(row.rowId, { serialNumber: event.target.value })
          }
        />
      ),
    },
    {
      key: "trackingCode",
      header: "کد رهگیری",
      render: (row) => (
        <Input
          value={row.trackingCode}
          onChange={(event) =>
            updateUnit(row.rowId, { trackingCode: event.target.value })
          }
        />
      ),
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
            setUnits((current) =>
              current.filter((unit) => unit.rowId !== row.rowId),
            )
          }
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  function updateUnit(rowId: string, patch: Partial<EditableUnit>) {
    setUnits((current) =>
      current.map((unit) =>
        unit.rowId === rowId ? { ...unit, ...patch } : unit,
      ),
    );
  }

  const addUnit = () => {
    setError("");
    const unit = {
      rowId: `new-${Date.now()}`,
      productIdentifier: normalizeDigits(newProductIdentifier.trim()),
      serialNumber: normalizeDigits(newSerialNumber.trim()),
      trackingCode: normalizeDigits(newTrackingCode.trim()),
    };
    if (!unit.productIdentifier || !unit.serialNumber || !unit.trackingCode) {
      setError("شناسه محصول، سریال محصول و کد رهگیری الزامی است.");
      return;
    }
    setUnits((current) => [...current, unit]);
    setNewProductIdentifier("");
    setNewSerialNumber("");
    setNewTrackingCode("");
  };

  const handleSubmit = async () => {
    if (!receipt || !isEditable) return;
    setError("");
    setMessage("");

    const normalizedUnits = units.map((unit) => ({
      objectId: unit.objectId,
      productIdentifier: normalizeDigits(unit.productIdentifier.trim()),
      serialNumber: normalizeDigits(unit.serialNumber.trim()),
      trackingCode: normalizeDigits(unit.trackingCode.trim()),
    }));

    if (
      normalizedUnits.length === 0 ||
      normalizedUnits.some(
        (unit) => !unit.productIdentifier || !unit.serialNumber || !unit.trackingCode,
      )
    ) {
      setError("همه ردیف‌ها باید شناسه محصول، سریال محصول و کد رهگیری داشته باشند.");
      return;
    }

    const serials = new Set<string>();
    const trackingCodes = new Set<string>();
    for (const unit of normalizedUnits) {
      if (serials.has(unit.serialNumber) || trackingCodes.has(unit.trackingCode)) {
        setError("سریال یا کد رهگیری تکراری در فرم وجود دارد.");
        return;
      }
      serials.add(unit.serialNumber);
      trackingCodes.add(unit.trackingCode);
    }

    setIsSubmitting(true);
    try {
      const updated = await updateInboundReceipt(receipt.objectId, {
        notes: notes.trim() || null,
        units: normalizedUnits,
      });
      setMessage("رسید ورود با موفقیت ویرایش شد.");
      router.push(`/warehouse/inbound/receipts/${updated.objectId || updated.id}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="warehouse" title="ویرایش رسید">
      {isLoading ? (
        <LoadingState title="در حال دریافت رسید ورود" />
      ) : error && !receipt ? (
        <PageErrorMessage title="دریافت رسید انجام نشد" message={error} />
      ) : !receipt ? (
        <EmptyState title="رسید یافت نشد" description="شناسه رسید معتبر نیست." />
      ) : !isEditable ? (
        <EmptyState
          title="این رسید به دلیل خروج کالا قابل ویرایش نیست."
          description="برخی کالاهای این رسید از وضعیت موجود در انبار خارج شده‌اند."
        />
      ) : (
        <div className="space-y-5">
          <SectionHeader
            title={`ویرایش رسید ${formatFaDigits(receipt.receiptCode)}`}
            description="کالا در ویرایش رسید قابل تغییر نیست."
            actions={
              <Link
                href={`/warehouse/inbound/receipts/${receipt.objectId}`}
                className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#334155]"
              >
                بازگشت به جزئیات
              </Link>
            }
          />
          {message ? (
            <div className="asama-banner px-4 py-3 text-sm">{message}</div>
          ) : null}
          {error ? <InlineErrorMessage message={error} /> : null}

          <Card className="p-5">
            <dl className="grid gap-3 sm:grid-cols-3">
              <InfoItem label="کالا" value={receipt.productName || "-"} />
              <InfoItem label="شناسه کالا" value={formatFaDigits(receipt.productSku || receipt.productObjectId)} />
              <InfoItem label="تعداد فعلی" value={formatNumber(units.length)} />
            </dl>
            <label className="mt-4 grid gap-2 text-sm font-medium text-[#334155]">
              <span>توضیحات</span>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          </Card>

          <Card className="p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                value={newProductIdentifier}
                onChange={(event) => setNewProductIdentifier(event.target.value)}
                placeholder="شناسه محصول"
              />
              <Input
                value={newSerialNumber}
                onChange={(event) => setNewSerialNumber(event.target.value)}
                placeholder="سریال محصول"
              />
              <Input
                value={newTrackingCode}
                onChange={(event) => setNewTrackingCode(event.target.value)}
                placeholder="کد رهگیری"
                onKeyDown={(event) => {
                  if (event.key === "Enter") addUnit();
                }}
              />
            </div>
            <Button type="button" className="mt-4" onClick={addUnit}>
              افزودن ردیف
            </Button>
          </Card>

          <DataTable columns={columns} rows={units} rowKey={(row) => row.rowId} />

          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#1F3A5F]">{value}</dd>
    </div>
  );
}
