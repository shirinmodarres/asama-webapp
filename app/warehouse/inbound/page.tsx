"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, PackageSearch, Trash2, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
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
import type { Product } from "@/lib/models/product.model";
import type { SepidarStock } from "@/lib/models/stock.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listProducts } from "@/lib/services/product.service";
import { listStocks } from "@/lib/services/stock.service";
import { createInboundReceipt } from "@/lib/services/warehouse.service";
import { formatFaDigits, normalizeDigits } from "@/lib/utils/number-format";
import {
  extractDuplicateDetails,
  isEmptyImportRow,
  parseInboundImportFile,
} from "./import-helpers";

interface ReceiptUnitDraft {
  rowId: string;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
}

interface ReceiptGroupDraft {
  rowId: string;
  productObjectId: string;
  units: ReceiptUnitDraft[];
}

export default function WarehouseInboundPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [groups, setGroups] = useState<ReceiptGroupDraft[]>([]);
  const [selectedStockId, setSelectedStockId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [productData, stockData] = await Promise.all([
          listProducts("warehouse"),
          listStocks(),
        ]);
        if (!isMounted) return;
        const allowedProducts = productData.filter((product) => product.isSyncedFromSepidar);
        setProducts(allowedProducts);
        setStocks(stockData.filter((stock) => stock.isActive));
        setSelectedStockId(
          stockData.find((stock) => stock.isZagros)?.objectId ||
            stockData[0]?.objectId ||
            "",
        );
        if (allowedProducts[0]) {
          setGroups([
            createEmptyGroup(allowedProducts[0].objectId),
          ]);
        }
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

  const productOptions = useMemo(
    () =>
      products.map((product) => {
        return {
          value: product.objectId,
          label: `${formatFaDigits(product.sku || product.sepidarCode || "")} - ${formatFaDigits(product.name)}`,
          description: "",
          searchText: [product.name, product.sku, product.sepidarCode, product.brandName, product.brand]
            .filter(Boolean)
            .join(" "),
        };
      }),
    [products],
  );

  const stockOptions = useMemo(
    () =>
      stocks.map((stock) => ({
        value: stock.objectId,
        label: `${stock.code ? `${formatFaDigits(stock.code)} - ` : ""}${stock.title}`,
        description: stock.isZagros ? "انبار زاگرس" : "",
        searchText: [stock.code, stock.title].filter(Boolean).join(" "),
      })),
    [stocks],
  );

  const totalUnits = groups.reduce((sum, group) => sum + group.units.length, 0);

  const addGroup = () => {
    const defaultProductId = products[0]?.objectId || "";
    setGroups((current) => [...current, createEmptyGroup(defaultProductId)]);
  };

  const removeGroup = (rowId: string) => {
    setGroups((current) => {
      const next = current.filter((group) => group.rowId !== rowId);
      return next.length ? next : [createEmptyGroup(products[0]?.objectId || "")];
    });
    setGroupErrors((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
  };

  const updateGroupProduct = (rowId: string, productObjectId: string) => {
    setGroups((current) =>
      current.map((group) =>
        group.rowId === rowId ? { ...group, productObjectId } : group,
      ),
    );
  };

  const updateGroupQuantity = (rowId: string, quantity: number) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.rowId !== rowId) return group;
        const nextUnits = [...group.units];
        if (quantity > nextUnits.length) {
          while (nextUnits.length < quantity) {
            nextUnits.push(createEmptyUnit());
          }
        } else if (quantity < nextUnits.length) {
          nextUnits.length = Math.max(0, quantity);
        }
        return { ...group, units: nextUnits };
      }),
    );
  };

  const updateUnit = (
    rowId: string,
    unitId: string,
    patch: Partial<Pick<ReceiptUnitDraft, "productIdentifier" | "serialNumber" | "trackingCode">>,
  ) => {
    setGroups((current) =>
      current.map((group) =>
        group.rowId !== rowId
          ? group
          : {
              ...group,
              units: group.units.map((unit) =>
                unit.rowId === unitId ? { ...unit, ...patch } : unit,
              ),
            },
      ),
    );
  };

  const importUnitsForGroup = async (rowId: string, file: File) => {
    setIsImporting(rowId);
    setError("");
    try {
      const importedRows = await parseInboundImportFile(file);
      const normalized = importedRows
        .filter((row) => !isEmptyImportRow(row))
        .map((row, index) => ({
          rowId: `${rowId}-${Date.now()}-${index}`,
          productIdentifier: normalizeDigits(row.productIdentifier.trim()),
          serialNumber: normalizeDigits(row.serialNumber.trim()),
          trackingCode: normalizeDigits(row.trackingCode.trim()),
        }));
      setGroups((current) =>
        current.map((group) =>
          group.rowId === rowId ? { ...group, units: normalized } : group,
        ),
      );
      setMessage(`${formatNumber(normalized.length)} ردیف برای این کالا از فایل اضافه شد.`);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsImporting(null);
    }
  };

  const validateGroup = (group: ReceiptGroupDraft) => {
    const errors: string[] = [];
    if (!group.productObjectId) errors.push("کالا انتخاب نشده است.");
    if (group.units.length === 0) errors.push("حداقل یک ردیف برای این کالا ثبت کنید.");

    const serials = new Set<string>();
    const tracking = new Set<string>();
    group.units.forEach((unit) => {
      const identifier = normalizeDigits(unit.productIdentifier.trim());
      const serial = normalizeDigits(unit.serialNumber.trim());
      const track = normalizeDigits(unit.trackingCode.trim());
      if (!identifier) errors.push("شناسه کالا برای یکی از ردیف‌ها خالی است.");
      if (!track) errors.push("کد رهگیری برای یکی از ردیف‌ها خالی است.");
      if (serial && serials.has(serial)) errors.push("سریال کالا در این کالا تکراری است.");
      if (track && tracking.has(track)) errors.push("کد رهگیری در این کالا تکراری است.");
      if (serial) serials.add(serial);
      if (track) tracking.add(track);
    });
    return errors;
  };

  const canSubmit = groups.length > 0 && groups.every((group) => validateGroup(group).length === 0);

  const submitReceipt = async () => {
    setError("");
    setMessage("");
    setGroupErrors({});

    if (!selectedStockId) {
      setError("لطفاً انبار مقصد را انتخاب کنید.");
      return;
    }
    if (!groups.length) {
      setError("حداقل یک کالا برای ثبت ورود اضافه کنید.");
      return;
    }

    const nextGroupErrors: Record<string, string> = {};
    groups.forEach((group) => {
      const errors = validateGroup(group);
      if (errors.length) nextGroupErrors[group.rowId] = errors[0];
    });
    setGroupErrors(nextGroupErrors);
    if (Object.keys(nextGroupErrors).length > 0) {
      setError("ردیف‌های دارای خطا را اصلاح کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const receipt = await createInboundReceipt({
        stockObjectId: selectedStockId,
        items: groups.map((group) => ({
          productObjectId: group.productObjectId,
          units: group.units.map((unit) => ({
            productObjectId: group.productObjectId,
            productIdentifier: normalizeDigits(unit.productIdentifier.trim()),
            serialNumber: normalizeDigits(unit.serialNumber.trim()),
            trackingCode: normalizeDigits(unit.trackingCode.trim()),
          })),
        })),
        notes: notes.trim() || undefined,
        createdByName: getStoredCurrentUser()?.fullName ?? undefined,
      });
      setMessage(
        `رسید ورود ${formatFaDigits(receipt.receiptCode)} در ${receipt.stockTitle || "انبار انتخاب‌شده"} ثبت شد.`,
      );
      setGroups(groups.map((group) => createEmptyGroup(group.productObjectId)));
      setNotes("");
    } catch (submitError) {
      setError(formatInboundSubmitError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="warehouse" title="ورود کالا">
      {isLoading ? (
        <LoadingState title="در حال دریافت کالاها" />
      ) : error && products.length === 0 ? (
        <PageErrorMessage title="دریافت کالاها انجام نشد" message={error} />
      ) : (
        <div className="space-y-5">
          {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
          {error ? <InlineErrorMessage message={error} /> : null}

          <Card className="p-5">
            <div className="mb-4 rounded-xl border border-[#DDEAE0] bg-[#F3FAF4] p-3 text-sm font-medium text-[#2F6B3A]">
              هر رسید می‌تواند چند کالا داشته باشد. برای هر کالا سریال و کد رهگیری جداگانه ثبت می‌شود.
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)_180px]">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>انبار مقصد</span>
                <SearchableSelect
                  value={selectedStockId || undefined}
                  onValueChange={(value) => setSelectedStockId(value)}
                  options={stockOptions}
                  placeholder="انتخاب انبار"
                  searchPlaceholder="جستجو در انبارها"
                  emptyMessage="انباری پیدا نشد"
                  normalizeSearch
                />
              </label>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm">
                <p className="text-[#6B7280]">تعداد کالاهای ثبت‌شده</p>
                <p className="mt-1 text-lg font-semibold text-[#102034]">{formatNumber(groups.length)}</p>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm">
                <p className="text-[#6B7280]">تعداد واحدها</p>
                <p className="mt-1 text-lg font-semibold text-[#102034]">{formatNumber(totalUnits)}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {groups.map((group, groupIndex) => {
              const product = products.find((item) => item.objectId === group.productObjectId);
              const progress = countCompletedUnits(group.units);
              return (
                <Card key={group.rowId} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#102034]">
                        کالای {formatNumber(groupIndex + 1)}
                      </h3>
                      <p className="mt-1 text-sm text-[#64748B]">
                        {progress} از {group.units.length} مورد تکمیل شده
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="حذف کالا"
                        onClick={() => removeGroup(group.rowId)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
                      <span>کالا</span>
                      <div className="relative">
                        <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                        <SearchableSelect
                          value={group.productObjectId || undefined}
                          onValueChange={(value) => updateGroupProduct(group.rowId, value)}
                          options={productOptions}
                          placeholder="انتخاب کالا"
                          searchPlaceholder="جستجو در کالاها"
                          emptyMessage="کالایی پیدا نشد"
                          triggerClassName="pr-10"
                          normalizeSearch
                        />
                      </div>
                      {groupErrors[group.rowId] ? (
                        <p className="text-xs leading-6 text-[#B45309]">{groupErrors[group.rowId]}</p>
                      ) : null}
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-[#334155]">
                      <span>تعداد</span>
                      <Input
                        inputMode="numeric"
                        value={group.units.length}
                        onChange={(event) => {
                          const quantity = Math.max(0, Number(normalizeDigits(event.target.value)) || 0);
                          updateGroupQuantity(group.rowId, quantity);
                        }}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-[#334155]">
                      <span>بارگذاری از فایل</span>
                      <div className="flex gap-2">
                        <input
                          ref={(element) => {
                            fileInputs.current[group.rowId] = element;
                          }}
                          type="file"
                          accept=".xlsx,.csv,.tsv,text/csv,text/tab-separated-values"
                          className="hidden"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) await importUnitsForGroup(group.rowId, file);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputs.current[group.rowId]?.click()}
                          disabled={!group.productObjectId || isImporting === group.rowId}
                        >
                          <Upload className="size-4" />
                          {isImporting === group.rowId ? "در حال ایمپورت..." : "ایمپورت فایل"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => updateGroupQuantity(group.rowId, group.units.length + 1)}
                          disabled={!group.productObjectId}
                        >
                          <Plus className="size-4" />
                          افزودن ردیف
                        </Button>
                      </div>
                    </label>
                  </div>

                  {product ? (
                    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                      <InfoItem label="نام کالا" value={product.name} />
                      <InfoItem label="کد کالا" value={formatFaDigits(product.sku || product.sepidarCode || "-")} />
                      <InfoItem label="برند" value={product.brandName || product.brand || "-"} />
                    </dl>
                  ) : null}

                  <div className="mt-5 overflow-x-auto rounded-xl border border-[#E5E7EB]">
                    <table className="min-w-full border-collapse text-right text-sm">
                      <thead>
                        <tr className="bg-[#F8FBFD] text-[#1F3A5F]">
                          <th className="px-3 py-2 font-semibold">ردیف</th>
                          <th className="px-3 py-2 font-semibold">شناسه محصول</th>
                          <th className="px-3 py-2 font-semibold">سریال</th>
                          <th className="px-3 py-2 font-semibold">کد رهگیری</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.units.map((unit, index) => (
                          <tr key={unit.rowId} className="border-t border-[#E5E7EB]">
                            <td className="px-3 py-2">{formatNumber(index + 1)}</td>
                            <td className="px-3 py-2">
                              <Input
                                value={unit.productIdentifier}
                                onChange={(event) =>
                                  updateUnit(group.rowId, unit.rowId, {
                                    productIdentifier: event.target.value,
                                  })
                                }
                                placeholder="شناسه محصول"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={unit.serialNumber}
                                onChange={(event) =>
                                  updateUnit(group.rowId, unit.rowId, {
                                    serialNumber: event.target.value,
                                  })
                                }
                                placeholder="سریال"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={unit.trackingCode}
                                  onChange={(event) =>
                                    updateUnit(group.rowId, unit.rowId, {
                                      trackingCode: event.target.value,
                                    })
                                  }
                                  placeholder="کد رهگیری"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  aria-label="حذف ردیف"
                                  onClick={() =>
                                    setGroups((current) =>
                                      current.map((currentGroup) =>
                                        currentGroup.rowId !== group.rowId
                                          ? currentGroup
                                          : {
                                              ...currentGroup,
                                              units: currentGroup.units.filter(
                                                (entry) => entry.rowId !== unit.rowId,
                                              ),
                                            },
                                      ),
                                    )
                                  }
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={addGroup}>
              <Plus className="size-4" />
              افزودن کالای جدید
            </Button>
            <Button
              type="button"
              onClick={submitReceipt}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت ورود کالا"}
            </Button>
          </div>

          <Card className="p-5">
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>توضیحات</span>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            <p className="mt-3 text-xs text-[#6B7280]">
              آخرین بروزرسانی کالاها: {formatDateTime(new Date().toISOString())}
            </p>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

function createEmptyUnit(): ReceiptUnitDraft {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productIdentifier: "",
    serialNumber: "",
    trackingCode: "",
  };
}

function createEmptyGroup(productObjectId: string): ReceiptGroupDraft {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productObjectId,
    units: [createEmptyUnit()],
  };
}

function countCompletedUnits(units: ReceiptUnitDraft[]): number {
  return units.filter((unit) =>
    Boolean(
      normalizeDigits(unit.productIdentifier.trim()) &&
        normalizeDigits(unit.serialNumber.trim()) &&
        normalizeDigits(unit.trackingCode.trim()),
    ),
  ).length;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#1F3A5F]">{value}</dd>
    </div>
  );
}

function formatInboundSubmitError(error: unknown): string {
  const baseMessage = getErrorMessage(error);
  const details = error && typeof error === "object"
    ? extractDuplicateDetails((error as { details?: unknown }).details)
    : [];
  if (!details.length) return baseMessage;
  return `${baseMessage}\n${details
    .map((duplicate) => {
      const fieldLabel = duplicate.field === "serialNumber" ? "سریال" : "کد رهگیری";
      const productName = duplicate.existingProductName || "کالا";
      const stockTitle = duplicate.existingStockTitle ? ` در ${duplicate.existingStockTitle}` : "";
      const receiptCode = duplicate.existingReceiptCode ? formatFaDigits(duplicate.existingReceiptCode) : "-";
      const value = duplicate.value ? ` (${formatFaDigits(duplicate.value)})` : "";
      const rowLabel =
        Number.isInteger(duplicate.inputRowIndex)
          ? `، ردیف ${formatFaDigits(String(duplicate.inputRowIndex + 1))}`
          : "";
      return `${fieldLabel}${value} قبلاً برای ${productName}${stockTitle} در رسید ${receiptCode}${rowLabel} ثبت شده است.`;
    })
    .join("\n")}`;
}
