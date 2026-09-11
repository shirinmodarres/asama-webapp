"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ListFilter, ScanLine, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { TransferStatusBadge } from "@/components/stock-transfer/transfer-status-badge";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { StockTransferRequest } from "@/lib/models/stock.model";
import type { WarehouseItemUnit } from "@/lib/models/warehouse.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  executeStockTransfer,
  listWarehouseStockTransfersPage,
  validateStockTransferScan,
} from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const PAGE_SIZE = 25;

export default function WarehouseStockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTransfer, setActiveTransfer] =
    useState<StockTransferRequest | null>(null);
  const [scanCode, setScanCode] = useState("");
  const [scannedUnits, setScannedUnits] = useState<WarehouseItemUnit[]>([]);
  const [scanError, setScanError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmittingScan, setIsSubmittingScan] = useState(false);
  const scanInputRef = useRef<HTMLInputElement | null>(null);

  const reloadTransfers = useCallback(async () => {
    const result = await listWarehouseStockTransfersPage({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
    });
    setTransfers(result.items);
    setTotalPages(result.pagination.totalPages);
    setTotalItems(result.pagination.total);
  }, [debouncedSearch, page, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const result = await listWarehouseStockTransfersPage({
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
          status: status === "all" ? undefined : status,
        });
        if (isMounted) {
          setTransfers(result.items);
          setTotalPages(result.pagination.totalPages);
          setTotalItems(result.pagination.total);
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
  }, [debouncedSearch, page, status]);

  useEffect(() => {
    if (activeTransfer) {
      window.setTimeout(() => scanInputRef.current?.focus(), 0);
    }
  }, [activeTransfer]);

  const handleScan = async () => {
    if (!activeTransfer) return;
    const code = scanCode.trim();
    if (!code) {
      setScanError("کد رهگیری یا سریال را وارد کنید.");
      scanInputRef.current?.focus();
      return;
    }
    if (scannedUnits.length >= activeTransfer.quantity) {
      setScanError("تعداد کالاهای اسکن‌شده بیشتر از تعداد انتقال است.");
      setScanCode("");
      scanInputRef.current?.focus();
      return;
    }
    setIsSubmittingScan(true);
    setScanError("");
    try {
      const unit = await validateStockTransferScan(activeTransfer.objectId, {
        scannedCode: code,
        currentScannedUnitIds: scannedUnits.map((item) => item.objectId),
      });
      if (scannedUnits.some((item) => item.objectId === unit.objectId)) {
        setScanError("این کالا قبلاً اسکن شده است.");
      } else {
        setScannedUnits((current) => [...current, unit]);
        setScanCode("");
      }
    } catch (scanFailure) {
      setScanError(getErrorMessage(scanFailure));
    } finally {
      setIsSubmittingScan(false);
      window.setTimeout(() => scanInputRef.current?.focus(), 0);
    }
  };

  const confirmExecution = async () => {
    if (!activeTransfer) return;
    if (scannedUnits.length !== activeTransfer.quantity) {
      setScanError("تعداد کدهای اسکن‌شده با تعداد انتقال برابر نیست.");
      scanInputRef.current?.focus();
      return;
    }
    setIsSubmittingScan(true);
    setScanError("");
    try {
      await executeStockTransfer(activeTransfer.objectId, {
        unitObjectIds: scannedUnits.map((unit) => unit.objectId),
        executedByName:
          getStoredCurrentUser()?.fullName ||
          getStoredCurrentUser()?.username ||
          "انباردار",
      });
      setMessage("انتقال با کدهای رهگیری ثبت‌شده تکمیل شد.");
      setActiveTransfer(null);
      setScannedUnits([]);
      setScanCode("");
      await reloadTransfers();
    } catch (executeFailure) {
      setScanError(getErrorMessage(executeFailure));
    } finally {
      setIsSubmittingScan(false);
    }
  };

  const handleScanKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void handleScan();
  };

  const columns: DataTableColumn<StockTransferRequest>[] = [
    {
      key: "source",
      header: "مبدأ",
      render: (row) => row.sourceStockTitle || "-",
    },
    {
      key: "destination",
      header: "مقصد",
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
      render: (row) => <TransferStatusBadge status={row.status} />,
    },
    {
      key: "date",
      header: "تاریخ",
      render: (row) =>
        row.requestedAt ? formatDateTime(row.requestedAt) : "-",
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/warehouse/stock-transfers/${row.objectId}`}>جزئیات</Link>
          </Button>
          {row.status === "approved_waiting_warehouse_scan" ? (
            <Button asChild size="sm">
              <Link href={`/warehouse/stock-transfers/${row.objectId}/execute`}>
                <ScanLine className="size-4" />
                ثبت کدها
              </Link>
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(search || status !== "all");

  return (
    <DashboardLayout role="warehouse" title="انتقال‌ها">
      <SectionHeader
        title="انتقال‌های بین انبارها"
        description="مشاهده درخواست‌ها و وضعیت انتقال کالا بین انبارهای سپیدار"
      />
      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}

      {activeTransfer ? (
        <section className="rounded-xl border border-[#D8E4F0] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#102034]">
                ثبت کدهای رهگیری انتقال
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                {activeTransfer.productName || "-"} از {activeTransfer.sourceStockTitle || "-"} به {activeTransfer.destinationStockTitle || "-"}
              </p>
            </div>
            <div className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#1F3A5F]">
              {formatNumber(scannedUnits.length)} / {formatNumber(activeTransfer.quantity)}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>اسکن سریال / کد رهگیری</span>
              <Input
                ref={scanInputRef}
                value={scanCode}
                onChange={(event) => setScanCode(event.target.value)}
                onKeyDown={handleScanKeyDown}
                placeholder="اسکن کنید و Enter بزنید"
              />
            </label>
            <Button type="button" variant="outline" onClick={handleScan} disabled={isSubmittingScan}>
              <ScanLine className="size-4" />
              ثبت اسکن
            </Button>
            <Button
              type="button"
              onClick={confirmExecution}
              disabled={
                isSubmittingScan ||
                scannedUnits.length !== activeTransfer.quantity
              }
            >
              <CheckCircle2 className="size-4" />
              تأیید انتقال
            </Button>
          </div>
          {scanError ? <p className="mt-3 text-sm font-medium text-red-600">{scanError}</p> : null}
          {scannedUnits.length ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-[#E5E7EB]">
              <table className="min-w-full text-right text-sm">
                <thead className="bg-[#F8FAFC] text-[#64748B]">
                  <tr>
                    <th className="px-3 py-2">ردیف</th>
                    <th className="px-3 py-2">شناسه محصول</th>
                    <th className="px-3 py-2">سریال</th>
                    <th className="px-3 py-2">کد رهگیری</th>
                    <th className="px-3 py-2">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {scannedUnits.map((unit, index) => (
                    <tr key={unit.objectId} className="border-t border-[#E5E7EB]">
                      <td className="px-3 py-2">{formatNumber(index + 1)}</td>
                      <td className="px-3 py-2">{unit.productIdentifier ? formatFaDigits(unit.productIdentifier) : "-"}</td>
                      <td className="px-3 py-2">{unit.serialNumber ? formatFaDigits(unit.serialNumber) : "-"}</td>
                      <td className="px-3 py-2">{unit.trackingCode ? formatFaDigits(unit.trackingCode) : "-"}</td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setScannedUnits((current) =>
                              current.filter((item) => item.objectId !== unit.objectId),
                            )
                          }
                        >
                          حذف
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در انتقال‌ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس کالا، مبدأ یا مقصد"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={status}
                onValueChange={(value) => {
                  setPage(1);
                  setStatus(value);
                }}
                options={[
                  { value: "all", label: "همه وضعیت‌ها" },
                  { value: "pending", label: "در انتظار تأیید" },
                  { value: "pending_manager_approval", label: "در انتظار تأیید مدیر" },
                  { value: "approved_waiting_warehouse_scan", label: "در انتظار اسکن انبار" },
                  { value: "approved_waiting_tracking_codes", label: "در انتظار ثبت کد رهگیری" },
                  { value: "completed", label: "تکمیل شده" },
                  { value: "rejected", label: "رد شده" },
                ]}
                placeholder="همه وضعیت‌ها"
                searchPlaceholder="جستجو در وضعیت‌ها"
                emptyMessage="وضعیتی پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setPage(1);
              }}
            >
              حذف فیلترها
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت انتقال‌ها" />
      ) : error ? (
        <PageErrorMessage title="دریافت انتقال‌ها انجام نشد" message={error} />
      ) : transfers.length ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={transfers}
            rowKey={(row) => row.objectId}
          />
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title="انتقالی یافت نشد"
          description="درخواست‌های انتقال ثبت‌شده در این بخش نمایش داده می‌شوند."
        />
      )}
    </DashboardLayout>
  );
}
