"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDate, formatNumber } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listOrders } from "@/lib/services/order.service";
import { formatFaDigits } from "@/lib/utils/number-format";

const PAGE_SIZE = 15;

export default function CustomerSystemTransfersPage() {
  const currentUser = getStoredCurrentUser();
  const currentRole = currentUser?.activeRole ?? currentUser?.role;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");
      try {
        const data = await listOrders({
          financialApprovalStatus: "approved",
          financialApprovalStage: "systems_transfer",
          warehouseStatus: "awaitingSystemsTransfer",
        });
        if (mounted) setOrders(data);
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders
      .filter((order) =>
        !term ||
        [order.code, order.customerName, order.createdByName]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term)),
      )
      .sort((left, right) => Number(new Date(right.createdAt)) - Number(new Date(left.createdAt)));
  }, [orders, search]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const columns: DataTableColumn<Order>[] = [
    {
      key: "code",
      header: "کد سفارش",
      render: (order) => (
        <span className="font-semibold text-[#1F3A5F]">
          {formatFaDigits(order.code)}
        </span>
      ),
    },
    { key: "customer", header: "مشتری", render: (order) => order.customerName || "-" },
    {
      key: "items",
      header: "تعداد کالا",
      render: (order) => formatNumber(order.items.reduce((sum, item) => sum + item.quantity, 0)),
    },
    { key: "date", header: "تاریخ ثبت", render: (order) => formatDate(order.createdAt) },
    {
      key: "status",
      header: "وضعیت",
      render: (order) => <StatusBadge type="warehouse" status={order.warehouseStatus} />,
    },
    {
      key: "actions",
      header: "عملیات",
      render: (order) => (
        <Link
          href={`/manager/orders/${order.objectId}`}
          className="rounded-xl border border-[#1F3A5F] bg-[#1F3A5F] px-3 py-1.5 text-xs font-semibold !text-white hover:text-white"
        >
          ثبت نتیجه انتقال
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="finance-control" title="انتقال در سامانه مشتری">
      <SectionHeader
        title="انتقال بار در سامانه مشتری"
        description="پس از ثبت انتقال در سامانه مشتری، سفارش برای بررسی و خروج به انبار ارسال می‌شود."
      />

      {currentRole !== "systems_expert" ? (
        <PageErrorMessage title="عدم دسترسی" message="این صفحه فقط برای کارشناس سامانه‌ها در دسترس است." />
      ) : isLoading ? (
        <LoadingState title="در حال دریافت سفارش‌های آماده انتقال" />
      ) : error ? (
        <PageErrorMessage title="دریافت سفارش‌ها انجام نشد" message={error} />
      ) : (
        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1F3A5F]">آماده ثبت انتقال</p>
              <p className="mt-1 text-sm text-[#64748B]">{formatFaDigits(filteredOrders.length)} سفارش</p>
            </div>
            <label className="relative block w-full sm:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="جستجو بر اساس کد سفارش یا مشتری"
                className="pr-10"
              />
            </label>
          </div>

          {filteredOrders.length ? (
            <>
              <DataTable columns={columns} rows={paginatedOrders} rowKey={(order) => order.objectId} />
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredOrders.length}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <EmptyState
              title="سفارش آماده انتقالی وجود ندارد"
              description="سفارش‌های تأییدشده مدیر فروش که منتظر ثبت انتقال هستند، اینجا نمایش داده می‌شوند."
            />
          )}
        </section>
      )}
    </DashboardLayout>
  );
}
