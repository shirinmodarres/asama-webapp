"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Check, Pencil, Search, UserMinus, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SearchableMultiSelect,
  SearchableSelect,
} from "@/components/ui/searchable-select";
import { ApiError, getErrorMessage } from "@/lib/api/api-error";
import type { AuthUser } from "@/lib/models/auth.model";
import type { ExpertCustomerAssignment } from "@/lib/models/customer-assignment.model";
import type { Customer } from "@/lib/models/customer.model";
import type { PriceList } from "@/lib/models/pricing.model";
import type { SepidarStock } from "@/lib/models/stock.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  createExpertCustomerAssignment,
  deactivateExpertCustomerAssignment,
  listExpertCustomerAssignmentsPage,
  listSupportExperts,
  updateExpertCustomerAssignment,
} from "@/lib/services/customer-assignment.service";
import {
  listCustomers,
  listCustomersPage,
} from "@/lib/services/customer.service";
import { listGeneratedPriceLists } from "@/lib/services/pricing.service";
import { listSepidarStocks } from "@/lib/services/stock.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const PAGE_SIZE = 20;
type MasterSelection = "all" | "unassigned" | string;
type DetailRow = {
  customer: Customer;
  assignment: ExpertCustomerAssignment | null;
};

export default function SupportCustomerAssignmentsPage() {
  const [experts, setExperts] = useState<AuthUser[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);

  const [selectedExpertId, setSelectedExpertId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerOption, setSelectedCustomerOption] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedPriceListIds, setSelectedPriceListIds] = useState<string[]>(
    [],
  );
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [selectedMaster, setSelectedMaster] =
    useState<MasterSelection>("unassigned");
  const [rows, setRows] = useState<DetailRow[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [targetExpertId, setTargetExpertId] = useState("");

  const [isLoadingBase, setIsLoadingBase] = useState(true);
  const [isLoadingRows, setIsLoadingRows] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBaseData = useCallback(async () => {
    const [expertData, priceListData, stockData, unassigned] =
      await Promise.all([
        listSupportExperts(),
        listGeneratedPriceLists({ activeOnly: true }),
        listSepidarStocks(),
        listCustomersPage({
          status: "active",
          assignmentStatus: "unassigned",
          limit: 1,
          offset: 0,
        }),
      ]);
    setExperts(expertData.filter((expert) => expert.status === "active"));
    setPriceLists(priceListData);
    setStocks(stockData);
    setUnassignedCount(unassigned.total);
  }, []);

  useEffect(() => {
    let mounted = true;
    // Loading state belongs to this remote synchronization cycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingBase(true);
    setError("");
    loadBaseData()
      .catch((loadError) => mounted && setError(getErrorMessage(loadError)))
      .finally(() => mounted && setIsLoadingBase(false));
    return () => {
      mounted = false;
    };
  }, [loadBaseData]);

  useEffect(() => {
    let mounted = true;
    // Every filter/page change starts a new server-side page request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingRows(true);
    setError("");
    const offset = (page - 1) * PAGE_SIZE;
    const request =
      selectedMaster === "unassigned"
        ? listCustomersPage({
            status: "active",
            assignmentStatus: "unassigned",
            search: deferredSearch || undefined,
            limit: PAGE_SIZE,
            offset,
          }).then((result) => ({
            rows: result.items.map((customer) => ({
              customer,
              assignment: null,
            })),
            total: result.total,
          }))
        : listExpertCustomerAssignmentsPage({
            expertUserId: selectedMaster === "all" ? undefined : selectedMaster,
            search: deferredSearch || undefined,
            limit: PAGE_SIZE,
            offset,
          }).then((result) => ({
            rows: result.items
              .filter((assignment) => assignment.customer)
              .map((assignment) => ({
                customer: assignment.customer as Customer,
                assignment,
              })),
            total: result.total,
          }));

    request
      .then((result) => {
        if (!mounted) return;
        setRows(result.rows);
        setTotal(result.total);
      })
      .catch((loadError) => mounted && setError(getErrorMessage(loadError)))
      .finally(() => mounted && setIsLoadingRows(false));
    return () => {
      mounted = false;
    };
  }, [deferredSearch, page, refreshKey, selectedMaster]);

  const expertOptions = useMemo(
    () =>
      experts.map((expert) => ({
        value: expert.objectId,
        label: `${expert.fullName || expert.name || expert.username || expert.mobile || "-"} - ${expert.roleLabel}`,
      })),
    [experts],
  );
  const priceListOptions = useMemo(
    () =>
      priceLists.map((item) => ({
        value: item.objectId,
        label: item.name || item.title || "-",
      })),
    [priceLists],
  );
  const stockOptions = useMemo(
    () =>
      stocks
        .filter((item) => item.isActive)
        .map((item) => ({
          value: item.objectId,
          label: `${formatFaDigits(item.code || "-")} - ${item.title}`,
        })),
    [stocks],
  );
  const masterOptions = useMemo(
    () => [
      {
        value: "all",
        label: `همه اختصاص‌ها (${formatFaDigits(experts.reduce((sum, expert) => sum + (expert.assignedCustomerCount || 0), 0))})`,
      },
      {
        value: "unassigned",
        label: `بدون کارشناس (${formatFaDigits(unassignedCount)})`,
      },
      ...experts.map((expert) => ({
        value: expert.objectId,
        label: `${expert.fullName || expert.username || "کارشناس"} (${formatFaDigits(expert.assignedCustomerCount || 0)})`,
      })),
    ],
    [experts, unassignedCount],
  );

  const loadCustomerOptions = useCallback(async (query: string) => {
    const customers = await listCustomers({
      search: query || undefined,
      status: "active",
      limit: 25,
      offset: 0,
    });
    return customers.map((customer) => ({
      value: customer.objectId,
      label: formatCustomerOptionLabel(customer),
      searchText: [
        customer.fullName,
        customer.sepidarCustomerCode,
        customer.sepidarCustomerId,
        customer.id,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  }, []);

  const resetForm = () => {
    setEditingAssignmentId("");
    setSelectedExpertId("");
    setSelectedCustomerId("");
    setSelectedCustomerOption(null);
    setSelectedPriceListIds([]);
    setSelectedStockIds([]);
    setFieldErrors({});
  };

  const refreshData = async () => {
    await loadBaseData();
    setRefreshKey((value) => value + 1);
  };

  const submitAssignment = async () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedExpertId)
      nextErrors.selectedExpertId = "لطفاً کارشناس را انتخاب کنید.";
    if (!selectedCustomerId)
      nextErrors.selectedCustomerId = "لطفاً مشتری را انتخاب کنید.";
    if (!selectedPriceListIds.length)
      nextErrors.selectedPriceListIds = "حداقل یک لیست قیمت انتخاب کنید.";
    if (!selectedStockIds.length)
      nextErrors.selectedStockIds = "حداقل یک انبار مجاز انتخاب کنید.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const actorName =
      getStoredCurrentUser()?.fullName ||
      getStoredCurrentUser()?.username ||
      "پشتیبان";
    const payload = {
      expertUserId: selectedExpertId,
      customerObjectId: selectedCustomerId,
      priceListIds: selectedPriceListIds,
      allowedStockObjectIds: selectedStockIds,
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
      const wasEditing = Boolean(editingAssignmentId);
      resetForm();
      await refreshData();
      setMessage(
        wasEditing
          ? "اختصاص مشتری به‌روزرسانی شد."
          : "مشتری با موفقیت اختصاص داده شد.",
      );
    } catch (submitError) {
      if (
        submitError instanceof ApiError &&
        submitError.code === "CUSTOMER_ALREADY_ASSIGNED"
      ) {
        setFieldErrors((current) => ({
          ...current,
          selectedCustomerId:
            "این مشتری قبلاً به یک کارشناس اختصاص داده شده است.",
        }));
      } else {
        setError(getErrorMessage(submitError));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectMaster = (value: MasterSelection) => {
    setSelectedMaster(value);
    setTargetExpertId(value !== "all" && value !== "unassigned" ? value : "");
    setSelectedCustomerIds([]);
    setPage(1);
  };

  const startEdit = (assignment: ExpertCustomerAssignment) => {
    setEditingAssignmentId(assignment.objectId);
    setSelectedExpertId(assignment.expertObjectId);
    setSelectedCustomerId(assignment.customerObjectId);
    setSelectedCustomerOption(
      assignment.customer
        ? {
            value: assignment.customer.objectId,
            label: formatCustomerOptionLabel(assignment.customer),
          }
        : null,
    );
    setSelectedPriceListIds(
      assignment.priceListIds.length
        ? assignment.priceListIds
        : assignment.priceListId
          ? [assignment.priceListId]
          : [],
    );
    setSelectedStockIds(assignment.allowedStockObjectIds);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deactivateAssignment = async (assignment: ExpertCustomerAssignment) => {
    setDeactivatingId(assignment.objectId);
    setError("");
    try {
      await deactivateExpertCustomerAssignment(assignment.objectId);
      await refreshData();
      setSelectedCustomerIds((current) =>
        current.filter((id) => id !== assignment.customerObjectId),
      );
      setMessage("اختصاص مشتری غیرفعال شد.");
    } catch (deactivateError) {
      setError(getErrorMessage(deactivateError));
    } finally {
      setDeactivatingId("");
    }
  };

  const submitBulkAssignment = async () => {
    if (
      !selectedCustomerIds.length ||
      !targetExpertId ||
      !selectedPriceListIds.length ||
      !selectedStockIds.length
    ) {
      setError(
        "مشتری‌ها، کارشناس مقصد، لیست قیمت و انبار مجاز را کامل انتخاب کنید.",
      );
      return;
    }
    const actorName =
      getStoredCurrentUser()?.fullName ||
      getStoredCurrentUser()?.username ||
      "پشتیبان";
    setIsSubmitting(true);
    setError("");
    let completed = 0;
    try {
      for (const customerId of selectedCustomerIds) {
        const row = rows.find((item) => item.customer.objectId === customerId);
        if (row?.assignment) {
          await updateExpertCustomerAssignment(row.assignment.objectId, {
            expertUserId: targetExpertId,
            customerObjectId: customerId,
            priceListIds: selectedPriceListIds,
            allowedStockObjectIds: selectedStockIds,
            updatedByName: actorName,
          });
        } else {
          await createExpertCustomerAssignment({
            expertUserId: targetExpertId,
            customerObjectId: customerId,
            priceListIds: selectedPriceListIds,
            allowedStockObjectIds: selectedStockIds,
            assignedByName: actorName,
          });
        }
        completed += 1;
      }
      setSelectedCustomerIds([]);
      await refreshData();
      setMessage(
        `${formatFaDigits(completed)} مشتری با موفقیت اختصاص یا منتقل شد.`,
      );
    } catch (submitError) {
      setError(
        completed
          ? `${formatFaDigits(completed)} مورد انجام شد؛ ادامه عملیات متوقف شد. ${getErrorMessage(submitError)}`
          : getErrorMessage(submitError),
      );
      await refreshData().catch(() => undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allPageSelected =
    rows.length > 0 &&
    rows.every((row) => selectedCustomerIds.includes(row.customer.objectId));
  const isSubmitDisabled =
    isSubmitting ||
    !selectedExpertId ||
    !selectedCustomerId ||
    !selectedPriceListIds.length ||
    !selectedStockIds.length;
  const columns: DataTableColumn<DetailRow>[] = [
    {
      key: "select",
      header: "انتخاب",
      className: "w-20",
      render: ({ customer }) => (
        <input
          aria-label={`انتخاب ${customer.fullName}`}
          type="checkbox"
          checked={selectedCustomerIds.includes(customer.objectId)}
          onChange={() =>
            setSelectedCustomerIds((current) =>
              current.includes(customer.objectId)
                ? current.filter((id) => id !== customer.objectId)
                : [...current, customer.objectId],
            )
          }
          className="size-4 accent-[var(--primary)]"
        />
      ),
    },
    {
      key: "customer",
      header: "مشتری",
      cellClassName: "min-w-56",
      render: ({ customer }) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">
            {customer.fullName || "مشتری"}
          </p>
          {customer.phone ? (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {formatFaDigits(customer.phone)}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "code",
      header: "کد مشتری",
      render: ({ customer }) =>
        formatFaDigits(customer.sepidarCustomerCode || customer.id),
    },
    {
      key: "expert",
      header: "کارشناس فعلی",
      render: ({ assignment }) =>
        assignment ? (
          <Badge variant="brand" dot>
            {assignment.expertName || "اختصاص‌یافته"}
          </Badge>
        ) : (
          <Badge variant="neutral">بدون کارشناس</Badge>
        ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: ({ assignment }) =>
        assignment ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              title="ویرایش اختصاص"
              onClick={() => startEdit(assignment)}
              disabled={isSubmitting}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title="حذف اختصاص"
              onClick={() => deactivateAssignment(assignment)}
              disabled={deactivatingId === assignment.objectId}
            >
              <UserMinus className="size-4" />
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
        description="اختصاص تکی را سریع ثبت کنید و فهرست مشتری‌های هر کارشناس را جداگانه ببینید."
      />
      {message ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {error ? <InlineErrorMessage message={error} /> : null}

      {isLoadingBase ? (
        <LoadingState title="در حال دریافت اطلاعات پایه" />
      ) : (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  {editingAssignmentId ? "ویرایش اختصاص" : "اختصاص سریع مشتری"}
                </h2>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  مشتری، کارشناس، لیست قیمت و انبار مجاز را مشخص کنید.
                </p>
              </div>
              {editingAssignmentId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  <X className="size-4" />
                  لغو ویرایش
                </Button>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <Field label="کارشناس" error={fieldErrors.selectedExpertId}>
                <SearchableSelect
                  value={selectedExpertId || undefined}
                  onValueChange={(value) => {
                    setSelectedExpertId(value);
                    setFieldErrors((current) => ({
                      ...current,
                      selectedExpertId: "",
                    }));
                  }}
                  options={expertOptions}
                  placeholder="انتخاب کارشناس"
                  searchPlaceholder="جستجوی کارشناس"
                  emptyMessage="کارشناسی پیدا نشد"
                  invalid={Boolean(fieldErrors.selectedExpertId)}
                />
              </Field>
              <Field
                label="مشتری سپیدار"
                error={fieldErrors.selectedCustomerId}
              >
                <SearchableSelect
                  value={selectedCustomerId || undefined}
                  onValueChange={(value) => {
                    setSelectedCustomerId(value);
                    setFieldErrors((current) => ({
                      ...current,
                      selectedCustomerId: "",
                    }));
                  }}
                  onOptionChange={setSelectedCustomerOption}
                  selectedOption={selectedCustomerOption}
                  loadOptions={loadCustomerOptions}
                  options={
                    selectedCustomerOption ? [selectedCustomerOption] : []
                  }
                  placeholder="انتخاب مشتری"
                  searchPlaceholder="نام یا کد مشتری"
                  emptyMessage="مشتری‌ای پیدا نشد"
                  invalid={Boolean(fieldErrors.selectedCustomerId)}
                />
              </Field>
              <Field
                label="لیست‌های قیمت"
                error={fieldErrors.selectedPriceListIds}
              >
                <SearchableMultiSelect
                  values={selectedPriceListIds}
                  onValuesChange={(values) => {
                    setSelectedPriceListIds(values);
                    setFieldErrors((current) => ({
                      ...current,
                      selectedPriceListIds: "",
                    }));
                  }}
                  options={priceListOptions}
                  placeholder="انتخاب لیست قیمت"
                  searchPlaceholder="جستجوی لیست قیمت"
                  emptyMessage="لیست فعالی پیدا نشد"
                  invalid={Boolean(fieldErrors.selectedPriceListIds)}
                />
              </Field>
              <Field label="انبارهای مجاز" error={fieldErrors.selectedStockIds}>
                <SearchableMultiSelect
                  values={selectedStockIds}
                  onValuesChange={(values) => {
                    setSelectedStockIds(values);
                    setFieldErrors((current) => ({
                      ...current,
                      selectedStockIds: "",
                    }));
                  }}
                  options={stockOptions}
                  placeholder="انتخاب انبار"
                  searchPlaceholder="جستجوی انبار"
                  emptyMessage="انباری پیدا نشد"
                  invalid={Boolean(fieldErrors.selectedStockIds)}
                />
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={submitAssignment}
                disabled={isSubmitDisabled}
              >
                <Check className="size-4" />
                {isSubmitting
                  ? "در حال ثبت..."
                  : editingAssignmentId
                    ? "ثبت تغییرات"
                    : "اختصاص مشتری"}
              </Button>
            </div>
          </Card>

          <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="lg:hidden">
              <Field label="نمایش بر اساس کارشناس">
                <SearchableSelect
                  value={selectedMaster}
                  onValueChange={selectMaster}
                  options={masterOptions}
                  placeholder="انتخاب کارشناس"
                  searchPlaceholder="جستجوی کارشناس"
                  emptyMessage="کارشناسی پیدا نشد"
                />
              </Field>
            </div>
            <Card className="hidden max-h-[calc(100vh-2rem)] overflow-y-auto p-2 lg:sticky lg:top-4 lg:block">
              <p className="px-3 pb-2 pt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                نمایش بر اساس کارشناس
              </p>
              <MasterButton
                active={selectedMaster === "all"}
                label="همه اختصاص‌ها"
                count={experts.reduce(
                  (sum, expert) => sum + (expert.assignedCustomerCount || 0),
                  0,
                )}
                onClick={() => selectMaster("all")}
              />
              <MasterButton
                active={selectedMaster === "unassigned"}
                label="بدون کارشناس"
                count={unassignedCount}
                onClick={() => selectMaster("unassigned")}
              />
              <div className="my-2 border-t border-[var(--border)]" />
              {experts.map((expert) => (
                <MasterButton
                  key={expert.objectId}
                  active={selectedMaster === expert.objectId}
                  label={expert.fullName || expert.username || "کارشناس"}
                  subtitle={expert.roleLabel}
                  count={expert.assignedCustomerCount || 0}
                  onClick={() => selectMaster(expert.objectId)}
                />
              ))}
            </Card>

            <div className="min-w-0 space-y-3">
              <Card className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--foreground)]">
                      فهرست مشتری‌ها
                    </h2>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {formatFaDigits(total)} مشتری در این بخش
                    </p>
                  </div>
                  <Field label="جستجو در مشتری‌ها">
                    <span className="relative block w-full sm:w-80">
                      <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <Input
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setPage(1);
                          setSelectedCustomerIds([]);
                        }}
                        className="pr-10"
                        placeholder="نام یا کد مشتری"
                      />
                    </span>
                  </Field>
                </div>
                {rows.length ? (
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
                    <label className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                      <input
                        aria-label="انتخاب همه مشتری‌های صفحه"
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={() =>
                          setSelectedCustomerIds((current) =>
                            allPageSelected
                              ? current.filter(
                                  (id) =>
                                    !rows.some(
                                      (row) => row.customer.objectId === id,
                                    ),
                                )
                              : Array.from(
                                  new Set([
                                    ...current,
                                    ...rows.map((row) => row.customer.objectId),
                                  ]),
                                ),
                          )
                        }
                        className="size-4 accent-[var(--primary)]"
                      />
                      انتخاب همه این صفحه
                    </label>
                    {selectedCustomerIds.length ? (
                      <span>
                        {formatFaDigits(selectedCustomerIds.length)} مورد انتخاب
                        شده
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </Card>

              {isLoadingRows ? (
                <LoadingState title="در حال دریافت این صفحه" />
              ) : rows.length ? (
                <DataTable
                  columns={columns}
                  rows={rows}
                  rowKey={(row) => row.customer.objectId}
                />
              ) : (
                <EmptyState
                  title="مشتری‌ای پیدا نشد"
                  description="کارشناس یا عبارت جستجو را تغییر دهید."
                />
              )}

              {selectedCustomerIds.length ? (
                <Card className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        اختصاص گروهی
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {formatFaDigits(selectedCustomerIds.length)} مشتری
                        انتخاب شده است.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCustomerIds([])}
                    >
                      <X className="size-4" />
                      پاک کردن
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,0.8fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto] xl:items-end">
                    <Field label="کارشناس مقصد">
                      <SearchableSelect
                        value={targetExpertId || undefined}
                        onValueChange={setTargetExpertId}
                        options={expertOptions}
                        placeholder="انتخاب کارشناس"
                        searchPlaceholder="جستجو"
                        emptyMessage="کارشناسی پیدا نشد"
                      />
                    </Field>
                    <Field label="لیست‌های قیمت">
                      <SearchableMultiSelect
                        values={selectedPriceListIds}
                        onValuesChange={setSelectedPriceListIds}
                        options={priceListOptions}
                        placeholder="انتخاب لیست قیمت"
                        searchPlaceholder="جستجو"
                        emptyMessage="لیستی پیدا نشد"
                      />
                    </Field>
                    <Field label="انبارهای مجاز">
                      <SearchableMultiSelect
                        values={selectedStockIds}
                        onValuesChange={setSelectedStockIds}
                        options={stockOptions}
                        placeholder="انتخاب انبار"
                        searchPlaceholder="جستجو"
                        emptyMessage="انباری پیدا نشد"
                      />
                    </Field>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={submitBulkAssignment}
                    >
                      <Check className="size-4" />
                      {isSubmitting ? "در حال ثبت..." : "ثبت گروهی"}
                    </Button>
                  </div>
                </Card>
              ) : null}

              <PaginationBar
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  setSelectedCustomerIds([]);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      {children}
      <FieldError message={error} />
    </label>
  );
}

function MasterButton({
  active,
  label,
  subtitle,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  subtitle?: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`mb-1 flex w-full items-center gap-2 rounded-[var(--radius)] border px-3 py-2 text-right transition-colors ${active ? "border-[var(--input)] bg-[var(--accent)] text-[var(--accent-foreground)]" : "border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{label}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs font-normal text-[var(--muted-foreground)]">
            {subtitle}
          </span>
        ) : null}
      </span>
      <Badge variant={active ? "brand" : "neutral"}>
        {formatFaDigits(count)}
      </Badge>
    </button>
  );
}

function formatCustomerOptionLabel(customer: Customer) {
  return [
    customer.fullName || "مشتری",
    customer.sepidarCustomerCode
      ? `کد ${formatFaDigits(customer.sepidarCustomerCode)}`
      : null,
  ]
    .filter(Boolean)
    .join(" - ");
}
