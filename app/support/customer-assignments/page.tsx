"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, UserMinus, X } from "lucide-react";
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
} from "@/lib/models/customer-assignment.model";
import type { Customer } from "@/lib/models/customer.model";
import {
  createExpertCustomerAssignment,
  deactivateExpertCustomerAssignment,
  listExpertCustomerAssignments,
  listSepidarCustomers,
  listSepidarSaleTypes,
  listSupportExperts,
  updateExpertCustomerAssignment,
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
  const [deactivatingId, setDeactivatingId] = useState("");
  const [editingAssignmentId, setEditingAssignmentId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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

    const actorName =
      getStoredCurrentUser()?.fullName ||
      getStoredCurrentUser()?.username ||
      "پشتیبان";

    const payload = {
      expertUserId: selectedExpertId,
      customerObjectId: selectedCustomerId,
      saleTypeObjectId: selectedSaleTypeId,
    };

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      if (editingAssignmentId) {
        await updateExpertCustomerAssignment(editingAssignmentId, {
          ...payload,
          updatedByName: actorName,
        });
      } else {
        await createExpertCustomerAssignment({
          ...payload,
          assignedByName: actorName,
        });
      }
      await loadData();
      setEditingAssignmentId("");
      setSelectedExpertId("");
      setSelectedCustomerId("");
      setSelectedSaleTypeId("");
      setMessage(
        editingAssignmentId
          ? "اختصاص مشتری با موفقیت به‌روزرسانی شد."
          : "مشتری با موفقیت به کارشناس اختصاص داده شد.",
      );
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
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
    () => {
      const assignedCustomerIds = new Set(
        assignments
          .filter(
            (assignment) =>
              assignment.status === "active" &&
              assignment.objectId !== editingAssignmentId,
          )
          .map((assignment) => assignment.customerObjectId),
      );

      return customers
        .filter((customer) => customer.status === "active")
        .filter((customer) => !assignedCustomerIds.has(customer.objectId))
        .map((customer) => ({
          value: customer.objectId,
          label: formatCustomerOptionLabel(customer),
        }));
    },
    [assignments, customers, editingAssignmentId],
  );
  const saleTypeOptions = useMemo(
    () =>
      saleTypes
        .map((saleType) => ({
          value: saleType.objectId,
          label: `${saleType.sepidarSaleTypeId ?? "-"} - ${saleType.title || "-"}${
            saleType.isAvailable === false ? " (غیرفعال در سپیدار)" : ""
          }`,
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

  const startEditAssignment = (assignment: ExpertCustomerAssignment) => {
    setEditingAssignmentId(assignment.objectId);
    setSelectedExpertId(assignment.expertObjectId);
    setSelectedCustomerId(assignment.customerObjectId);
    setSelectedSaleTypeId(assignment.saleTypeObjectId ?? "");
    setFieldErrors({});
    setError("");
    setMessage("");
  };

  const cancelEditAssignment = () => {
    setEditingAssignmentId("");
    setSelectedExpertId("");
    setSelectedCustomerId("");
    setSelectedSaleTypeId("");
    setFieldErrors({});
  };

  const isSubmitDisabled =
    isSubmitting ||
    expertOptions.length === 0 ||
    customerOptions.length === 0 ||
    saleTypeOptions.length === 0 ||
    !selectedExpertId ||
    !selectedCustomerId ||
    !selectedSaleTypeId;

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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => startEditAssignment(row)}
              disabled={deactivatingId === row.objectId || isSubmitting}
            >
              <Pencil className="size-4" />
              ویرایش
            </Button>
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
          </div>
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
      />

      {message ? <div className="asama-banner px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}
      {isLoading ? (
        <LoadingState title="در حال دریافت مشتریان و کارشناسان" />
      ) : (
        <>
          <Card className="p-5">
            {editingAssignmentId ? (
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#D7DEE6] bg-[#F8FAFC] p-3 text-sm text-[#334155] sm:flex-row sm:items-center sm:justify-between">
                <span>در حال ویرایش اختصاص مشتری هستید.</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={cancelEditAssignment}
                  disabled={isSubmitting}
                >
                  <X className="size-4" />
                  لغو ویرایش
                </Button>
              </div>
            ) : null}
            <div className="grid min-w-0 gap-4 md:grid-cols-3">
              <label className="grid min-w-0 gap-2 text-sm font-medium text-[#334155]">
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
                  className="min-w-0"
                />
                <FieldError message={fieldErrors.selectedExpertId} />
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-medium text-[#334155]">
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
                  className="min-w-0"
                />
                <FieldError message={fieldErrors.selectedCustomerId} />
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-medium text-[#334155]">
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
                  emptyMessage={
                    saleTypes.length === 0
                      ? "نوع فروشی پیدا نشد. وضعیت همگام‌سازی را از تنظیمات سپیدار بررسی کنید."
                      : "نوع فروشی با این جستجو پیدا نشد."
                  }
                  invalid={Boolean(fieldErrors.selectedSaleTypeId)}
                  className="min-w-0"
                />
                <FieldError message={fieldErrors.selectedSaleTypeId} />
              </label>
            </div>
            <Button
              type="button"
              className="mt-5"
              onClick={submitAssignment}
              disabled={isSubmitDisabled}
            >
              {isSubmitting
                ? "در حال ثبت..."
                : editingAssignmentId
                  ? "به‌روزرسانی اختصاص"
                  : "اختصاص مشتری"}
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
