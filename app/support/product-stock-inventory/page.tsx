"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
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
    if (!dirtyRows.length) return;
    const invalidRow = dirtyRows.find((row) => {
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
        dirtyRows.map((row) => {
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
      render: (row) => (
        <div>
          <p className="font-semibold text-[#1F3A5F]">{row.productName || "-"}</p>
          <p className="mt-1 text-xs text-[#6B7280]">
            {formatFaDigits(row.productSku || "-")}
          </p>
        </div>
      ),
    },
    { key: "stock", header: "انبار", render: (row) => row.stockTitle || "-" },
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
              value={draft?.salesQuantity ?? ""}
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
                کل موجودی واقعی این انبار قابل فروش است.
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
      render: (row) => formatNumber(row.availableSalesQuantity),
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
          {hasDirtyChanges
            ? `${formatFaDigits(String(dirtyRows.length))} تغییر ذخیره‌نشده`
            : "همه تغییرات ذخیره شده‌اند."}
        </div>
        <Button
          type="button"
          onClick={saveChanges}
          disabled={!hasDirtyChanges || isSaving}
        >
          <Save className="size-4" />
          {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </div>
      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
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
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState
          title="موجودی کالا و انبار ثبت نشده است"
          description="پس از همگام‌سازی انبارها و ورود کالا، موجودی‌ها اینجا نمایش داده می‌شوند."
        />
      )}
    </DashboardLayout>
  );
}
