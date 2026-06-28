"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PanelRoleKey } from "@/lib/domain/roles";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type {
  WarehouseStockProductGroup,
  WarehouseStockProductUnit,
  WarehouseStockUnitDetail,
} from "@/lib/models/warehouse.model";
import { getWarehouseStockUnitDetail } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

interface WarehouseStockDetailViewProps {
  role: Extract<PanelRoleKey, "support" | "manager" | "warehouse">;
  listPath: string;
}

export function WarehouseStockDetailView({
  role,
  listPath,
}: WarehouseStockDetailViewProps) {
  const params = useParams<{ stockObjectId?: string }>();
  const stockObjectId = params.stockObjectId || "";
  const [detail, setDetail] = useState<WarehouseStockUnitDetail | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetail = async (nextStockObjectId: string) => {
    if (!nextStockObjectId) {
      setError("شناسه انبار مشخص نیست.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      setDetail(await getWarehouseStockUnitDetail(nextStockObjectId));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDetail(stockObjectId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [stockObjectId]);

  const totalUnits = useMemo(
    () =>
      detail?.groups.reduce(
        (sum, group) => sum + group.inStockUnitCount,
        0,
      ) ?? 0,
    [detail],
  );

  return (
    <DashboardLayout role={role} title="جزئیات انبار">
      {isLoading ? (
        <LoadingState title="در حال دریافت موجودی انبار" />
      ) : error ? (
        <PageErrorMessage
          title="دریافت موجودی انبار انجام نشد"
          message={error}
        />
      ) : detail ? (
        <div className="space-y-5">
          <SectionHeader
            title={detail.stock.title || "انبار"}
            description={[
              detail.stock.code ? `کد انبار: ${formatFaDigits(detail.stock.code)}` : "",
              detail.stock.sepidarStockId
                ? `شناسه سپیدار: ${formatNumber(detail.stock.sepidarStockId)}`
                : "",
              `تعداد کالا: ${formatNumber(detail.groups.length)}`,
              `تعداد واحد: ${formatNumber(totalUnits)}`,
            ]
              .filter(Boolean)
              .join(" • ")}
            actions={
              <Button asChild variant="outline">
                <Link href={listPath}>بازگشت به انبارها</Link>
              </Button>
            }
          />

          {detail.groups.length ? (
            <div className="space-y-3">
              {detail.groups.map((group) => (
                <ProductUnitGroupCard
                  key={groupKey(group)}
                  group={group}
                  isOpen={Boolean(expanded[groupKey(group)])}
                  onToggle={() =>
                    setExpanded((current) => ({
                      ...current,
                      [groupKey(group)]: !current[groupKey(group)],
                    }))
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="واحدی در این انبار ثبت نشده است"
              description="واحدهای ثبت‌شده در رسید ورود، پس از انتخاب این انبار اینجا نمایش داده می‌شوند."
            />
          )}
        </div>
      ) : null}
    </DashboardLayout>
  );
}

function groupKey(group: WarehouseStockProductGroup): string {
  return (
    group.productObjectId ||
    (group.sepidarItemId ? `sepidar:${group.sepidarItemId}` : "") ||
    group.sepidarCode ||
    group.productName
  );
}

function ProductUnitGroupCard({
  group,
  isOpen,
  onToggle,
}: {
  group: WarehouseStockProductGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-3 px-5 py-4 text-right transition-colors hover:bg-[#F8FBFD] md:flex-row md:items-center md:justify-between"
      >
        <div className="min-w-0">
          <p className="font-semibold text-[#102034]">
            {group.productName || "-"}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            کد کالا: {group.sepidarCode ? formatFaDigits(group.sepidarCode) : "-"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
          <Badge variant="neutral">
            واحدهای موجود: {formatNumber(group.inStockUnitCount)}
          </Badge>
          <Badge variant="brand">
            موجودی واقعی: {formatNumber(group.realQuantity)}
          </Badge>
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {isOpen ? <UnitTable units={group.units} /> : null}
    </Card>
  );
}

function UnitTable({ units }: { units: WarehouseStockProductUnit[] }) {
  return (
    <div className="overflow-x-auto border-t border-[#EEF2F6]">
      <table className="min-w-full text-right">
        <thead className="bg-[#F8FBFD] text-xs font-semibold text-[#5B6B7F]">
          <tr>
            {[
              "کد رهگیری",
              "سریال",
              "شناسه کالا",
              "وضعیت",
              "کد رسید ورود",
              "تاریخ ثبت",
            ].map((header) => (
              <th key={header} className="whitespace-nowrap px-5 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6] text-sm text-[#334155]">
          {units.map((unit) => (
            <tr key={unit.objectId} className="hover:bg-[#F8FBFD]">
              <td className="whitespace-nowrap px-5 py-3">
                {formatFaDigits(unit.trackingCode || "-")}
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                {unit.serialNumber ? formatFaDigits(unit.serialNumber) : "-"}
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                {formatFaDigits(unit.productIdentifier || "-")}
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                {unit.statusLabel || unit.status || "-"}
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                {unit.inboundReceiptCode
                  ? formatFaDigits(unit.inboundReceiptCode)
                  : "-"}
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                {unit.createdAt ? formatDateTime(unit.createdAt) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
