"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Search, ShieldAlert, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { listOrders } from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

type FinancialTabKey = "pending" | "needs_correction" | "approved";

const PAGE_SIZE = 15;

export default function FinancialControlOrdersPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [returnedOrders, setReturnedOrders] = useState<Order[]>([]);
  const [approvedOrders, setApprovedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState<FinancialTabKey>("pending");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      setIsLoading(true);
      setError("");
      try {
        const [pendingData, correctionData, approvedData] = await Promise.all([
          listOrders({ financialApprovalStatus: "pending" }),
          listOrders({ financialApprovalStatus: "needs_correction" }),
          listOrders({ financialApprovalStatus: "approved" }),
        ]);
        if (!mounted) return;
        setPendingOrders(pendingData);
        setReturnedOrders(correctionData);
        setApprovedOrders(approvedData);
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  const activeOrders =
    activeTab === "pending"
      ? pendingOrders
      : activeTab === "needs_correction"
        ? returnedOrders
        : approvedOrders;

  const filteredOrders = useMemo(
    () =>
      [...activeOrders]
        .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)))
        .filter((order) => {
          const matchesSearch =
            order.code.toLowerCase().includes(search.toLowerCase()) ||
            (order.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (order.createdByName ?? "").toLowerCase().includes(search.toLowerCase());
          return matchesSearch && isWithinDateRange(order.createdAt, dateFrom, dateTo);
        }),
    [activeOrders, dateFrom, dateTo, search],
  );
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(
    () => filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredOrders],
  );

  function selectTab(tab: FinancialTabKey) {
    setActiveTab(tab);
    setCurrentPage(1);
  }

  const columns: DataTableColumn<Order>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => <span className="font-semibold text-[#1F3A5F]">{formatFaDigits(row.code)}</span>,
    },
    { key: "customer", header: "مشتری", render: (row) => row.customerName || "-" },
    { key: "createdByName", header: "ثبت کننده", render: (row) => row.createdByName || "-" },
    { key: "date", header: "تاریخ", render: (row) => formatDate(row.createdAt) },
    {
      key: "items",
      header: "تعداد آیتم",
      render: (row) => formatNumber(row.items.reduce((sum, item) => sum + item.quantity, 0)),
    },
    {
      key: "status",
      header: "وضعیت مالی",
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge
            type="financial"
            status={row.financialApprovalStatus ?? "pending"}
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Link
          href={`/finance-control/orders/${row.objectId}`}
          className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-3 py-1.5 text-xs !text-white hover:text-white"
        >
          بررسی سفارش
        </Link>
      ),
    },
  ];

  const hasFilters = search.trim().length > 0 || dateFrom.length > 0 || dateTo.length > 0;

  return (
    <DashboardLayout role="finance-control" title="کنترل مالی">
      <SectionHeader
        title="سفارش‌های کنترل مالی"
        description="سفارش‌های در انتظار تأیید مالی و سفارش‌های برگشتی برای اصلاح"
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={activeTab === "pending"}
              icon={<ShieldAlert className="size-4" />}
              label={`در انتظار تأیید مالی (${formatFaDigits(pendingOrders.length)})`}
              description="سفارش‌های آماده بررسی"
              onClick={() => selectTab("pending")}
            />
            <TabButton
              active={activeTab === "needs_correction"}
              icon={<CheckCircle2 className="size-4" />}
              label={`نیازمند اصلاح (${formatFaDigits(returnedOrders.length)})`}
              description="سفارش‌های برگشتی"
              onClick={() => selectTab("needs_correction")}
            />
            <TabButton
              active={activeTab === "approved"}
              icon={<CheckCircle2 className="size-4" />}
              label={`تأیید شده (${formatFaDigits(approvedOrders.length)})`}
              description="سفارش‌های بررسی‌شده"
              onClick={() => selectTab("approved")}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_auto] xl:items-end">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در سفارش‌ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="جستجو بر اساس کد سفارش، مشتری یا ثبت کننده"
                className="pr-10"
              />
            </div>
          </label>
          <DateRangeFilter
            value={{ from: dateFrom, to: dateTo }}
            onChange={(range) => {
              setDateFrom(range.from ?? "");
              setDateTo(range.to ?? "");
              setCurrentPage(1);
            }}
          />
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 xl:w-fit"
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
                setCurrentPage(1);
              }}
            >
              <span>حذف فیلترها</span>
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت سفارش ها" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش ها انجام نشد" message={error} />
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={paginatedOrders}
            rowKey={(row) => row.objectId || row.id}
          />
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <EmptyState
          title="سفارش مالی یافت نشد"
          description="فیلترها را تغییر دهید یا بعداً دوباره تلاش کنید."
        />
      )}
    </DashboardLayout>
  );
}

function TabButton({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex min-w-[230px] items-center gap-3 rounded-2xl border border-[#1F3A5F] bg-[#1F3A5F] px-4 py-3 text-right text-white shadow-sm"
          : "inline-flex min-w-[230px] items-center gap-3 rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-right text-[#334155] hover:border-[#94A3B8]"
      }
    >
      <span
        className={
          active
            ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
            : "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1F3A5F]"
        }
      >
        {icon}
      </span>
      <span className="grid gap-0.5">
        <span className="text-sm font-semibold leading-6">{label}</span>
        <span className={active ? "text-xs text-white/80" : "text-xs text-[#64748B]"}>
          {description}
        </span>
      </span>
    </button>
  );
}

function isWithinDateRange(value: string, dateFrom: string, dateTo: string): boolean {
  if (!dateFrom && !dateTo) return true;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  if (dateFrom && timestamp < new Date(dateFrom).getTime()) return false;
  if (dateTo && timestamp > new Date(`${dateTo}T23:59:59.999`).getTime()) return false;
  return true;
}
