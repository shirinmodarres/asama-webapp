"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import type { AuthUser } from "@/lib/models/auth.model";
import type { ExpertPriceListAssignment, PriceList } from "@/lib/models/pricing.model";
import { listSupportExperts } from "@/lib/services/customer-assignment.service";
import {
  listExpertPriceAssignments,
  listGeneratedPriceLists,
  saveExpertPriceAssignment,
} from "@/lib/services/pricing.service";
import { formatDateTime } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

export default function ExpertPriceAssignmentsPage() {
  const [experts, setExperts] = useState<AuthUser[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [assignments, setAssignments] = useState<ExpertPriceListAssignment[]>([]);
  const [selectedExpertId, setSelectedExpertId] = useState("");
  const [selectedPriceListIds, setSelectedPriceListIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    const [expertData, priceListData, assignmentData] = await Promise.all([
      listSupportExperts(),
      listGeneratedPriceLists({ activeOnly: true }),
      listExpertPriceAssignments(),
    ]);
    setExperts(expertData);
    setPriceLists(priceListData);
    setAssignments(assignmentData);
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      listSupportExperts(),
      listGeneratedPriceLists({ activeOnly: true }),
      listExpertPriceAssignments(),
    ])
      .then(([expertData, priceListData, assignmentData]) => {
        if (!mounted) return;
        setExperts(expertData);
        setPriceLists(priceListData);
        setAssignments(assignmentData);
      })
      .catch((err) => {
        if (mounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const expertOptions = useMemo(
    () =>
      experts.map((expert) => ({
        value: expert.objectId,
        label: `${expert.fullName || expert.name || expert.username || "-"} - ${expert.roleLabel}`,
      })),
    [experts],
  );

  const save = async () => {
    const errors: Record<string, string> = {};
    if (!selectedExpertId) errors.expert = "کارشناس را انتخاب کنید.";
    if (!selectedPriceListIds.length) errors.priceLists = "حداقل یک لیست قیمت انتخاب کنید.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await saveExpertPriceAssignment({
        expertUserId: selectedExpertId,
        priceListIds: selectedPriceListIds,
      });
      await load();
      setSelectedExpertId("");
      setSelectedPriceListIds([]);
      setMessage("لیست‌های قیمت کارشناس ذخیره شد.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const columns: DataTableColumn<ExpertPriceListAssignment>[] = [
    { key: "expert", header: "کارشناس", render: (row) => row.expertName || row.expertUserId || "-" },
    {
      key: "lists",
      header: "لیست‌های قیمت",
      cellClassName: "max-w-[420px] whitespace-normal leading-7",
      render: (row) => row.priceLists.length
        ? row.priceLists.map((list) => list.name || list.code || list.objectId).join("، ")
        : row.priceListIds.join("، "),
    },
    { key: "assigned", header: "زمان اختصاص", render: (row) => row.assignedAt ? formatDateTime(row.assignedAt) : "-" },
    { key: "status", header: "وضعیت", render: (row) => row.isActive ? "فعال" : "غیرفعال" },
  ];

  return (
    <DashboardLayout role="support" title="اختصاص قیمت به کارشناس">
      <SectionHeader title="اختصاص قیمت به کارشناس" description="لیست‌های قیمت فعال قابل استفاده برای هر کارشناس" />
      {message ? <div className="asama-banner mb-4 px-4 py-3 text-sm">{message}</div> : null}
      {error ? <InlineErrorMessage message={error} /> : null}
      <Card className="mb-6 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>کارشناس</span>
            <SearchableSelect
              value={selectedExpertId || undefined}
              onValueChange={setSelectedExpertId}
              options={expertOptions}
              placeholder="انتخاب کارشناس"
              searchPlaceholder="جستجو"
            />
            <FieldError message={fieldErrors.expert} />
          </label>
          <div className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>لیست‌های قیمت</span>
            <div className="grid max-h-64 gap-2 overflow-auto rounded-[14px] border border-[#D7DEE6] bg-white p-3">
              {priceLists.map((priceList) => {
                const checked = selectedPriceListIds.includes(priceList.objectId);
                return (
                  <button
                    key={priceList.objectId}
                    type="button"
                    className={
                      checked
                        ? "flex items-center justify-between rounded-xl border border-[#6CAE75] bg-[#F3FAF4] px-3 py-2 text-right text-xs text-[#1F3A5F]"
                        : "flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] px-3 py-2 text-right text-xs text-[#334155]"
                    }
                    onClick={() => {
                      setSelectedPriceListIds((current) =>
                        checked
                          ? current.filter((id) => id !== priceList.objectId)
                          : [...current, priceList.objectId],
                      );
                    }}
                  >
                    <span>{priceList.brandName || "-"} - {priceList.name} {priceList.code ? `- ${formatFaDigits(priceList.code)}` : ""}</span>
                    {checked ? <Check className="size-4 text-[#6CAE75]" /> : null}
                  </button>
                );
              })}
            </div>
            <FieldError message={fieldErrors.priceLists} />
          </div>
        </div>
        <Button className="mt-5" onClick={save} disabled={isSaving}>
          {isSaving ? "در حال ذخیره..." : "ذخیره اختصاص"}
        </Button>
      </Card>
      {isLoading ? <LoadingState title="در حال دریافت اختصاص‌ها" /> : assignments.length ? (
        <DataTable columns={columns} rows={assignments} rowKey={(row) => row.objectId} />
      ) : (
        <EmptyState title="اختصاصی ثبت نشده است" description="یک کارشناس انتخاب کنید و لیست‌های قیمت فعال را به او اختصاص دهید." />
      )}
    </DashboardLayout>
  );
}
