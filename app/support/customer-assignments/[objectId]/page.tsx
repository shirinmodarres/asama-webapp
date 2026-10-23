"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerDetails } from "@/components/customer/customer-details";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Customer } from "@/lib/models/customer.model";
import { getSupportCustomer } from "@/lib/services/customer.service";
import { listExpertCustomerAssignmentsPage } from "@/lib/services/customer-assignment.service";

export default function SupportCustomerDetailsPage() {
  const params = useParams<{ objectId: string }>();
  const objectId = decodeURIComponent(params.objectId);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadCustomer() {
      setIsLoading(true);
      setError("");
      try {
        const [baseCustomer, assignments] = await Promise.all([
          getSupportCustomer(objectId),
          listExpertCustomerAssignmentsPage({ customerObjectId: objectId, limit: 20, offset: 0 }),
        ]);
        const assignment = assignments.items[0];
        const assigned = assignment?.customer;
        if (mounted) setCustomer(assigned ? {
          ...baseCustomer,
          ...assigned,
          addresses: baseCustomer.addresses,
          defaultAddress: baseCustomer.defaultAddress,
          sepidarAddress: baseCustomer.sepidarAddress,
          sepidarAddresses: baseCustomer.sepidarAddresses,
          grouping: assigned.grouping ?? baseCustomer.grouping,
          channel: assigned.channel ?? baseCustomer.channel,
          subChannel: assigned.subChannel ?? baseCustomer.subChannel,
          assignedExpertName: assignment?.expertName || assigned.assignedExpertName,
          priceLists: assignment?.priceLists ?? assigned.priceLists,
          priceListIds: assignment?.priceListIds ?? assigned.priceListIds,
          priceListId: assignment?.priceListId ?? assigned.priceListId,
          priceListTitle: assignment?.priceListTitle ?? assigned.priceListTitle,
          priceListType: assignment?.priceListType ?? assigned.priceListType,
          priceListBrand: assignment?.priceListBrand ?? assigned.priceListBrand,
        } : baseCustomer);
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadCustomer();
    return () => { mounted = false; };
  }, [objectId]);

  return <DashboardLayout role="support" title="جزئیات مشتری">
    <SectionHeader title="جزئیات مشتری" description="اطلاعات سپیدار، دسته‌بندی فروش و تخصیص کارشناس." actions={<Button asChild variant="outline"><Link href="/support/customer-assignments"><ArrowRight className="size-4" />بازگشت</Link></Button>} />
    {isLoading ? <LoadingState title="در حال دریافت اطلاعات مشتری" /> : error ? <PageErrorMessage title="دریافت اطلاعات مشتری انجام نشد" message={error} /> : customer ? <CustomerDetails customer={customer} /> : <EmptyState title="مشتری پیدا نشد" description="شناسه مشتری معتبر نیست." />}
  </DashboardLayout>;
}
