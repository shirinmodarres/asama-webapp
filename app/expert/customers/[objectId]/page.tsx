"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CustomerDetails } from "@/components/customer/customer-details";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Customer } from "@/lib/models/customer.model";
import { getAssignedCustomerDetailsForExpert } from "@/lib/services/expert-customer.service";

export default function ExpertCustomerDetailsPage() {
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
        const assignedCustomer = await getAssignedCustomerDetailsForExpert(objectId);
        if (mounted) {
          setCustomer(assignedCustomer);
        }
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadCustomer();
    return () => { mounted = false; };
  }, [objectId]);

  return <DashboardLayout role="expert" title="جزئیات مشتری">
    <SectionHeader title="جزئیات مشتری" description="اطلاعات سپیدار، دسته‌بندی فروش و تنظیمات اختصاصی مشتری." actions={<Button asChild variant="outline"><Link href="/expert/customers"><ArrowRight className="size-4" />بازگشت</Link></Button>} />
    {isLoading ? <LoadingState title="در حال دریافت اطلاعات مشتری" /> : error ? <PageErrorMessage title="دریافت اطلاعات مشتری انجام نشد" message={error} /> : !customer ? <EmptyState title="مشتری پیدا نشد" description="شناسه مشتری معتبر نیست یا به شما اختصاص ندارد." /> : <CustomerDetails customer={customer} />}
  </DashboardLayout>;
}
