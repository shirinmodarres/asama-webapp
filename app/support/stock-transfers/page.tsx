"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { Product } from "@/lib/models/product.model";
import type { SepidarStock, StockTransferRequest } from "@/lib/models/stock.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listProducts } from "@/lib/services/product.service";
import {
  createStockTransfer,
  listSepidarStocks,
  listStockTransfers,
} from "@/lib/services/stock.service";
import { toNumber } from "@/lib/utils/number-format";

export default function SupportStockTransfersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [transfers, setTransfers] = useState<StockTransferRequest[]>([]);
  const [productId, setProductId] = useState("");
  const [destinationStockId, setDestinationStockId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadData = async () => {
    const [productData, stockData, transferData] = await Promise.all([
      listProducts("support"),
      listSepidarStocks(),
      listStockTransfers(),
    ]);
    setProducts(productData.filter((product) => product.isSyncedFromSepidar));
    setStocks(stockData);
    setTransfers(transferData);
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        await loadData();
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
      products.map((product) => ({
        value: product.objectId,
        label: `${product.sepidarCode || product.sku} - ${product.name}`,
      })),
    [products],
  );

  const stockOptions = useMemo(
    () =>
      stocks
        .filter((stock) => stock.isActive && !stock.isZagros)
        .map((stock) => ({
          value: stock.objectId,
          label: `${stock.code || "-"} - ${stock.title}`,
        })),
    [stocks],
  );

  const submitTransfer = async () => {
    const nextErrors: Record<string, string> = {};
    const normalizedQuantity = toNumber(quantity);
    if (!productId) nextErrors.productId = "لطفاً کالا را انتخاب کنید.";
    if (!destinationStockId)
      nextErrors.destinationStockId = "لطفاً انبار مقصد را انتخاب کنید.";
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      nextErrors.quantity = "تعداد باید بیشتر از صفر باشد.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      await createStockTransfer({
        productObjectId: productId,
        destinationStockObjectId: destinationStockId,
        quantity: normalizedQuantity,
        note: note.trim() || undefined,
        requestedByName:
          getStoredCurrentUser()?.fullName ||
          getStoredCurrentUser()?.username ||
          "پشتیبان",
      });
      await loadData();
      setProductId("");
      setDestinationStockId("");
      setQuantity("");
      setNote("");
      setMessage("درخواست انتقال موجودی ثبت شد.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<StockTransferRequest>[] = [
    { key: "product", header: "کالا", render: (row) => row.productName || "-" },
    {
      key: "source",
      header: "انبار مبدأ",
      render: (row) => row.sourceStockTitle || "انبار زاگرس",
    },
    {
      key: "destination",
      header: "انبار مقصد",
      render: (row) => row.destinationStockTitle || "-",
    },
    {
      key: "quantity",
      header: "تعداد",
      render: (row) => formatNumber(row.quantity),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.status === "approved" ? "success" : row.status === "rejected" ? "destructive" : "warning"}>
          {row.statusLabel}
        </Badge>
      ),
    },
    {
      key: "requestedAt",
      header: "زمان درخواست",
      render: (row) => (row.requestedAt ? formatDateTime(row.requestedAt) : "-"),
    },
  ];

  return (
    <DashboardLayout role="support" title="انتقال موجودی">
      <SectionHeader
        title="درخواست انتقال موجودی"
        description="انتقال داخلی از انبار زاگرس به انبارهای فروش را ثبت کنید."
      />

      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}

      {isLoading ? (
        <LoadingState title="در حال دریافت اطلاعات انتقال موجودی" />
      ) : (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#DDEAE0] bg-[#F3FAF4] p-3 text-sm font-medium text-[#2F6B3A] md:col-span-2">
                انبار مبدأ: انبار زاگرس
              </div>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کالا</span>
                <SearchableSelect
                  value={productId || undefined}
                  onValueChange={(value) => {
                    setProductId(value);
                    setFieldErrors((current) => ({ ...current, productId: "" }));
                  }}
                  options={productOptions}
                  placeholder="انتخاب کالا"
                  searchPlaceholder="جستجو در کالاها"
                  emptyMessage="کالایی پیدا نشد"
                  invalid={Boolean(fieldErrors.productId)}
                />
                <FieldError message={fieldErrors.productId} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>انبار مقصد</span>
                <SearchableSelect
                  value={destinationStockId || undefined}
                  onValueChange={(value) => {
                    setDestinationStockId(value);
                    setFieldErrors((current) => ({
                      ...current,
                      destinationStockId: "",
                    }));
                  }}
                  options={stockOptions}
                  placeholder="انتخاب انبار مقصد"
                  searchPlaceholder="جستجو در انبارها"
                  emptyMessage="انبار مقصدی پیدا نشد"
                  invalid={Boolean(fieldErrors.destinationStockId)}
                />
                <FieldError message={fieldErrors.destinationStockId} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>تعداد</span>
                <Input
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value);
                    setFieldErrors((current) => ({ ...current, quantity: "" }));
                  }}
                  aria-invalid={Boolean(fieldErrors.quantity)}
                />
                <FieldError message={fieldErrors.quantity} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
                <span>توضیحات</span>
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
            </div>
            <Button
              type="button"
              className="mt-4"
              onClick={submitTransfer}
              disabled={isSubmitting}
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت درخواست انتقال"}
            </Button>
          </Card>

          {transfers.length ? (
            <DataTable columns={columns} rows={transfers} rowKey={(row) => row.objectId} />
          ) : (
            <EmptyState
              title="درخواست انتقالی ثبت نشده است"
              description="درخواست‌های انتقال موجودی پس از ثبت اینجا نمایش داده می‌شوند."
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
