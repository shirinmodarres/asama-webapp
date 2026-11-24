"use client";

import Link from "next/link";
import { ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Order } from "@/lib/models/order.model";
import { listStoreOrders } from "@/lib/services/store-expert-order.service";
import { listExitSlips } from "@/lib/services/warehouse.service";
import type { ExitSlip } from "@/lib/models/warehouse.model";
import { formatFaDigits } from "@/lib/utils/number-format";
import { isRetailShowroomTitle } from "@/lib/store-expert/retail-exit-eligibility";

export default function StoreExpertExitSlipsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [slips, setSlips] = useState<ExitSlip[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void Promise.all([listStoreOrders({ page: 1, pageSize: 100 }), listExitSlips()])
      .then(([result, issuedSlips]) => {
        if (mounted) setOrders(result.items.filter((order) => (order.retailAllocatedQuantity || 0) > 0));
        if (mounted) setSlips(issuedSlips.filter((slip) => isRetailShowroomTitle(slip.stockTitle)));
      })
      .catch((loadError) => { if (mounted) setError(getErrorMessage(loadError)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <DashboardLayout role="store-expert" title="حواله‌های خروج">
      <SectionHeader title="حواله‌های خروج فروشگاه" description="فقط سهم نمایشگاه تک‌فروشی سفارش‌های خودتان در این صفحه نمایش داده می‌شود." />
      {loading ? <LoadingState title="در حال دریافت حواله‌ها" /> : error ? <PageErrorMessage title="دریافت حواله‌ها انجام نشد" message={error} /> : orders.length === 0 && slips.length === 0 ? <EmptyState title="حواله‌ای برای نمایش وجود ندارد" description="پس از ثبت موفق پیش‌فاکتور، سفارش‌های قابل خروج اینجا نمایش داده می‌شوند." /> : (
        <div className="space-y-5">
          {slips.length ? <section className="space-y-3"><h2 className="text-base font-semibold">حواله‌های صادرشده</h2>{slips.map((slip) => <Card key={slip.objectId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><Link href={`/store-expert/exit-slips/${slip.objectId}`} className="font-semibold hover:underline">حواله {formatFaDigits(slip.slipCode)}</Link><p className="mt-1 text-sm text-muted-foreground">سفارش {formatFaDigits(slip.orderCode)} · {slip.stockTitle || "نمایشگاه تک‌فروشی"}</p></div><Button asChild variant="outline"><Link href={`/store-expert/exit-slips/${slip.objectId}`}>مشاهده حواله</Link></Button></Card>)}</section> : null}
          <section className="grid gap-3">
            <h2 className="text-base font-semibold">سفارش‌های دارای سهم نمایشگاه</h2>
          {orders.map((order) => {
            const status = order.retailFulfillmentStatus || "pending";
            const canExit = order.retailExitAvailable === true && order.quotationSyncStatus === "success" && Boolean(order.sepidarQuotationId);
            return (
              <Card key={order.objectId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <Link href={`/store-expert/orders/${order.objectId}`} className="font-semibold hover:underline">سفارش {formatFaDigits(order.code)}</Link>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>مجموع سهم نمایشگاه: {order.retailAllocatedQuantity || 0}</span>
                    <span>باقی‌مانده: {order.retailRemainingQuantity || 0}</span>
                    <StatusBadge type="warehouse" status={status === "completed" ? "completed" : status === "partial" ? "partialDispatch" : "reserved"} />
                  </div>
                </div>
                {canExit ? <Button asChild><Link href={`/store-expert/orders/${order.objectId}/exit-slip`}><ScanLine className="size-4" />ثبت خروج کالا</Link></Button> : <span className="text-sm text-muted-foreground">خروج تکمیل شده یا در انتظار ثبت پیش‌فاکتور</span>}
              </Card>
            );
          })}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
