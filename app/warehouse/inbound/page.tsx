"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PackageSearch, Trash2, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { Product } from "@/lib/models/product.model";
import type { SepidarStock } from "@/lib/models/stock.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listProducts } from "@/lib/services/product.service";
import { listStocks } from "@/lib/services/stock.service";
import { createInboundReceipt } from "@/lib/services/warehouse.service";
import { formatFaDigits, normalizeDigits } from "@/lib/utils/number-format";
import {
  buildDuplicateRowErrors,
  buildImportPreviewRows,
  buildLocalUnitRowErrors,
  countImportRows,
  extractDuplicateDetails,
  hasUnitRowErrors,
  isEmptyImportRow,
  parseInboundImportFile,
  type DraftUnit,
  type ImportPreviewRow,
  type UnitRowErrors,
} from "./import-helpers";

export default function WarehouseInboundPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");
  const [productIdentifier, setProductIdentifier] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [units, setUnits] = useState<DraftUnit[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [importError, setImportError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [unitRowErrors, setUnitRowErrors] = useState<UnitRowErrors>({});
  const [importPreviewRows, setImportPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [importAcceptedCount, setImportAcceptedCount] = useState(0);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const productIdentifierRef = useRef<HTMLInputElement | null>(null);
  const serialNumberRef = useRef<HTMLInputElement | null>(null);
  const trackingCodeRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");
      try {
        const [productData, stockData] = await Promise.all([
          listProducts("warehouse"),
          listStocks(),
        ]);
        if (!isMounted) return;
        setProducts(productData.filter((product) => product.isSyncedFromSepidar));
        setStocks(stockData.filter((stock) => stock.isActive));
        setSelectedStockId((current) => current || stockData.find((stock) => stock.isZagros)?.objectId || stockData[0]?.objectId || "");
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

  useEffect(() => {
    if (!selectedProductId) return;
    productIdentifierRef.current?.focus();
  }, [selectedProductId]);
  const columns: DataTableColumn<DraftUnit>[] = [
    {
      key: "row",
      header: "ردیف",
      render: (row) => formatNumber(units.indexOf(row) + 1),
    },
    {
      key: "productIdentifier",
      header: "شناسه محصول",
      render: (row) => (
        <div className="min-w-52">
          <span>{row.productIdentifier ? formatFaDigits(row.productIdentifier) : "-"}</span>
          <FieldError
            message={unitRowErrors[row.rowId]?.productIdentifier}
            className="mt-1 leading-5"
          />
        </div>
      ),
    },
    {
      key: "serialNumber",
      header: "سریال محصول",
      render: (row) => (
        <div className="min-w-52">
          <span>{formatFaDigits(row.serialNumber)}</span>
          <FieldError
            message={unitRowErrors[row.rowId]?.serialNumber}
            className="mt-1 leading-5"
          />
        </div>
      ),
    },
    {
      key: "trackingCode",
      header: "کد رهگیری",
      render: (row) => (
        <div className="min-w-52">
          <span>{formatFaDigits(row.trackingCode)}</span>
          <FieldError
            message={unitRowErrors[row.rowId]?.trackingCode}
            className="mt-1 leading-5"
          />
        </div>
      ),
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
            removeUnitRow(row.rowId)
          }
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  const importColumns: DataTableColumn<ImportPreviewRow>[] = [
    {
      key: "row",
      header: "ردیف اکسل",
      render: (row) => formatNumber(row.excelRowNumber),
    },
    {
      key: "productIdentifier",
      header: "شناسه محصول",
      render: (row) =>
        row.productIdentifier ? formatFaDigits(row.productIdentifier) : "-",
    },
    {
      key: "serialNumber",
      header: "سریال محصول",
      render: (row) => row.serialNumber ? formatFaDigits(row.serialNumber) : "-",
    },
    {
      key: "trackingCode",
      header: "کد رهگیری",
      render: (row) => row.trackingCode ? formatFaDigits(row.trackingCode) : "-",
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <div className="min-w-56">
          {row.messages.length ? (
            <div className="space-y-1">
              {row.messages.map((message) => (
                <p key={message} className="text-xs leading-5 text-[#B42318]">
                  {message}
                </p>
              ))}
            </div>
          ) : (
            <span className="text-xs font-semibold text-[#2F6B3A]">معتبر</span>
          )}
        </div>
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
          onClick={() => removeImportPreviewRow(row.rowId)}
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  const focusField = (
    field: "productIdentifier" | "serialNumber" | "trackingCode" | "notes",
  ) => {
    const refs = {
      productIdentifier: productIdentifierRef,
      serialNumber: serialNumberRef,
      trackingCode: trackingCodeRef,
      notes: notesRef,
    };
    window.setTimeout(() => refs[field].current?.focus(), 0);
  };

  const addUnit = () => {
    setError("");
    setMessage("");
    setFieldErrors({});

    if (!selectedProductId) {
      setFieldErrors({ selectedProductId: "لطفاً یک گزینه انتخاب کنید." });
      focusField("productIdentifier");
      return;
    }

    const nextUnit = {
      rowId: `${Date.now()}-${units.length}`,
      productIdentifier: normalizeDigits(productIdentifier.trim()),
      serialNumber: normalizeDigits(serialNumber.trim()),
      trackingCode: normalizeDigits(trackingCode.trim()),
    };

    if (!nextUnit.productIdentifier || !nextUnit.trackingCode) {
      setFieldErrors({
        productIdentifier: nextUnit.productIdentifier
          ? ""
          : "این فیلد الزامی است.",
        trackingCode: nextUnit.trackingCode ? "" : "این فیلد الزامی است.",
      });
      if (!nextUnit.productIdentifier) focusField("productIdentifier");
      else focusField("trackingCode");
      return;
    }

    if (
      nextUnit.serialNumber &&
      units.some((unit) => unit.serialNumber === nextUnit.serialNumber)
    ) {
      setFieldErrors({
        serialNumber: "سریال کالا قبلاً ثبت شده است.",
      });
      focusField("serialNumber");
      return;
    }

    if (
      units.some((unit) => unit.trackingCode === nextUnit.trackingCode)
    ) {
      setFieldErrors({
        trackingCode: "کد رهگیری قبلاً ثبت شده است.",
      });
      focusField("trackingCode");
      return;
    }

    const nextUnits = [...units, nextUnit];
    setUnits(nextUnits);
    setUnitRowErrors(buildLocalUnitRowErrors(nextUnits));
    setImportPreviewRows((current) => buildImportPreviewRows(current, nextUnits));
    setProductIdentifier("");
    setSerialNumber("");
    setTrackingCode("");
    focusField("productIdentifier");
  };

  const handleScanFieldEnter = (
    event: KeyboardEvent<HTMLInputElement>,
    nextField: "serialNumber" | "trackingCode" | "add",
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    if (nextField === "serialNumber") {
      focusField("serialNumber");
      return;
    }
    if (nextField === "trackingCode") {
      focusField("trackingCode");
      return;
    }
    addUnit();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setMessage("");
    setImportError("");
    setImportAcceptedCount(0);
    setFieldErrors({});

    if (!selectedProductId || !selectedStockId) {
      setFieldErrors({
        selectedProductId: selectedProductId ? "" : "لطفاً یک گزینه انتخاب کنید.",
        selectedStockId: selectedStockId ? "" : "لطفاً انبار مقصد را انتخاب کنید.",
      });
      setImportError("برای ایمپورت اکسل ابتدا کالا و انبار مقصد را انتخاب کنید.");
      return;
    }

    setIsImporting(true);
    try {
      const importedRows = await parseInboundImportFile(file);
      const importBatchId = `${Date.now()}`;
      const nonEmptyRows = importedRows.filter((row) => !isEmptyImportRow(row));
      const importedUnits = nonEmptyRows.map((row, index) => ({
        rowId: `import-${importBatchId}-${index}`,
        productIdentifier: normalizeDigits(row.productIdentifier.trim()),
        serialNumber: normalizeDigits(row.serialNumber.trim()),
        trackingCode: normalizeDigits(row.trackingCode.trim()),
      }));
      const previewRows: ImportPreviewRow[] = importedRows.map((row, index) => {
        const matchingNonEmptyIndex = nonEmptyRows.indexOf(row);
        return {
          ...row,
          rowId: `preview-${importBatchId}-${index}`,
          unitRowId:
            matchingNonEmptyIndex >= 0
              ? importedUnits[matchingNonEmptyIndex]?.rowId
              : undefined,
          messages: [],
        };
      });
      const candidateUnits = [...units, ...importedUnits];
      const candidatePreviewRows = buildImportPreviewRows(
        previewRows,
        candidateUnits,
      );
      const validImportedUnitIds = new Set(
        candidatePreviewRows
          .filter((row) => row.unitRowId && row.messages.length === 0)
          .map((row) => row.unitRowId),
      );
      const acceptedUnits = importedUnits.filter((unit) =>
        validImportedUnitIds.has(unit.rowId),
      );
      const rejectedPreviewRows = candidatePreviewRows.filter(
        (row) => !row.unitRowId || row.messages.length > 0,
      );
      const nextUnits = [...units, ...acceptedUnits];

      setUnits(nextUnits);
      setUnitRowErrors(buildLocalUnitRowErrors(nextUnits));
      setImportPreviewRows(rejectedPreviewRows);
      setImportAcceptedCount(acceptedUnits.length);
      if (acceptedUnits.length > 0) {
        setMessage(`${formatNumber(acceptedUnits.length)} ردیف از اکسل به لیست اضافه شد.`);
      }
      if (!importedRows.length) {
        setImportError("ردیفی برای ایمپورت پیدا نشد.");
      }
    } catch (loadError) {
      setImportError(getErrorMessage(loadError));
    } finally {
      setIsImporting(false);
    }
  };

  const submitReceipt = async () => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setUnitRowErrors({});

    if (!selectedProductId) {
      setFieldErrors({ selectedProductId: "لطفاً یک گزینه انتخاب کنید." });
      return;
    }
    if (!selectedStockId) {
      setFieldErrors({ selectedStockId: "لطفاً انبار مقصد را انتخاب کنید." });
      return;
    }
    if (units.length === 0) {
      setError("حداقل یک کالا برای ثبت ورود اضافه کنید.");
      return;
    }
    const localErrors = buildLocalUnitRowErrors(units);
    if (hasUnitRowErrors(localErrors)) {
      setUnitRowErrors(localErrors);
      setImportPreviewRows((current) => buildImportPreviewRows(current, units));
      setError("ردیف‌های دارای خطا را اصلاح یا حذف کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const receipt = await createInboundReceipt({
        productObjectId: selectedProductId,
        stockObjectId: selectedStockId,
        units: units.map(({ productIdentifier, serialNumber, trackingCode }) => ({
          productIdentifier,
          serialNumber,
          trackingCode,
        })),
        notes: notes.trim() || undefined,
        createdByName: getStoredCurrentUser()?.fullName ?? undefined,
      });
      setMessage(
        `رسید ورود ${formatFaDigits(receipt.receiptCode)} در ${receipt.stockTitle || "انبار انتخاب‌شده"} ثبت شد.`,
      );
      setUnits([]);
      setImportPreviewRows([]);
      setImportAcceptedCount(0);
      setImportError("");
      setNotes("");
      const refreshedProducts = await listProducts("warehouse");
      setProducts(refreshedProducts.filter((product) => product.isSyncedFromSepidar));
    } catch (submitError) {
      if (
        submitError instanceof ApiError &&
        submitError.code === "DUPLICATE_WAREHOUSE_UNIT"
      ) {
        const duplicates = extractDuplicateDetails(submitError.details);
        if (duplicates.length) {
          const duplicateErrors = buildDuplicateRowErrors(duplicates, units);
          setUnitRowErrors(duplicateErrors);
          setImportPreviewRows((current) =>
            buildImportPreviewRows(current, units, duplicateErrors),
          );
          setError("سریال یا کد رهگیری تکراری است. ردیف‌های مشخص‌شده را اصلاح یا حذف کنید.");
        } else {
          setError("سریال یا کد رهگیری تکراری است.");
        }
      } else if (
        submitError instanceof ApiError &&
        ["DUPLICATE_SERIAL_NUMBER", "SERIAL_DUPLICATE"].includes(submitError.code)
      ) {
        setError("سریال کالا قبلاً ثبت شده است.");
      } else if (
        submitError instanceof ApiError &&
        ["DUPLICATE_TRACKING_CODE", "TRACKING_CODE_DUPLICATE"].includes(submitError.code)
      ) {
        setError("کد رهگیری قبلاً ثبت شده است.");
      } else if (
        submitError instanceof ApiError &&
        submitError.code === "ZAGROS_STOCK_NOT_CONFIGURED"
      ) {
        setError("انبار زاگرس در تنظیمات موجودی پیدا نشد.");
      } else {
        setError(getErrorMessage(submitError));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeUnitRow = (rowId: string) => {
    setUnits((current) => {
      const nextUnits = current.filter((unit) => unit.rowId !== rowId);
      setUnitRowErrors(buildLocalUnitRowErrors(nextUnits));
      setImportPreviewRows((previewRows) =>
        previewRows.filter((row) => row.unitRowId !== rowId),
      );
      return nextUnits;
    });
  };

  const removeImportPreviewRow = (previewRowId: string) => {
    const target = importPreviewRows.find((row) => row.rowId === previewRowId);
    const nextPreviewRows = importPreviewRows.filter(
      (row) => row.rowId !== previewRowId,
    );
    const nextUnits = target?.unitRowId
      ? units.filter((unit) => unit.rowId !== target.unitRowId)
      : units;

    setUnits(nextUnits);
    setUnitRowErrors(buildLocalUnitRowErrors(nextUnits));
    setImportPreviewRows(nextPreviewRows);
    if (nextPreviewRows.length === 0) setImportAcceptedCount(0);
  };

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.objectId,
        label: `${formatFaDigits(product.sku || product.sepidarCode || "")} - ${formatFaDigits(product.name)}`,
        description: [
          product.brand,
          product.model ? `مدل ${formatFaDigits(product.model)}` : "",
          product.barcode ? `بارکد ${formatFaDigits(product.barcode)}` : "",
        ]
          .filter(Boolean)
          .join(" • "),
        searchText: [
          product.name,
          product.sku,
          product.sepidarCode,
          product.model,
          product.barcode,
          product.brand,
        ]
          .filter(Boolean)
          .join(" "),
      })),
    [products],
  );
  const stockOptions = useMemo(
    () =>
      stocks.map((stock) => ({
        value: stock.objectId,
        label: `${stock.code ? formatFaDigits(stock.code) + " - " : ""}${stock.title}`,
      })),
    [stocks],
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
            <div className="mb-4 rounded-xl border border-[#DDEAE0] bg-[#F3FAF4] p-3 text-sm font-medium text-[#2F6B3A]">
              ورود کالا در انبار انتخاب‌شده از فهرست انبارهای سپیدار ثبت می‌شود.
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)_180px]">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کالا</span>
                <div className="relative">
                  <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                  <SearchableSelect
                    value={selectedProductId || undefined}
                    onValueChange={(value) => {
                      setSelectedProductId(value);
                      setUnits([]);
                      setUnitRowErrors({});
                      setImportPreviewRows([]);
                      setImportAcceptedCount(0);
                      setImportError("");
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
                    normalizeSearch
                    highlightMatches
                  />
                  <FieldError message={fieldErrors.selectedProductId} />
                </div>
              </label>

              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>انبار مقصد</span>
                <SearchableSelect
                  value={selectedStockId || undefined}
                  onValueChange={(value) => {
                    setSelectedStockId(value);
                    setFieldErrors((current) => ({
                      ...current,
                      selectedStockId: "",
                    }));
                  }}
                  options={stockOptions}
                  placeholder="انتخاب انبار"
                  searchPlaceholder="جستجو در انبارها"
                  emptyMessage="انباری پیدا نشد"
                  invalid={Boolean(fieldErrors.selectedStockId)}
                  normalizeSearch
                />
                <FieldError message={fieldErrors.selectedStockId} />
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
              </dl>
            ) : null}
          </Card>

          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>شناسه محصول</span>
                <Input
                  ref={productIdentifierRef}
                  value={productIdentifier}
                  onChange={(event) => {
                    setProductIdentifier(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      productIdentifier: "",
                    }));
                  }}
                  onKeyDown={(event) =>
                    handleScanFieldEnter(event, "serialNumber")
                  }
                  aria-invalid={Boolean(fieldErrors.productIdentifier)}
                />
                <FieldError message={fieldErrors.productIdentifier} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>سریال محصول</span>
                <Input
                  ref={serialNumberRef}
                  value={serialNumber}
                  onChange={(event) => {
                    setSerialNumber(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      serialNumber: "",
                    }));
                  }}
                  onKeyDown={(event) =>
                    handleScanFieldEnter(event, "trackingCode")
                  }
                  aria-invalid={Boolean(fieldErrors.serialNumber)}
                />
                <FieldError message={fieldErrors.serialNumber} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کد رهگیری</span>
                <Input
                  ref={trackingCodeRef}
                  value={trackingCode}
                  onChange={(event) => {
                    setTrackingCode(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      trackingCode: "",
                    }));
                  }}
                  onKeyDown={(event) => {
                    handleScanFieldEnter(event, "add");
                  }}
                  aria-invalid={Boolean(fieldErrors.trackingCode)}
                />
                <FieldError message={fieldErrors.trackingCode} />
              </label>
            </div>
            <p className="mt-3 text-xs leading-6 text-[#6B7280]">
              شناسه کالا می‌تواند تکراری باشد، اما سریال کالا و کد رهگیری نباید
              تکراری باشند.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv,.tsv,text/csv,text/tab-separated-values"
              className="hidden"
              onChange={handleImportFile}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={addUnit}>
                افزودن به لیست
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedProductId || !selectedStockId || isImporting}
              >
                <Upload className="size-4" />
                {isImporting ? "در حال ایمپورت..." : "ایمپورت اکسل"}
              </Button>
            </div>
            {importError ? (
              <InlineErrorMessage message={importError} />
            ) : null}
          </Card>

          <Dialog
            open={importPreviewRows.length > 0}
            onOpenChange={(open) => {
              if (!open) {
                setImportPreviewRows([]);
                setImportAcceptedCount(0);
              }
            }}
          >
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>بررسی ردیف‌های ایمپورت</DialogTitle>
                <DialogDescription>
                  ردیف‌های معتبر به لیست اصلی اضافه شده‌اند. ردیف‌های زیر به
                  دلیل خطا اضافه نشده‌اند.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-4">
                <ImportSummaryItem
                  label="اضافه‌شده"
                  value={importAcceptedCount}
                />
                <ImportSummaryItem
                  label="سریال تکراری"
                  value={countImportRows(importPreviewRows, "serial")}
                />
                <ImportSummaryItem
                  label="کد رهگیری تکراری"
                  value={countImportRows(importPreviewRows, "tracking")}
                />
                <ImportSummaryItem
                  label="ردیف خالی"
                  value={countImportRows(importPreviewRows, "empty")}
                />
              </div>
              <DataTable
                columns={importColumns}
                rows={importPreviewRows}
                rowKey={(row) => row.rowId}
              />
            </DialogContent>
          </Dialog>

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
                ref={notesRef}
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#1F3A5F]">{value}</dd>
    </div>
  );
}

function ImportSummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-[#1F3A5F]">
        {formatNumber(value)}
      </dd>
    </div>
  );
}
