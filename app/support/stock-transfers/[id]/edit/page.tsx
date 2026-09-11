"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/shared/loading-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Product } from "@/lib/models/product.model";
import type { SepidarStock, StockTransferRequest } from "@/lib/models/stock.model";
import { listProducts } from "@/lib/services/product.service";
import { getSupportStockTransfer, listSupportStocks, updateStockTransfer } from "@/lib/services/stock.service";

export default function EditSupportStockTransferPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [transfer, setTransfer] = useState<StockTransferRequest | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [items, setItems] = useState<Array<{ productObjectId: string; quantity: string }>>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getSupportStockTransfer(params.id), listProducts("support"), listSupportStocks()])
      .then(([loaded, productRows, stockRows]) => {
        setTransfer(loaded); setProducts(productRows); setStocks(stockRows);
        setSource(loaded.sourceStockObjectId || ""); setDestination(loaded.destinationStockObjectId || "");
        setItems(loaded.items.map((item) => ({ productObjectId: item.productObjectId, quantity: String(item.quantity) })));
      })
      .catch((reason) => setError(getErrorMessage(reason)));
  }, [params.id]);

  const save = async () => {
    if (!transfer || !["pending", "pending_manager_approval"].includes(transfer.status)) return;
    setSaving(true); setError("");
    try {
      await updateStockTransfer(transfer.objectId, {
        sourceStockObjectId: source, destinationStockObjectId: destination,
        items: items.filter((item) => item.productObjectId && Number(item.quantity) > 0).map((item) => ({ productObjectId: item.productObjectId, quantity: Number(item.quantity) })),
      });
      router.push(`/support/stock-transfers/${transfer.objectId}`);
    } catch (reason) { setError(getErrorMessage(reason)); } finally { setSaving(false); }
  };

  if (!transfer) return <DashboardLayout role="support" title="ویرایش انتقال">{error ? <InlineErrorMessage message={error} /> : <LoadingState title="در حال دریافت انتقال" />}</DashboardLayout>;
  return <DashboardLayout role="support" title="ویرایش انتقال">
    <div className="mx-auto max-w-4xl space-y-5" dir="rtl">
      {error ? <InlineErrorMessage message={error} /> : null}
      <Card className="space-y-4 p-6">
        <h1 className="text-xl font-bold text-[#102034]">ویرایش درخواست انتقال</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm"><span>انبار مبدأ</span><select className="h-11 w-full rounded-xl border px-3" value={source} onChange={(event) => setSource(event.target.value)}>{stocks.map((stock) => <option key={stock.objectId} value={stock.objectId}>{stock.title}</option>)}</select></label>
          <label className="space-y-2 text-sm"><span>انبار مقصد</span><select className="h-11 w-full rounded-xl border px-3" value={destination} onChange={(event) => setDestination(event.target.value)}>{stocks.map((stock) => <option key={stock.objectId} value={stock.objectId}>{stock.title}</option>)}</select></label>
        </div>
        {items.map((item, index) => <div className="grid gap-3 md:grid-cols-[1fr_140px]" key={`${item.productObjectId}-${index}`}>
          <select className="h-11 rounded-xl border px-3" value={item.productObjectId} onChange={(event) => setItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, productObjectId: event.target.value } : row))}>{products.map((product) => <option key={product.objectId} value={product.objectId}>{product.name} | {product.sepidarCode || product.sku}</option>)}</select>
          <Input type="number" min={1} value={item.quantity} onChange={(event) => setItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: event.target.value } : row))} />
        </div>)}
        <Button onClick={save} disabled={saving}>{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}</Button>
      </Card>
    </div>
  </DashboardLayout>;
}
