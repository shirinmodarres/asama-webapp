"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, UserMinus } from "lucide-react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { AuthUser } from "@/lib/models/auth.model";
import type {
  ExpertCustomerAssignment,
  SepidarSaleType,
  SepidarCustomerSyncSummary,
} from "@/lib/models/customer-assignment.model";
import type { Customer } from "@/lib/models/customer.model";
import {
  createExpertCustomerAssignment,
  deactivateExpertCustomerAssignment,
  listExpertCustomerAssignments,
  listSepidarCustomers,
  listSepidarSaleTypes,
  listSupportExperts,
  syncSaleTypesFromSepidar,
} from "@/lib/services/customer-assignment.service";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function SupportCustomerAssignmentsPage() {
  const [experts, setExperts] = useState<AuthUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saleTypes, setSaleTypes] = useState<SepidarSaleType[]>([]);
  const [assignments, setAssignments] = useState<ExpertCustomerAssignment[]>([]);
  const [selectedExpertId, setSelectedExpertId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedSaleTypeId, setSelectedSaleTypeId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [syncSummary, setSyncSummary] = useState<SepidarCustomerSyncSummary | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadData = async () => {
    const [expertData, customerData, saleTypeData, assignmentData] = await Promise.all([
      listSupportExperts(),
      listSepidarCustomers(),
      listSepidarSaleTypes(),
      listExpertCustomerAssignments(),
    ]);
    setExperts(expertData);
    setCustomers(customerData);
    setSaleTypes(saleTypeData);
    setAssignments(assignmentData);
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [expertData, customerData, saleTypeData, assignmentData] = await Promise.all([
          listSupportExperts(),
          listSepidarCustomers(),
          listSepidarSaleTypes(),
          listExpertCustomerAssignments(),
        ]);
        if (!isMounted) return;
        setExperts(expertData);
        setCustomers(customerData);
        setSaleTypes(saleTypeData);
        setAssignments(assignmentData);
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

  const submitAssignment = async () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedExpertId) {
      nextErrors.selectedExpertId = "لطفاً کارشناس را انتخاب کنید.";
    }
    if (!selectedCustomerId) {
      nextErrors.selectedCustomerId = "لطفاً مشتری را انتخاب کنید.";
    }
    if (!selectedSaleTypeId) {
      nextErrors.selectedSaleTypeId = "لطفاً نوع فروش را انتخاب کنید.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      expertUserId: selectedExpertId,
      customerObjectId: selectedCustomerId,
      saleTypeObjectId: selectedSaleTypeId,
      assignedByName:
        getStoredCurrentUser()?.fullName ||
        getStoredCurrentUser()?.username ||
        "پشتیبان",
    };

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      await createExpertCustomerAssignment(payload);
      await loadData();
      setSelectedExpertId("");
      setSelectedCustomerId("");
      setSelectedSaleTypeId("");
      setMessage("مشتری با موفقیت به کارشناس اختصاص داده شد.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const syncSaleTypes = async () => {
    setIsSyncing(true);
    setError("");
    setMessage("");
    setSyncSummary(null);
    try {
      const summary = await syncSaleTypesFromSepidar();
      const updatedSaleTypes = await listSepidarSaleTypes();
      setSaleTypes(updatedSaleTypes);
      setSyncSummary(summary);
      setMessage("نوع‌های فروش از سپیدار به‌روزرسانی شد.");
    } catch (syncError) {
      setError(getErrorMessage(syncError));
    } finally {
      setIsSyncing(false);
    }
  };

  const expertOptions = useMemo(
    () =>
      experts
        .filter((expert) => expert.status === "active")
        .map((expert) => ({
          value: expert.objectId,
          label:
            expert.fullName ||
            expert.name ||
            expert.mobile ||
            expert.username ||
            "-",
        })),
    [experts],
  );
  const customerOptions = useMemo(
    () =>
      customers
        .filter((customer) => customer.status === "active")
        .map((customer) => ({
          value: customer.objectId,
          label: formatCustomerOptionLabel(customer),
        })),
    [customers],
  );
  const saleTypeOptions = useMemo(
    () =>
      saleTypes
        .filter((saleType) => saleType.isAvailable)
        .map((saleType) => ({
          value: saleType.objectId,
          label: `${saleType.sepidarSaleTypeId ? formatFaDigits(saleType.sepidarSaleTypeId) : "-"} - ${saleType.title || "-"}`,
        })),
    [saleTypes],
  );

  const deactivateAssignment = async (assignmentId: string) => {
    setDeactivatingId(assignmentId);
    setError("");
    setMessage("");
    try {
      await deactivateExpertCustomerAssignment(assignmentId);
      await loadData();
      setMessage("اختصاص مشتری غیرفعال شد.");
    } catch (deactivateError) {
      setError(getErrorMessage(deactivateError));
    } finally {
      setDeactivatingId("");
    }
  };

  const columns: DataTableColumn<ExpertCustomerAssignment>[] = [
    { key: "expert", header: "کارشناس", render: (row) => row.expertName || "-" },
    { key: "customer", header: "مشتری", render: (row) => row.customerName || "-" },
    {
      key: "customer-code",
      header: "کد مشتری",
      render: (row) =>
        row.sepidarCustomerCode ? formatFaDigits(row.sepidarCustomerCode) : "-",
    },
    {
      key: "sale-type",
      header: "نوع فروش",
      render: (row) =>
        row.saleTypeTitle
          ? `${row.sepidarSaleTypeId ? `${formatNumber(row.sepidarSaleTypeId)} - ` : ""}${row.saleTypeTitle}`
          : "-",
    },
    {
      key: "date",
      header: "زمان اختصاص",
      render: (row) => (row.assignedAt ? formatDateTime(row.assignedAt) : "-"),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "neutral"}>
          {row.statusLabel}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) =>
        row.status === "active" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => deactivateAssignment(row.objectId)}
            disabled={deactivatingId === row.objectId}
          >
            <UserMinus className="size-4" />
            {deactivatingId === row.objectId ? "در حال انجام..." : "غیرفعال کردن"}
          </Button>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <DashboardLayout role="support" title="اختصاص مشتری به کارشناس">
      <SectionHeader
        title="اختصاص مشتری به کارشناس"
        description="مشتریان سپیدار را به کارشناسان فروش اختصاص دهید و نوع فروش هر مشتری را مشخص کنید."
        actions={
          <Button type="button" onClick={syncSaleTypes} disabled={isSyncing}>
            <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing
              ? "در حال دریافت نوع‌های فروش..."
              : "به‌روزرسانی نوع‌های فروش از سپیدار"}
          </Button>
        }
      />

      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}
      {syncSummary ? <SyncSummary summary={syncSummary} /> : null}

      {isLoading ? (
        <LoadingState title="در حال دریافت مشتریان و کارشناسان" />
      ) : (
        <>
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کارشناس فروش</span>
                <SearchableSelect
                  value={selectedExpertId || undefined}
                  onValueChange={(value) => {
                    setSelectedExpertId(value);
                    setFieldErrors((current) => ({ ...current, selectedExpertId: "" }));
                  }}
                  options={expertOptions}
                  placeholder="انتخاب کارشناس"
                  searchPlaceholder="جستجو در کارشناسان"
                  emptyMessage="کارشناسی پیدا نشد"
                  invalid={Boolean(fieldErrors.selectedExpertId)}
                />
                <FieldError message={fieldErrors.selectedExpertId} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>مشتری سپیدار</span>
                <SearchableSelect
                  value={selectedCustomerId || undefined}
                  onValueChange={(value) => {
                    setSelectedCustomerId(value);
                    setFieldErrors((current) => ({ ...current, selectedCustomerId: "" }));
                  }}
                  options={customerOptions}
                  placeholder="انتخاب مشتری"
                  searchPlaceholder="جستجو در مشتریان"
                  emptyMessage="مشتری‌ای پیدا نشد"
                  invalid={Boolean(fieldErrors.selectedCustomerId)}
                />
                <FieldError message={fieldErrors.selectedCustomerId} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>نوع فروش</span>
                <SearchableSelect
                  value={selectedSaleTypeId || undefined}
                  onValueChange={(value) => {
                    setSelectedSaleTypeId(value);
                    setFieldErrors((current) => ({
                      ...current,
                      selectedSaleTypeId: "",
                    }));
                  }}
                  options={saleTypeOptions}
                  placeholder="انتخاب نوع فروش"
                  searchPlaceholder="جستجو در نوع‌های فروش"
                  emptyMessage="نوع فروشی پیدا نشد"
                  invalid={Boolean(fieldErrors.selectedSaleTypeId)}
                />
                <FieldError message={fieldErrors.selectedSaleTypeId} />
              </label>
            </div>
            <Button
              type="button"
              className="mt-5"
              onClick={submitAssignment}
              disabled={isSubmitting}
            >
              {isSubmitting ? "در حال ثبت..." : "اختصاص مشتری"}
            </Button>
          </Card>

          {assignments.length ? (
            <DataTable
              columns={columns}
              rows={assignments}
              rowKey={(row) => row.objectId || `${row.expertObjectId}-${row.customerObjectId}`}
            />
          ) : (
            <EmptyState
              title="اختصاصی ثبت نشده است"
              description="برای شروع ثبت سفارش، یک مشتری را به کارشناس اختصاص دهید."
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function formatCustomerOptionLabel(customer: Customer): string {
  const name = customer.fullName || "مشتری";
  const code = customer.sepidarCustomerCode || customer.id;
  return code ? `${formatFaDigits(code)} - ${name}` : name;
}

function SyncSummary({ summary }: { summary: SepidarCustomerSyncSummary }) {
  const rows = [
    ["تعداد کل", summary.total],
    ["پردازش‌شده", summary.processed],
    ["ایجادشده", summary.created],
    ["به‌روزشده", summary.updated],
    ["ردشده", summary.rejected],
    ["خطادار", summary.failed],
  ];
  return (
    <Card className="border-[#CFE3D3] bg-[#F3FAF4] p-4">
      <p className="text-sm font-semibold text-[#315D3D]">
        به‌روزرسانی نوع‌های فروش انجام شد.
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {rows.map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[#D6E8DA] bg-white p-3">
            <dt className="text-xs text-[#536275]">{label}</dt>
            <dd className="mt-1 font-semibold text-[#1F3A5F]">
              {formatNumber(Number(value))}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
