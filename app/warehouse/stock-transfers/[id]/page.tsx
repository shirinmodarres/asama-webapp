"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FileText, ScanLine } from "lucide-react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { TransferStatusBadge } from "@/components/stock-transfer/transfer-status-badge";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { StockTransferRequest } from "@/lib/models/stock.model";
import { getWarehouseStockTransfer } from "@/lib/services/stock.service";

export default function WarehouseStockTransferDetailPage() {
  const params = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<StockTransferRequest | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void getWarehouseStockTransfer(params.id).then(setTransfer).catch((e) => setError(getErrorMessage(e))); }, [params.id]);
  const items = useMemo(() => transfer?.items ?? [], [transfer]);
  return <DashboardLayout role="warehouse" title="جزئیات انتقال">
    <SectionHeader title="جزئیات انتقال انبار" description="مشاهده اقلام و وضعیت درخواست انتقال" actions={<Link href="/warehouse/stock-transfers" className="btn-secondary"><ArrowRight className="size-4" />بازگشت</Link>} />
    {error ? <InlineErrorMessage message={error} /> : !transfer ? <LoadingState title="در حال دریافت جزئیات انتقال" /> : <div className="space-y-5">
      <Card className="p-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Info label="وضعیت" value={<TransferStatusBadge status={transfer.status} />} />
        <Info label="انبار مبدأ" value={transfer.sourceStockTitle || "-"} /><Info label="انبار مقصد" value={transfer.destinationStockTitle || "-"} /><Info label="تعداد کل" value={formatNumber(transfer.quantity)} />
        <Info label="درخواست‌کننده" value={transfer.requestedByName || "-"} /><Info label="زمان درخواست" value={transfer.requestedAt ? formatDateTime(transfer.requestedAt) : "-"} /><Info label="تأییدکننده" value={transfer.approvedByName || "-"} /><Info label="زمان تأیید" value={transfer.approvedAt ? formatDateTime(transfer.approvedAt) : "-"} />
      </div><div className="mt-4 flex flex-wrap gap-2">{transfer.transferSlipId ? <Button asChild variant="outline"><Link href={`/warehouse/stock-transfers/${transfer.objectId}/pdf`}><FileText className="size-4" />مشاهده حواله انتقال</Link></Button> : null}{transfer.status === "approved_waiting_warehouse_scan" ? <Button asChild><Link href={`/warehouse/stock-transfers/${transfer.objectId}/execute`}><ScanLine className="size-4" />ثبت کدها</Link></Button> : null}</div></Card>
      <Card className="overflow-hidden p-0"><div className="border-b border-[#E5E7EB] px-5 py-4"><h2 className="font-bold">اقلام انتقال</h2></div><div className="overflow-x-auto"><table className="w-full border-collapse text-right text-sm"><thead className="bg-[#EEF4F8] text-[#1F3A5F]"><tr><th className="border-b border-[#D8E4F0] px-4 py-3">ردیف</th><th className="border-b border-[#D8E4F0] px-4 py-3">کالا</th><th className="border-b border-[#D8E4F0] px-4 py-3">تعداد</th></tr></thead><tbody>{items.map((item,index)=><tr key={`${item.productObjectId}-${index}`} className="border-t border-[#D8E4F0]"><td className="px-4 py-3">{formatNumber(index+1)}</td><td className="px-4 py-3">{item.productName || "-"}</td><td className="px-4 py-3">{formatNumber(item.quantity)}</td></tr>)}</tbody></table></div></Card>
    </div>}
  </DashboardLayout>;
}
function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"><div className="text-xs text-[#64748B]">{label}</div><div className="mt-1 text-sm font-semibold text-[#102034]">{value}</div></div>; }
