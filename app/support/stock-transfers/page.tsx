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
import type { ProductStockInventory } from "@/lib/models/stock.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listProducts } from "@/lib/services/product.service";
import {
  createStockTransfer,
  listProductStockInventory,
  listSupportStocks,
  listStockTransfers,
} from "@/lib/services/stock.service";
import { formatFaDigits, toNumber } from "@/lib/utils/number-format";

export default function SupportStockTransfersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [transfers, setTransfers] = useState<StockTransferRequest[]>([]);
  const [productId, setProductId] = useState("");
  const [sourceStockId, setSourceStockId] = useState("");
  const [destinationStockId, setDestinationStockId] = useState("");
  const [productInventories, setProductInventories] = useState<
    ProductStockInventory[]
  >([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
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
      listSupportStocks(),
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

  useEffect(() => {
    let isMounted = true;
    async function loadProductInventory() {
      setProductInventories([]);
      if (!productId) return;
      setIsLoadingInventory(true);
      try {
        const data = await listProductStockInventory({
          productObjectId: productId,
        });
        if (!isMounted) return;
        setProductInventories(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoadingInventory(false);
      }
    }
    loadProductInventory();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.objectId,
        label: `${formatFaDigits(product.sepidarCode || product.sku)} - ${formatFaDigits(product.name)}`,
      })),
    [products],
  );

  const sourceStockOptions = useMemo(
    () =>
      stocks
        .filter((stock) => stock.isActive)
        .map((stock) => ({
          value: stock.objectId,
          label: `${formatFaDigits(stock.code || "-")} - ${stock.title}`,
        })),
    [stocks],
  );
  const destinationStockOptions = useMemo(
    () => sourceStockOptions.filter((stock) => stock.value !== sourceStockId),
    [sourceStockId, sourceStockOptions],
  );
  const sourceInventory = productInventories.find(
    (inventory) => inventory.stockObjectId === sourceStockId,
  );
  const destinationInventory = productInventories.find(
    (inventory) => inventory.stockObjectId === destinationStockId,
  );

  const submitTransfer = async () => {
    const nextErrors: Record<string, string> = {};
    const normalizedQuantity = toNumber(quantity);
    if (!productId) nextErrors.productId = "لطفاً کالا را انتخاب کنید.";
    if (!sourceStockId)
      nextErrors.sourceStockId = "لطفاً انبار مبدأ را انتخاب کنید.";
    if (!destinationStockId)
      nextErrors.destinationStockId = "لطفاً انبار مقصد را انتخاب کنید.";
    if (sourceStockId && destinationStockId === sourceStockId) {
      nextErrors.destinationStockId =
        "انبار مبدأ و مقصد باید متفاوت باشند.";
    }
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      nextErrors.quantity = "تعداد باید بیشتر از صفر باشد.";
    }
    if (
      Number.isFinite(normalizedQuantity) &&
      normalizedQuantity > 0 &&
      sourceInventory &&
      normalizedQuantity > sourceInventory.realQuantity
    ) {
      nextErrors.quantity = "تعداد انتقال نمی‌تواند بیشتر از موجودی واقعی مبدأ باشد.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      await createStockTransfer({
        productObjectId: productId,
        sourceStockObjectId: sourceStockId,
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
      setSourceStockId("");
      setDestinationStockId("");
      setProductInventories([]);
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
      header: "تعداد کالا",
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
      header: "تاریخ",
      render: (row) => (row.requestedAt ? formatDateTime(row.requestedAt) : "-"),
    },
  ];

  return (
    <DashboardLayout role="support" title="انتقال موجودی">
      <SectionHeader
        title="درخواست انتقال موجودی"
        description="انتقال داخلی بین انبارهای سپیدار را برای تأیید مدیر ثبت کنید."
      />

      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}

      {isLoading ? (
        <LoadingState title="در حال دریافت اطلاعات انتقال موجودی" />
      ) : (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کالا</span>
                <SearchableSelect
                  value={productId || undefined}
                  onValueChange={(value) => {
                    setProductId(value);
                    setSourceStockId("");
                    setDestinationStockId("");
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
                <span>انبار مبدأ</span>
                <SearchableSelect
                  value={sourceStockId || undefined}
                  onValueChange={(value) => {
                    setSourceStockId(value);
                    if (value === destinationStockId) {
                      setDestinationStockId("");
                    }
                    setFieldErrors((current) => ({
                      ...current,
                      sourceStockId: "",
                    }));
                  }}
                  options={sourceStockOptions}
                  placeholder="انتخاب انبار مبدأ"
                  searchPlaceholder="جستجو در انبارها"
                  emptyMessage="انبار مبدأیی پیدا نشد"
                  invalid={Boolean(fieldErrors.sourceStockId)}
                />
                <FieldError message={fieldErrors.sourceStockId} />
                {productId && sourceStockId ? (
                  <p className="text-xs text-[#6B7280]">
                    موجودی واقعی مبدأ:{" "}
                    {isLoadingInventory
                      ? "در حال دریافت..."
                      : formatNumber(sourceInventory?.realQuantity ?? 0)}
                  </p>
                ) : null}
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
                  options={destinationStockOptions}
                  placeholder="انتخاب انبار مقصد"
                  searchPlaceholder="جستجو در انبارها"
                  emptyMessage="انبار مقصدی پیدا نشد"
                  invalid={Boolean(fieldErrors.destinationStockId)}
                />
                <FieldError message={fieldErrors.destinationStockId} />
                {productId && destinationStockId ? (
                  <p className="text-xs text-[#6B7280]">
                    موجودی واقعی مقصد:{" "}
                    {isLoadingInventory
                      ? "در حال دریافت..."
                      : formatNumber(destinationInventory?.realQuantity ?? 0)}
                  </p>
                ) : null}
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
