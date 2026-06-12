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
import type { ProductStockInventory } from "@/lib/models/stock.model";
import {
  listProductStockInventory,
  updateProductStockInventory,
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
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  const saveRow = async (row: ProductStockInventory) => {
    const draft = drafts[row.objectId];
    if (!draft) return;
    const salesQuantity = toNumber(draft.salesQuantity);
    if (!draft.useFullRealQuantityForSales && (!Number.isFinite(salesQuantity) || salesQuantity < 0)) {
      setError("موجودی فروش معتبر نیست.");
      return;
    }
    setSavingId(row.objectId);
    setError("");
    setMessage("");
    try {
      await updateProductStockInventory(row.objectId, {
        salesQuantity,
        useFullRealQuantityForSales: draft.useFullRealQuantityForSales,
      });
      await loadRows();
      setMessage("موجودی فروش به‌روزرسانی شد.");
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingId("");
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
        return (
          <div className="min-w-[160px] space-y-2">
            <Input
              inputMode="numeric"
              value={draft?.salesQuantity ?? ""}
              onChange={(event) =>
                updateDraft(row.objectId, { salesQuantity: event.target.value })
              }
              disabled={useFull}
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
      render: (row) => (
        <label className="inline-flex items-center gap-2 text-xs text-[#334155]">
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
      ),
    },
    {
      key: "available",
      header: "موجودی قابل فروش",
      render: (row) => formatNumber(row.availableSalesQuantity),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Button
          type="button"
          size="sm"
          onClick={() => saveRow(row)}
          disabled={Boolean(savingId)}
        >
          <Save className="size-4" />
          ذخیره
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout role="support" title="موجودی فروش">
      <SectionHeader
        title="موجودی فروش بر اساس انبار"
        description="موجودی فروش هر کالا را برای هر انبار سپیدار مدیریت کنید."
      />
      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}
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
