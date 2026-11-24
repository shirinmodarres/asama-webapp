"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ManagerSummaryCard } from "@/components/manager/manager-summary-card";
import { ActionLinkCard } from "@/components/shared/action-link-card";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { getErrorMessage } from "@/lib/api/api-error";
import { httpClient } from "@/lib/api/http-client";
import type { SidebarIconName } from "@/lib/types";

type Metric = { key: string; title: string; hint: string };
type Action = { href: string; title: string; description: string; icon: SidebarIconName };

export function RoleDashboard({
  role, title, metrics, actions,
}: {
  role: "finance" | "finance-control" | "expert" | "naja" | "store-expert" | "warehouse" | "support";
  title: string;
  metrics: Metric[];
  actions: Action[];
}) {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    httpClient.get<unknown>("/api/orders/dashboard").then((data) => {
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("اطلاعات داشبورد ناقص است.");
      const values = data as Record<string, unknown>;
      if (metrics.filter((metric) => Object.hasOwn(values, metric.key)).length < 3) {
        throw new Error("اطلاعات داشبورد ناقص است.");
      }
      if (Object.values(values).some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
        throw new Error("اطلاعات داشبورد نامعتبر است.");
      }
      if (mounted) setCounts(values as Record<string, number>);
    }).catch((loadError) => {
      if (mounted) setError(getErrorMessage(loadError));
    });
    return () => { mounted = false; };
  }, [metrics]);

  return (
    <DashboardLayout role={role} title={title}>
      {error ? <PageErrorMessage title="دریافت داشبورد انجام نشد" message={error} /> : !counts ? (
        <LoadingState title="در حال دریافت اطلاعات داشبورد" />
      ) : (
        <section className={role === "finance-control" ? "grid gap-4 md:grid-cols-3" : "grid gap-4 md:grid-cols-2 xl:grid-cols-4"}>
          {metrics.filter((metric) => Object.hasOwn(counts, metric.key)).map((metric) => (
            <ManagerSummaryCard key={metric.key} title={metric.title} value={counts[metric.key]} hint={metric.hint} />
          ))}
        </section>
      )}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => <ActionLinkCard key={action.href} {...action} />)}
      </section>
    </DashboardLayout>
  );
}
