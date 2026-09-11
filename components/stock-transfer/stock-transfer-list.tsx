"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle2, Eye, Pencil, Search, XCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { TransferCancelDialog } from "@/components/stock-transfer/transfer-cancel-dialog";
import { TransferStatusBadge } from "@/components/stock-transfer/transfer-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { StockTransferListResult, StockTransferRequest } from "@/lib/models/stock.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { approveStockTransfer, cancelManagerStockTransfer, cancelStockTransfer, listManagerStockTransfersPage, listSupportStockTransfersPage, rejectStockTransfer } from "@/lib/services/stock.service";

const PAGE_SIZE = 15;
const statusOptions = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "pending_manager_approval", label: "در انتظار تأیید مدیر" },
  { value: "approved_waiting_warehouse_scan", label: "در انتظار اسکن انبار" },
  { value: "completed", label: "تکمیل شده" },
  { value: "rejected", label: "رد شده" },
  { value: "cancelled", label: "لغو شده" },
  { value: "approved", label: "تأیید شده قدیمی" },
];

export function StockTransferList({ role, refreshKey = 0 }: { role: "support" | "manager"; refreshKey?: number }) {
  const [result, setResult] = useState<StockTransferListResult>({ items: [], pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 } });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState("");
  const [cancelTarget, setCancelTarget] = useState<StockTransferRequest | null>(null);
  const actor = getStoredCurrentUser()?.fullName || getStoredCurrentUser()?.username || (role === "manager" ? "مدیر فروش" : "پشتیبان");

  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); setDebouncedSearch(search.trim()); }, 350); return () => window.clearTimeout(timer); }, [search]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const filters = { page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined, status: status === "all" ? undefined : status };
      setResult(role === "manager" ? await listManagerStockTransfersPage(filters) : await listSupportStockTransfersPage(filters));
    } catch (reason) { setError(getErrorMessage(reason)); } finally { setLoading(false); }
  }, [debouncedSearch, page, role, status]);
  useEffect(() => {
    // Data fetching owns the loading/error state for the current server page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, refreshKey]);

  const act = async (transfer: StockTransferRequest, action: "approve" | "reject") => {
    if (submittingId) return;
    setSubmittingId(transfer.objectId);
    try {
      if (action === "approve") { await approveStockTransfer(transfer.objectId, { approvedByName: actor }); toast.success("انتقال تأیید شد و برای اسکن انبار ارسال شد."); }
      else { await rejectStockTransfer(transfer.objectId, { rejectedByName: actor }); toast.success("درخواست انتقال رد شد."); }
      await load();
    } catch (reason) { toast.error(getErrorMessage(reason)); } finally { setSubmittingId(""); }
  };
  const confirmCancel = async () => {
    if (!cancelTarget || submittingId) return;
    setSubmittingId(cancelTarget.objectId);
    try {
      if (role === "manager") await cancelManagerStockTransfer(cancelTarget.objectId, { cancelledByName: actor });
      else await cancelStockTransfer(cancelTarget.objectId, { cancelledByName: actor });
      toast.success(role === "manager" ? "انتقال لغو شد و رزرو موجودی آزاد شد." : "درخواست انتقال لغو شد.");
      setCancelTarget(null); await load();
    } catch (reason) { toast.error(getErrorMessage(reason)); } finally { setSubmittingId(""); }
  };

  return <section className="space-y-4">
    <Card className="p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
        <label className="relative"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6CAE75]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pr-10" placeholder="جستجو با شناسه، کالا، انبار یا ثبت‌کننده" /></label>
        <Select value={status} onValueChange={(value) => { setPage(1); setStatus(value); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
      </div>
    </Card>
    {error ? <Card className="border-[#EBCACA] bg-[#FFF7F7] p-5 text-sm text-[#9C3B3B]"><div className="flex flex-wrap items-center justify-between gap-3"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()}>تلاش دوباره</Button></div></Card> : null}
    {loading ? <TransferListSkeleton /> : result.items.length ? <>
      <Card className="hidden overflow-hidden md:block"><Table><TableHeader><TableRow><TableHead>شماره انتقال</TableHead><TableHead>مبدأ ← مقصد</TableHead><TableHead>کالا / آیتم</TableHead><TableHead>تعداد کل</TableHead><TableHead>ثبت‌کننده</TableHead><TableHead>تاریخ</TableHead><TableHead>وضعیت</TableHead><TableHead>عملیات</TableHead></TableRow></TableHeader><TableBody>{result.items.map((transfer) => <TableRow key={transfer.objectId}><TableCell className="font-mono font-semibold text-[#1F3A5F]">{transfer.objectId}</TableCell><TableCell><Route transfer={transfer} /></TableCell><TableCell><Product transfer={transfer} /></TableCell><TableCell className="font-semibold">{formatNumber(transfer.quantity)}</TableCell><TableCell>{transfer.requestedByName || "-"}</TableCell><TableCell>{transfer.requestedAt ? formatDateTime(transfer.requestedAt) : "-"}</TableCell><TableCell><TransferStatusBadge status={transfer.status} /></TableCell><TableCell><Actions role={role} transfer={transfer} busy={Boolean(submittingId)} onAction={act} onCancel={setCancelTarget} /></TableCell></TableRow>)}</TableBody></Table></Card>
      <div className="grid gap-3 md:hidden">{result.items.map((transfer) => <Card key={transfer.objectId} className="space-y-4 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-xs text-[#64748B]">شناسه انتقال</div><div className="mt-1 font-mono text-sm font-bold text-[#1F3A5F]">{transfer.objectId}</div></div><TransferStatusBadge status={transfer.status} /></div><Route transfer={transfer} /><div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] p-3 text-sm"><Info label="کالا" value={<Product transfer={transfer} />} /><Info label="تعداد کل" value={formatNumber(transfer.quantity)} /><Info label="ثبت‌کننده" value={transfer.requestedByName || "-"} /><Info label="تاریخ" value={transfer.requestedAt ? formatDateTime(transfer.requestedAt) : "-"} /></div><Actions role={role} transfer={transfer} busy={Boolean(submittingId)} onAction={act} onCancel={setCancelTarget} /></Card>)}</div>
      <PaginationBar currentPage={result.pagination.page} totalPages={result.pagination.totalPages} totalItems={result.pagination.total} onPageChange={setPage} />
    </> : !error ? <EmptyState title="انتقالی پیدا نشد" description="با تغییر جستجو یا وضعیت، نتیجه دیگری را بررسی کنید." /> : null}
    <TransferCancelDialog transfer={cancelTarget} mode={role} open={Boolean(cancelTarget)} submitting={submittingId === cancelTarget?.objectId} onOpenChange={(open) => { if (!open) setCancelTarget(null); }} onConfirm={confirmCancel} />
  </section>;
}

function Route({ transfer }: { transfer: StockTransferRequest }) { return <div className="min-w-44"><div className="font-semibold text-[#102034]">{transfer.sourceStockTitle || "-"}</div><div className="mt-1 text-xs text-[#64748B]">به {transfer.destinationStockTitle || "-"}</div></div>; }
function Product({ transfer }: { transfer: StockTransferRequest }) { const count = transfer.items.length || (transfer.productObjectId ? 1 : 0); return <div className="max-w-64 whitespace-normal"><div className="line-clamp-2 font-medium">{count === 1 ? transfer.items[0]?.productName || transfer.productName || "-" : `${formatNumber(count)} نوع کالا`}</div><div className="mt-1 text-xs text-[#64748B]">{formatNumber(count)} آیتم</div></div>; }
function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div><div className="text-xs text-[#64748B]">{label}</div><div className="mt-1 font-medium text-[#102034]">{value}</div></div>; }
function Actions({ role, transfer, busy, onAction, onCancel }: { role: "support" | "manager"; transfer: StockTransferRequest; busy: boolean; onAction: (transfer: StockTransferRequest, action: "approve" | "reject") => void; onCancel: (transfer: StockTransferRequest) => void }) {
  const base = role === "manager" ? "/manager/stock-transfers" : "/support/stock-transfers";
  const supportPending = ["pending", "pending_manager_approval"].includes(transfer.status);
  return <div className="flex flex-wrap gap-2"><Button asChild variant="ghost" size="sm"><Link href={`${base}/${transfer.objectId}`}><Eye />جزئیات</Link></Button>{role === "support" && supportPending ? <><Button asChild variant="outline" size="sm"><Link href={`${base}/${transfer.objectId}/edit`}><Pencil />ویرایش</Link></Button><Button variant="destructive" size="sm" disabled={busy} onClick={() => onCancel(transfer)}><Ban />لغو</Button></> : null}{role === "manager" && transfer.status === "pending_manager_approval" ? <><Button size="sm" disabled={busy} onClick={() => onAction(transfer, "approve")}><CheckCircle2 />تأیید</Button><Button variant="outline" size="sm" disabled={busy} onClick={() => onAction(transfer, "reject")}><XCircle />رد</Button></> : null}{role === "manager" && transfer.status === "approved_waiting_warehouse_scan" ? <Button variant="destructive" size="sm" disabled={busy} onClick={() => onCancel(transfer)}><Ban />لغو</Button> : null}</div>;
}
function TransferListSkeleton() { return <div className="space-y-3"><Card className="hidden p-5 md:block">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex gap-5 border-b border-[#EEF2F6] py-4 last:border-0">{Array.from({ length: 8 }, (_, cell) => <Skeleton key={cell} className="h-5 flex-1" />)}</div>)}</Card><div className="grid gap-3 md:hidden">{Array.from({ length: 4 }, (_, index) => <Card key={index} className="space-y-4 p-4"><Skeleton className="h-5 w-32" /><Skeleton className="h-16 w-full" /><Skeleton className="h-10 w-full" /></Card>)}</div></div>; }
