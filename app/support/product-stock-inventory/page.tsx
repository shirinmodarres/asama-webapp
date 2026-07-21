"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Save, Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatNumber } from "@/lib/expert/utils";
import type {
  BulkUpdateProductStockInventoryFailure,
  ProductStockInventory,
} from "@/lib/models/stock.model";
import {
  bulkUpdateProductStockInventory,
  listProductStockInventory,
} from "@/lib/services/stock.service";
import { formatFaDigits, toNumber } from "@/lib/utils/number-format";

interface DraftState {
  salesQuantity: string;
  useFullRealQuantityForSales: boolean;
}

export default function SupportProductStockInventoryPage() {
  const [rows, setRows] = useState<ProductStockInventory[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeStockKey, setActiveStockKey] = useState("");
  const [search, setSearch] = useState("");
  const [failedUpdates, setFailedUpdates] = useState<
    BulkUpdateProductStockInventoryFailure[]
  >([]);

  const loadRows = async () => {
    const data = await listProductStockInventory();
    setRows(data);
    setDrafts(
      Object.fromEntries(
        data.map((row) => [
          row.objectId,
          {
            salesQuantity: String(row.salesQuantity),
            useFullRealQuantityForSales: row.useFullRealQuantityForSales,
          },
        ]),
      ),
    );
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        await loadRows();
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

  const updateDraft = (objectId: string, patch: Partial<DraftState>) => {
    setMessage("");
    setFailedUpdates([]);
    setDrafts((current) => ({
      ...current,
      [objectId]: {
        salesQuantity: current[objectId]?.salesQuantity ?? "0",
        useFullRealQuantityForSales:
          current[objectId]?.useFullRealQuantityForSales ?? false,
        ...patch,
      },
    }));
  };

  const isSalesQuantityEdited = (row: ProductStockInventory) => {
    const draft = drafts[row.objectId];
    if (!draft) return false;
    return draft.salesQuantity.trim() !== String(row.salesQuantity);
  };

  const isUseFullEdited = (row: ProductStockInventory) => {
    const draft = drafts[row.objectId];
    return draft
      ? draft.useFullRealQuantityForSales !== row.useFullRealQuantityForSales
      : false;
  };

  const dirtyRows = rows.filter((row) => {
    const draft = drafts[row.objectId];
    if (!draft) return false;
    return isSalesQuantityEdited(row) || isUseFullEdited(row);
  });
  const hasDirtyChanges = dirtyRows.length > 0;
  const warehouseGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        title: string;
        code: number | null;
        rows: ProductStockInventory[];
      }
    >();
    rows.forEach((row) => {
      const key =
        row.stockObjectId || `sepidar-${row.sepidarStockId ?? row.stockTitle}`;
      const existing = groups.get(key) || {
        key,
        title: row.stockTitle || "بدون انبار",
        code: row.sepidarStockId,
        rows: [],
      };
      existing.rows.push(row);
      groups.set(key, existing);
    });
    return Array.from(groups.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "fa"),
    );
  }, [rows]);
  const selectedWarehouse =
    warehouseGroups.find((group) => group.key === activeStockKey) || null;
  const visibleRows = useMemo(() => {
    const baseRows = selectedWarehouse?.rows || [];
    const term = search.trim().toLowerCase();
    if (!term) return baseRows;
    return baseRows.filter((row) =>
      [row.productName, row.productSku, row.sepidarItemId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [search, selectedWarehouse]);
  const currentWarehouseDirtyRows = dirtyRows.filter((row) =>
    selectedWarehouse
      ? selectedWarehouse.rows.some((item) => item.objectId === row.objectId)
      : false,
  );
  const dirtyCountByWarehouse = useMemo(() => {
    const counts = new Map<string, number>();
    dirtyRows.forEach((row) => {
      const key =
        row.stockObjectId || `sepidar-${row.sepidarStockId ?? row.stockTitle}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [dirtyRows]);

  useEffect(() => {
    if (!hasDirtyChanges) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasDirtyChanges]);

  useEffect(() => {
    if (!hasDirtyChanges) return undefined;
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (!window.confirm("تغییرات ذخیره‌نشده دارید. از صفحه خارج می‌شوید؟")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasDirtyChanges]);

  const saveChanges = async () => {
    if (!currentWarehouseDirtyRows.length) return;
    const invalidRow = currentWarehouseDirtyRows.find((row) => {
      const draft = drafts[row.objectId];
      const salesQuantity = toNumber(draft?.salesQuantity ?? "");
      return (
        draft &&
        !draft.useFullRealQuantityForSales &&
        (!Number.isFinite(salesQuantity) || salesQuantity < 0)
      );
    });
    if (invalidRow) {
      setError("موجودی فروش معتبر نیست.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");
    setFailedUpdates([]);
    try {
      const result = await bulkUpdateProductStockInventory(
        currentWarehouseDirtyRows.map((row) => {
          const draft = drafts[row.objectId];
          return {
            objectId: row.objectId,
            salesQuantity: toNumber(draft?.salesQuantity ?? "0"),
            useFullRealQuantityForSales:
              draft?.useFullRealQuantityForSales ?? false,
          };
        }),
      );
      if (result.updated.length) {
        const updatedById = new Map(
          result.updated.map((inventory) => [inventory.objectId, inventory]),
        );
        setRows((current) =>
          current.map((row) => updatedById.get(row.objectId) ?? row),
        );
        setDrafts((current) => {
          const next = { ...current };
          result.updated.forEach((row) => {
            next[row.objectId] = {
              salesQuantity: String(row.salesQuantity),
              useFullRealQuantityForSales: row.useFullRealQuantityForSales,
            };
          });
          return next;
        });
      }
      setFailedUpdates(result.failed);
      const successText = `به‌روزرسانی موفق: ${formatFaDigits(
        String(result.summary.updated),
      )}`;
      const failedText = result.summary.failed
        ? `، ناموفق: ${formatFaDigits(String(result.summary.failed))}`
        : "";
      setMessage(`${successText}${failedText}`);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const columns: DataTableColumn<ProductStockInventory>[] = [
    {
      key: "product",
      header: "کالا",
      cellClassName: "min-w-[260px]",
      render: (row) => {
        const isEdited = isSalesQuantityEdited(row) || isUseFullEdited(row);
        return (
          <div
            className={
              isEdited ? "rounded-xl bg-[#FFF8E8] px-3 py-2" : undefined
            }
          >
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[#1F3A5F]">
                {row.productName || "-"}
              </p>
              {isEdited ? <Badge variant="warning">تغییر یافته</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-[#6B7280]">
              {formatFaDigits(row.productSku || "-")}
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              برند: {row.brandName || "-"}
            </p>
          </div>
        );
      },
    },
    {
      key: "brand",
      header: "برند",
      render: (row) => row.brandName || "-",
    },
    {
      key: "real",
      header: "موجودی واقعی",
      render: (row) => formatNumber(row.realQuantity),
    },
    {
      key: "sales",
      header: "موجودی فروش",
      render: (row) => {
        const draft = drafts[row.objectId];
        const useFull = draft?.useFullRealQuantityForSales ?? false;
        const isEdited = isSalesQuantityEdited(row);
        return (
          <div className="min-w-[160px] space-y-2">
            <Input
              inputMode="numeric"
              value={
                useFull
                  ? String(row.salesCapacity ?? row.realQuantity)
                  : (draft?.salesQuantity ?? "")
              }
              onChange={(event) =>
                updateDraft(row.objectId, { salesQuantity: event.target.value })
              }
              disabled={useFull}
              className={
                isEdited
                  ? "border-[#D89A20] bg-[#FFF8E8] focus-visible:ring-[#D89A20]"
                  : undefined
              }
            />
            {useFull ? (
              <p className="text-xs leading-6 text-[#2F6B3A]">
                کل موجودی واقعی این انبار، منهای رزرو، به‌صورت خودکار قابل فروش است.
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "use-full",
      header: "استفاده کامل",
      render: (row) => {
        const isEdited = isUseFullEdited(row);
        return (
          <label
            className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
              isEdited ? "bg-[#FFF8E8] text-[#7A4B00]" : "text-[#334155]"
            }`}
          >
            <input
              type="checkbox"
              checked={drafts[row.objectId]?.useFullRealQuantityForSales ?? false}
              onChange={(event) =>
                updateDraft(row.objectId, {
                  useFullRealQuantityForSales: event.target.checked,
                })
              }
              className="size-4 accent-[#6CAE75]"
            />
            کل موجودی واقعی
          </label>
        );
      },
    },
    {
      key: "available",
      header: "موجودی قابل فروش",
      render: (row) => formatNumber(row.availableForSale),
    },
  ];

  return (
    <DashboardLayout role="support" title="موجودی فروش">
      <SectionHeader
        title="موجودی فروش بر اساس انبار"
        description="موجودی فروش هر کالا را برای هر انبار سپیدار مدیریت کنید."
      />
      <div className="sticky top-3 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="text-sm text-[#334155]">
          {currentWarehouseDirtyRows.length
            ? `${formatFaDigits(String(currentWarehouseDirtyRows.length))} تغییر ذخیره‌نشده در این انبار`
            : selectedWarehouse
              ? "همه تغییرات این انبار ذخیره شده‌اند."
              : "برای ویرایش موجودی فروش، یک انبار را باز کنید."}
        </div>
        <Button
          type="button"
          onClick={saveChanges}
          disabled={!currentWarehouseDirtyRows.length || isSaving}
        >
          <Save className="size-4" />
          {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </div>
      {message ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {error ? <InlineErrorMessage message={error} /> : null}
      {failedUpdates.length ? (
        <div className="rounded-lg border border-[#F3B4B4] bg-[#FFF1F1] px-4 py-3 text-sm text-[#8A1F1F]">
          <p className="font-semibold">خطا در برخی ردیف‌ها</p>
          <ul className="mt-2 space-y-1">
            {failedUpdates.map((failure, index) => (
              <li key={`${failure.objectId ?? "missing"}-${index}`}>
                {failure.objectId || "-"}: {failure.message || failure.code}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {isLoading ? (
        <LoadingState title="در حال دریافت موجودی کالا و انبار" />
      ) : rows.length ? (
        <div className="space-y-3">
          {warehouseGroups.map((group) => {
            const isOpen = selectedWarehouse?.key === group.key;
            const dirtyCount = dirtyCountByWarehouse.get(group.key) ?? 0;
            const totalRealQuantity = group.rows.reduce(
              (sum, row) => sum + row.realQuantity,
              0,
            );
            const totalSalesQuantity = group.rows.reduce(
              (sum, row) => sum + row.salesQuantity,
              0,
            );

            return (
              <section
                key={group.key}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
                  isOpen ? "border-[#CFE3D3]" : "border-[#E5E7EB]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveStockKey((current) =>
                      current === group.key ? "" : group.key,
                    );
                    setSearch("");
                  }}
                  className={`flex w-full flex-col gap-3 px-4 py-4 text-right transition-colors md:flex-row md:items-center md:justify-between ${
                    isOpen ? "bg-[#F3FAF4]" : "bg-white hover:bg-[#F8FBFD]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-[#102034]">
                        {group.title}
                      </h2>
                      {group.rows[0]?.brandName ? (
                        <span className="rounded-full bg-[#EEF7F0] px-2 py-0.5 text-xs text-[#2F6B3A]">
                          {group.rows[0].brandName}
                        </span>
                      ) : null}
                      {group.code ? (
                        <span className="text-xs text-[#64748B]">
                          {formatFaDigits(String(group.code))}
                        </span>
                      ) : null}
                      {dirtyCount ? (
                        <Badge variant="warning">
                          {formatFaDigits(String(dirtyCount))} تغییر
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-6 text-[#64748B]">
                      {formatNumber(group.rows.length)} کالا
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#536275]">
                    <span>
                      موجودی واقعی:{" "}
                      <strong className="text-[#1F3A5F]">
                        {formatNumber(totalRealQuantity)}
                      </strong>
                    </span>
                    <span>
                      موجودی فروش:{" "}
                      <strong className="text-[#1F3A5F]">
                        {formatNumber(totalSalesQuantity)}
                      </strong>
                    </span>
                    <ChevronDown
                      className={`size-4 shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-[#6CAE75]" : "text-[#64748B]"
                      }`}
                    />
                  </div>
                </button>

                {isOpen ? (
                  <div className="space-y-4 border-t border-[#E5E7EB] bg-[#FBFCFD] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="text-sm text-[#334155]">
                        <span className="font-semibold">{group.title}</span>
                        <span className="mx-2 text-[#94A3B8]">|</span>
                        {formatNumber(visibleRows.length)} کالا
                      </div>
                      <div className="relative w-full md:max-w-md">
                        <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
                        <Input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="جستجو نام یا کد کالا"
                          className="pr-10"
                        />
                      </div>
                    </div>
                    {visibleRows.length ? (
                      <DataTable
                        columns={columns}
                        rows={visibleRows}
                        rowKey={(row) => row.objectId}
                      />
                    ) : (
                      <EmptyState
                        title="کالایی در این انبار پیدا نشد"
                        description="عبارت جستجو را تغییر دهید یا انبار دیگری انتخاب کنید."
                      />
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="موجودی کالا و انبار ثبت نشده است"
          description="پس از همگام‌سازی انبارها و ورود کالا، موجودی‌ها اینجا نمایش داده می‌شوند."
        />
      )}
    </DashboardLayout>
  );
}
