"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { OrderFinancialAmounts } from "@/components/shared/order-financial-amounts";
import { ConfirmationModal } from "@/components/manager/confirmation-modal";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/api-error";
import { REVIEW_REASONS } from "@/lib/domain/order-action-reasons";
import { getOrderStatusLabel } from "@/lib/domain/statuses";
import { formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  approveOrder,
  listOrders,
  markOrderNeedsReview,
} from "@/lib/services/order.service";
import { ListFilter, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatFaDigits } from "@/lib/utils/number-format";

const WORKFLOW_PENDING_STATUSES = [
  "pending_financial_approval",
  "pending_manager_approval",
];

export default function ManagerPendingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("workflow_pending");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"approve" | "needs_review" | null>(null);
  const [bulkReasonCode, setBulkReasonCode] = useState("");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<string>("");
  const [bulkError, setBulkError] = useState("");

  const refreshOrders = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await listOrders();
      setOrders(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listOrders();
        if (isMounted) setOrders(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
      )
      .filter((order) => {
        const matchesSearch =
          order.code.toLowerCase().includes(search.toLowerCase()) ||
          (order.createdByName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (order.customerName ?? "")
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "workflow_pending"
              ? WORKFLOW_PENDING_STATUSES.includes(order.orderStatus)
              : order.orderStatus === statusFilter;
        return (
          matchesSearch &&
          matchesStatus &&
          isWithinDateRange(order.createdAt, dateFrom, dateTo)
        );
      });
  }, [dateFrom, dateTo, orders, search, statusFilter]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "workflow_pending" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const selectableOrders = useMemo(
    () =>
      filteredOrders.filter(
        (order) =>
          order.orderType !== "naja" &&
          order.orderStatus === "pending_manager_approval",
      ),
    [filteredOrders],
  );
  const selectableOrderIds = useMemo(
    () => new Set(selectableOrders.map((order) => order.objectId)),
    [selectableOrders],
  );
  const selectedSelectableOrderIds = selectedOrderIds.filter((id) =>
    selectableOrderIds.has(id),
  );

  const toggleOrderSelection = (orderId: string, checked: boolean) => {
    setSelectedOrderIds((current) =>
      checked
        ? Array.from(new Set([...current, orderId]))
        : current.filter((id) => id !== orderId),
    );
  };

  const toggleAllSelection = (checked: boolean) => {
    setSelectedOrderIds((current) => {
      const visible = selectableOrders.map((order) => order.objectId);
      return checked
        ? Array.from(new Set([...current, ...visible]))
        : current.filter((id) => !visible.includes(id));
    });
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedSelectableOrderIds.length === 0) return;
    if (bulkAction === "needs_review" && !bulkReasonCode) {
      setError("لطفاً دلیل ارجاع برای اصلاح را انتخاب کنید.");
      return;
    }

    setIsBulkSubmitting(true);
    setError("");
    setBulkSummary("");
    setBulkError("");
    const selected = orders.filter((order) =>
      selectedSelectableOrderIds.includes(order.objectId),
    );
    const successes: Array<{ id: string; order: Order | null }> = [];
    const failures: Array<{ code: string; message: string }> = [];
    const requestedByName =
      getStoredCurrentUser()?.fullName || getStoredCurrentUser()?.username || "مدیر فروش";

    for (const order of selected) {
      try {
        if (bulkAction === "approve") {
          const result = await approveOrder(order.objectId);
          successes.push({ id: order.objectId, order: result.order });
        } else {
          const updated = await markOrderNeedsReview(order.objectId, {
            reasonCode: bulkReasonCode,
            requestedByName,
          });
          successes.push({ id: order.objectId, order: updated });
        }
      } catch (actionError) {
        failures.push({ code: order.code, message: getErrorMessage(actionError) });
      }
    }

    if (successes.length) {
      setSelectedOrderIds((current) =>
        current.filter((id) => !successes.some((entry) => entry.id === id)),
      );
      await refreshOrders();
    }
    setBulkSummary(
      `${formatFaDigits(successes.length)} سفارش انجام شد${
        failures.length ? `؛ ${formatFaDigits(failures.length)} سفارش ناموفق بود: ${failures.map((failure) => failure.code).join("، ")}` : ""
      }`,
    );
    if (failures.length) {
      setBulkError(failures.map((failure) => `${failure.code}: ${failure.message}`).join(" | "));
    }
    setBulkAction(null);
    setBulkReasonCode("");
    setIsBulkSubmitting(false);
  };

  const statusOptions = useMemo(
    () => {
      const legacyAndQueueStatuses = [
        "pending_financial_approval",
        "pending_manager_approval",
        "needs_review",
        "review_resolved",
      ];
      return Array.from(
        new Set([
          ...legacyAndQueueStatuses,
          ...orders
            .map((order) => order.orderStatus)
            .filter((value): value is string => Boolean(value) && value !== "pending_approval"),
        ]),
      );
    },
    [orders],
  );

  const approveFromList = async (order: Order) => {
    setApprovingOrderId(order.objectId);
    setError("");
    try {
      // Use the same canonical manager-approval endpoint as the detail page.
      const result = await approveOrder(order.objectId);
      setOrders((current) => current.map((entry) => (
        entry.objectId === order.objectId && result.order ? result.order : entry
      )));
    } catch (approvalError) {
      setError(getErrorMessage(approvalError));
    } finally {
      setApprovingOrderId(null);
    }
  };

  const columns: DataTableColumn<Order>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          aria-label="انتخاب همه سفارش‌های قابل اقدام"
          checked={
            selectableOrders.length > 0 &&
            selectedSelectableOrderIds.length === selectableOrders.length
          }
          onChange={(event) => toggleAllSelection(event.target.checked)}
          disabled={selectableOrders.length === 0 || isBulkSubmitting}
        />
      ),
      render: (row) => {
        const selectable =
          row.orderType !== "naja" &&
          row.orderStatus === "pending_manager_approval";
        return selectable ? (
          <input
            type="checkbox"
            aria-label={`انتخاب ${row.code}`}
            checked={selectedOrderIds.includes(row.objectId)}
            onChange={(event) => toggleOrderSelection(row.objectId, event.target.checked)}
            disabled={isBulkSubmitting}
          />
        ) : null;
      },
      className: "w-12 px-3",
      headerClassName: "w-12 px-3",
      cellClassName: "w-12 px-3",
    },
    {
      key: "code",
      header: "کد سفارش",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">
          {formatFaDigits(row.code)}
        </span>
      ),
    },
    { key: "creator", header: "ثبت کننده", render: (row) => row.createdByName },
    {
      key: "customer",
      header: "مشتری",
      render: (row) => row.customerName ?? "-",
    },
    {
      key: "date",
      header: "تاریخ",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "items",
      header: "تعداد آیتم",
      render: (row) =>
        formatNumber(row.items.reduce((sum, item) => sum + item.quantity, 0)),
    },
    {
      key: "amounts",
      header: "مبالغ سفارش",
      render: (row) => <OrderFinancialAmounts order={row} />,
    },
    {
      key: "order-status",
      header: "وضعیت سفارش",
      render: (row) => <StatusBadge type="order" status={row.orderStatus} />,
    },

    {
      key: "warehouse-status",
      header: "وضعیت انبار",
      render: (row) => (
        <StatusBadge type="warehouse" status={row.warehouseStatus} />
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.orderType !== "naja" && row.orderStatus === "pending_manager_approval" ? (
            <Button
              size="sm"
              disabled={approvingOrderId === row.objectId}
              onClick={() => void approveFromList(row)}
            >
              {approvingOrderId === row.objectId ? "در حال تأیید..." : "تأیید"}
            </Button>
          ) : null}
          <Link
            href={`/manager/orders/${row.objectId}`}
            className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-3 py-1.5 text-xs text-white!"
          >
            بررسی سفارش
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="manager" title="سفارش‌ها">
      <SectionHeader
        title="صف تصمیم‌گیری سفارش‌ها"
        description="بررسی سفارش‌های در انتظار تأیید، نیازمند بررسی و مشکل برطرف‌شده"
      />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
            <span>جستجو در سفارش‌ها</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس کد سفارش، مشتری یا نام ثبت کننده"
                className="pr-10"
              />
            </div>
          </label>
          <label className="grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56">
            <span>فیلتر وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: "workflow_pending", label: "در انتظار تأیید مالی و مدیر" },
                  { value: "pending_manager_approval", label: getOrderStatusLabel("pending_manager_approval") },
                  { value: "pending_financial_approval", label: getOrderStatusLabel("pending_financial_approval") },
                  { value: "needs_review", label: "نیازمند بررسی" },
                  { value: "review_resolved", label: "مشکل برطرف شد" },
                  { value: "all", label: "همه وضعیت‌ها" },
                  ...statusOptions
                    .filter(
                      (value) =>
                        ![
                          "workflow_pending",
                          "pending_manager_approval",
                          "pending_financial_approval",
                          "needs_review",
                          "review_resolved",
                        ].includes(value),
                    )
                    .map((value) => ({
                      value,
                      label: getOrderStatusLabel(value),
                    })),
                ]}
                placeholder="همه وضعیت‌ها"
                searchPlaceholder="جستجو در وضعیت‌ها"
                emptyMessage="وضعیتی پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
          <DateRangeFilter
            value={{ from: dateFrom, to: dateTo }}
            onChange={(range) => {
              setDateFrom(range.from ?? "");
              setDateTo(range.to ?? "");
            }}
          />
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-fit shrink-0 items-center gap-2"
            onClick={() => {
              setSearch("");
              setStatusFilter("workflow_pending");
              setDateFrom("");
              setDateTo("");
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
        <div className="space-y-3">
          {bulkError ? (
            <PageErrorMessage
              title="برخی سفارش‌ها انجام نشدند"
              message={bulkError}
            />
          ) : null}
          {selectableOrders.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
              <p className="text-sm text-[#475569]">
                {selectedSelectableOrderIds.length
                  ? `${formatFaDigits(selectedSelectableOrderIds.length)} سفارش انتخاب شده است.`
                  : "برای اقدام گروهی، سفارش‌ها را انتخاب کنید."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedSelectableOrderIds.length || isBulkSubmitting}
                  onClick={() => setBulkAction("approve")}
                >
                  تأیید گروهی
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!selectedSelectableOrderIds.length || isBulkSubmitting}
                  onClick={() => setBulkAction("needs_review")}
                >
                  ارجاع گروهی برای اصلاح
                </Button>
              </div>
            </div>
          ) : null}
          {bulkSummary ? (
            <p className="text-sm text-[#475569]">{bulkSummary}</p>
          ) : null}
          <DataTable
            columns={columns}
            rows={filteredOrders}
            rowKey={(row) => row.objectId || row.id}
          />
        </div>
      ) : (
        <EmptyState
          title="سفارش در انتظار تایید یافت نشد"
          description="فیلترها را تغییر دهید یا وارد روند سفارش ها شوید."
        />
      )}
      <ConfirmationModal
        open={bulkAction !== null}
        title={bulkAction === "approve" ? "تأیید گروهی سفارش‌ها" : "ارجاع گروهی برای اصلاح"}
        message={
          bulkAction === "approve"
            ? "هر سفارش انتخاب‌شده با همان فرایند تأیید تکی بررسی و پردازش می‌شود. خطای یک سفارش مانع ادامه بقیه نخواهد شد."
            : "همه سفارش‌های انتخاب‌شده با دلیل یکسان برای اصلاح به کارشناس فروش بازگردانده می‌شوند."
        }
        confirmText={bulkAction === "approve" ? "تأیید سفارش‌ها" : "ثبت ارجاع برای اصلاح"}
        tone={bulkAction === "needs_review" ? "danger" : "success"}
        busy={isBulkSubmitting}
        onConfirm={() => void executeBulkAction()}
        onCancel={() => {
          if (isBulkSubmitting) return;
          setBulkAction(null);
          setBulkReasonCode("");
        }}
      >
        <p className="text-sm text-[#475569]">
          تعداد سفارش‌های انتخاب‌شده: {formatFaDigits(selectedSelectableOrderIds.length)}
        </p>
        {bulkAction === "needs_review" ? (
          <Select value={bulkReasonCode} onValueChange={setBulkReasonCode} disabled={isBulkSubmitting}>
            <SelectTrigger><SelectValue placeholder="دلیل ارجاع برای اصلاح" /></SelectTrigger>
            <SelectContent>
              {REVIEW_REASONS.map((reason) => (
                <SelectItem key={reason.code} value={reason.code}>{reason.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </ConfirmationModal>
    </DashboardLayout>
  );
}

function isWithinDateRange(
  value: string,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  if (dateFrom && timestamp < new Date(`${dateFrom}T00:00:00`).getTime())
    return false;
  if (dateTo && timestamp > new Date(`${dateTo}T23:59:59`).getTime())
    return false;
  return true;
}
