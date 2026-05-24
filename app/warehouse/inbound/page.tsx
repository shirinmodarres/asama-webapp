"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageSearch, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { Warehouse } from "@/lib/models/warehouse.model";
import type { Product } from "@/lib/models/product.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listProducts } from "@/lib/services/product.service";
import {
  createInboundReceipt,
  listWarehouses,
} from "@/lib/services/warehouse.service";
import { formatFaDigits, normalizeDigits } from "@/lib/utils/number-format";

interface DraftUnit {
  rowId: string;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
}

export default function WarehouseInboundPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productIdentifier, setProductIdentifier] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [units, setUnits] = useState<DraftUnit[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");
      try {
        const [productData, warehouseData] = await Promise.all([
          listProducts("warehouse"),
          listWarehouses(),
        ]);
        if (!isMounted) return;
        setProducts(productData);
        setWarehouses(warehouseData);
        const defaultWarehouse =
          warehouseData.find((warehouse) => warehouse.isDefault) ??
          warehouseData.find((warehouse) => warehouse.status !== "inactive");
        if (defaultWarehouse) setWarehouseId(defaultWarehouse.objectId);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProduct = products.find(
    (product) => product.objectId === selectedProductId,
  );
  const selectedWarehouse = warehouses.find(
    (warehouse) => warehouse.objectId === warehouseId,
  );

  const columns: DataTableColumn<DraftUnit>[] = [
    {
      key: "row",
      header: "ردیف",
      render: (row) => formatNumber(units.indexOf(row) + 1),
    },
    {
      key: "productIdentifier",
      header: "شناسه محصول",
      render: (row) => formatFaDigits(row.productIdentifier),
    },
    {
      key: "serialNumber",
      header: "سریال محصول",
      render: (row) => formatFaDigits(row.serialNumber),
    },
    {
      key: "trackingCode",
      header: "کد رهگیری",
      render: (row) => formatFaDigits(row.trackingCode),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Button
          type="button"
          variant="outline"
          size="icon"
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

  const addUnit = () => {
    setError("");
    setMessage("");
    setFieldErrors({});

    if (!selectedProductId) {
      setFieldErrors({ selectedProductId: "لطفاً یک گزینه انتخاب کنید." });
      return;
    }

    const nextUnit = {
      rowId: `${Date.now()}-${units.length}`,
      productIdentifier: normalizeDigits(productIdentifier.trim()),
      serialNumber: normalizeDigits(serialNumber.trim()),
      trackingCode: normalizeDigits(trackingCode.trim()),
    };

    if (
      !nextUnit.productIdentifier ||
      !nextUnit.serialNumber ||
      !nextUnit.trackingCode
    ) {
      setFieldErrors({
        productIdentifier: nextUnit.productIdentifier
          ? ""
          : "این فیلد الزامی است.",
        serialNumber: nextUnit.serialNumber ? "" : "این فیلد الزامی است.",
        trackingCode: nextUnit.trackingCode ? "" : "این فیلد الزامی است.",
      });
      return;
    }

    const hasDuplicate = units.some(
      (unit) =>
        unit.productIdentifier === nextUnit.productIdentifier ||
        unit.serialNumber === nextUnit.serialNumber ||
        unit.trackingCode === nextUnit.trackingCode,
    );

    if (hasDuplicate) {
      setFieldErrors({
        trackingCode: "این شناسه یا سریال قبلاً ثبت شده است.",
      });
      return;
    }

    setUnits((current) => [...current, nextUnit]);
    setProductIdentifier("");
    setSerialNumber("");
    setTrackingCode("");
  };

  const submitReceipt = async () => {
    setError("");
    setMessage("");
    setFieldErrors({});

    if (!selectedProductId) {
      setFieldErrors({ selectedProductId: "لطفاً یک گزینه انتخاب کنید." });
      return;
    }
    if (!warehouseId) {
      setFieldErrors({ warehouseId: "لطفاً یک گزینه انتخاب کنید." });
      return;
    }
    if (units.length === 0) {
      setError("حداقل یک کالا برای ثبت ورود اضافه کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const receipt = await createInboundReceipt({
        productObjectId: selectedProductId,
        warehouseId,
        units: units.map(({ productIdentifier, serialNumber, trackingCode }) => ({
          productIdentifier,
          serialNumber,
          trackingCode,
        })),
        notes: notes.trim() || undefined,
        createdByName: getStoredCurrentUser()?.fullName ?? undefined,
      });
      const stockMessage =
        selectedWarehouse?.type === "naja"
          ? "موجودی واقعی انبار ناجا برای این کالا افزایش یافت."
          : "موجودی واقعی انبار عمومی برای این کالا افزایش یافت.";
      setMessage(
        `رسید ورود ${formatFaDigits(receipt.receiptCode)} ثبت شد. ${stockMessage}`,
      );
      setUnits([]);
      setNotes("");
      const refreshedProducts = await listProducts("warehouse");
      setProducts(refreshedProducts);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.objectId,
        label: `${product.name} - ${product.brand}`,
      })),
    [products],
  );
  const warehouseOptions = useMemo(
    () =>
      warehouses
        .filter((warehouse) => warehouse.status !== "inactive")
        .map((warehouse) => ({
          value: warehouse.objectId,
          label: `${warehouse.name} - ${getWarehouseTypeLabel(warehouse.type)}`,
        })),
    [warehouses],
  );

  return (
    <DashboardLayout role="warehouse" title="ورود کالا">
      {isLoading ? (
        <LoadingState title="در حال دریافت کالاها" />
      ) : error && products.length === 0 ? (
        <PageErrorMessage title="دریافت کالاها انجام نشد" message={error} />
      ) : (
        <div className="space-y-5">
          {message ? (
            <div className="asama-banner px-4 py-3 text-sm">{message}</div>
          ) : null}
          {error ? <InlineErrorMessage message={error} /> : null}

          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
              <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
                <span>انبار مقصد</span>
                <SearchableSelect
                  value={warehouseId || undefined}
                  onValueChange={(value) => {
                    setWarehouseId(value);
                    setFieldErrors((current) => ({
                      ...current,
                      warehouseId: "",
                    }));
                  }}
                  options={warehouseOptions}
                  placeholder="انتخاب انبار مقصد"
                  searchPlaceholder="جستجو در انبارها"
                  emptyMessage="انباری پیدا نشد"
                  invalid={Boolean(fieldErrors.warehouseId)}
                />
                <FieldError message={fieldErrors.warehouseId} />
              </label>

              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کالا</span>
                <div className="relative">
                  <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                  <SearchableSelect
                    value={selectedProductId || undefined}
                    onValueChange={(value) => {
                      setSelectedProductId(value);
                      setUnits([]);
                      setFieldErrors((current) => ({
                        ...current,
                        selectedProductId: "",
                      }));
                    }}
                    options={productOptions}
                    placeholder="انتخاب کالا"
                    searchPlaceholder="جستجو در کالاها"
                    emptyMessage="کالایی پیدا نشد"
                    triggerClassName="pr-10"
                    invalid={Boolean(fieldErrors.selectedProductId)}
                  />
                  <FieldError message={fieldErrors.selectedProductId} />
                </div>
              </label>

              <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm">
                <p className="text-[#6B7280]">تعداد ثبت‌شده برای این کالا</p>
                <p className="mt-1 text-lg font-semibold text-[#102034]">
                  {formatNumber(units.length)}
                </p>
              </div>
            </div>

            {selectedProduct ? (
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <InfoItem label="نام کالا" value={selectedProduct.name} />
                <InfoItem label="شناسه/کد" value={formatFaDigits(selectedProduct.sku)} />
                <InfoItem label="برند" value={selectedProduct.brand || "-"} />
                <InfoItem label="مدل" value={selectedProduct.model || "-"} />
                <InfoItem
                  label="موجودی واقعی انبار"
                  value={formatNumber(selectedProduct.warehouseStock)}
                />
              </dl>
            ) : null}
          </Card>

          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>شناسه محصول</span>
                <Input
                  value={productIdentifier}
                  onChange={(event) => {
                    setProductIdentifier(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      productIdentifier: "",
                    }));
                  }}
                  aria-invalid={Boolean(fieldErrors.productIdentifier)}
                />
                <FieldError message={fieldErrors.productIdentifier} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>سریال محصول</span>
                <Input
                  value={serialNumber}
                  onChange={(event) => {
                    setSerialNumber(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      serialNumber: "",
                    }));
                  }}
                  aria-invalid={Boolean(fieldErrors.serialNumber)}
                />
                <FieldError message={fieldErrors.serialNumber} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کد رهگیری</span>
                <Input
                  value={trackingCode}
                  onChange={(event) => {
                    setTrackingCode(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      trackingCode: "",
                    }));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addUnit();
                  }}
                  aria-invalid={Boolean(fieldErrors.trackingCode)}
                />
                <FieldError message={fieldErrors.trackingCode} />
              </label>
            </div>
            <Button type="button" className="mt-4" onClick={addUnit}>
              افزودن به لیست
            </Button>
          </Card>

          {units.length > 0 ? (
            <DataTable
              columns={columns}
              rows={units}
              rowKey={(row) => row.rowId}
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
              onClick={submitReceipt}
              disabled={isSubmitting}
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت ورود کالا"}
            </Button>
            <p className="mt-3 text-xs text-[#6B7280]">
              آخرین بروزرسانی کالاها: {formatDateTime(new Date().toISOString())}
            </p>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

function getWarehouseTypeLabel(type: string) {
  if (type === "naja") return "انبار ناجا";
  if (type === "other") return "سایر";
  return "انبار عمومی";
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#1F3A5F]">{value}</dd>
    </div>
  );
}
