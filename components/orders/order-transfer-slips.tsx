"use client";

import { useEffect, useState } from "react";
import { httpClient } from "@/lib/api/http-client";
import { getErrorMessage } from "@/lib/api/api-error";
import { transferStatusLabel } from "@/components/stock-transfer/transfer-status-badge";
import { formatFaDigits } from "@/lib/utils/number-format";

type TransferSlip = { objectId: string; slipCode: string; sourceStockTitle: string; destinationStockTitle: string; status: string | null; items: { productName: string; quantity: number }[] };

export function OrderTransferSlips({ orderId }: { orderId: string }) {
  const [items, setItems] = useState<TransferSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    httpClient.get<TransferSlip[]>(`/api/orders/${encodeURIComponent(orderId)}/transfer-slips`)
      .then((rows) => { if (active) setItems(rows); })
      .catch((reason) => { if (active) setError(getErrorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId]);
  return <section className="space-y-3 rounded-xl border border-border bg-white p-5">
    <h3 className="font-semibold">حواله‌های انتقال کالاهای سفارش</h3>
    {loading ? <p className="text-sm text-muted-foreground">در حال دریافت حواله‌ها...</p> : error ? <p className="text-sm text-destructive">{error}</p> : !items.length ? <p className="text-sm text-muted-foreground">حواله انتقال مرتبطی برای کالاهای خارج‌شده یافت نشد.</p> : items.map((slip) => <div key={slip.objectId} className="space-y-2 rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap gap-3"><span>شماره حواله: {formatFaDigits(slip.slipCode) || "-"}</span><span>مبدأ: {slip.sourceStockTitle || "-"}</span><span>مقصد: {slip.destinationStockTitle || "-"}</span>{slip.status ? <span>وضعیت: {transferStatusLabel(slip.status)}</span> : <span>وضعیت: نامشخص</span>}</div>
      {slip.items.map((item, index) => <p key={`${item.productName}-${index}`}>{item.productName || "کالای نامشخص"} · تعداد: {formatFaDigits(String(item.quantity ?? 0))}</p>)}
    </div>)}
  </section>;
}
