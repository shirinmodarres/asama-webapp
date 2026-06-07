"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Activity, RefreshCw, Save, ServerCog, Zap } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage, type ApiError } from "@/lib/api/api-error";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import {
  getSepidarSettings,
  getSepidarSyncSummary,
  syncSepidarCustomers,
  syncSepidarItems,
  syncSepidarPrices,
  syncSepidarSaleTypes,
  syncSepidarStocks,
  testSepidarConnection,
  updateSepidarSettings,
  type SepidarConnectionTestResult,
  type SepidarDiagnosticStep,
  type SepidarSettings,
  type SepidarSyncLogSummary,
  type SepidarSyncOperationSummary,
  type UpdateSepidarSettingsPayload,
} from "@/lib/services/sepidar.service";

type SyncKey = "items" | "customers" | "sale-types" | "prices" | "stocks";

const SYNC_LABELS: Record<SyncKey, string> = {
  items: "کالاها",
  customers: "مشتریان",
  "sale-types": "نوع‌های فروش",
  prices: "قیمت‌ها",
  stocks: "انبارها",
};

export default function SupportSepidarSettingsPage() {
  const [settings, setSettings] = useState<SepidarSettings | null>(null);
  const [syncSummary, setSyncSummary] = useState<SepidarSyncLogSummary[]>([]);
  const [testResult, setTestResult] =
    useState<SepidarConnectionTestResult | null>(null);
  const [form, setForm] = useState<UpdateSepidarSettingsPayload>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [syncingKey, setSyncingKey] = useState<SyncKey | "">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [settingsEnvOnly, setSettingsEnvOnly] = useState(false);
  const [lastSyncResult, setLastSyncResult] =
    useState<SepidarSyncOperationSummary | null>(null);

  const loadPageData = async () => {
    const [settingsData, summaryData] = await Promise.all([
      getSepidarSettings(),
      getSepidarSyncSummary(),
    ]);
    setSettings(settingsData);
    setSyncSummary(summaryData);
    setForm({
      baseUrl: settingsData.baseUrl,
      username: settingsData.username,
      password: "",
      deviceSerial: "",
      generationVersion: settingsData.generationVersion,
    });
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        await loadPageData();
      } catch (loadError) {
        if (isMounted) setError(getSepidarUiError(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    setSettingsEnvOnly(false);
    try {
      const payload: UpdateSepidarSettingsPayload = {
        baseUrl: form.baseUrl?.trim(),
        username: form.username?.trim(),
        generationVersion: form.generationVersion?.trim(),
      };
      if (form.password?.trim()) payload.password = form.password.trim();
      if (form.deviceSerial?.trim())
        payload.deviceSerial = form.deviceSerial.trim();
      const updated = await updateSepidarSettings(payload);
      setSettings(updated);
      setMessage("تنظیمات سپیدار ذخیره شد.");
    } catch (saveError) {
      if (isApiErrorCode(saveError, "SEPIDAR_SETTINGS_ENV_ONLY")) {
        setSettingsEnvOnly(true);
      }
      setError(getSepidarUiError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const runConnectionTest = async () => {
    setIsTesting(true);
    setError("");
    setMessage("");
    setTestResult(null);
    try {
      const result = await testSepidarConnection();
      setTestResult(result);
      setMessage(
        result.ok
          ? "بررسی اتصال سپیدار با موفقیت انجام شد."
          : "بررسی اتصال سپیدار ناموفق بود.",
      );
      setSettings(await getSepidarSettings());
    } catch (testError) {
      setError(getSepidarUiError(testError));
    } finally {
      setIsTesting(false);
    }
  };

  const runSync = async (
    key: SyncKey,
    action: () => Promise<SepidarSyncOperationSummary>,
  ) => {
    setSyncingKey(key);
    setError("");
    setMessage("");
    setLastSyncResult(null);
    try {
      const result = await action();
      setLastSyncResult(result);
      setSyncSummary(await getSepidarSyncSummary());
      setMessage(`همگام‌سازی ${SYNC_LABELS[key]} انجام شد.`);
    } catch (syncError) {
      setError(getSepidarUiError(syncError));
    } finally {
      setSyncingKey("");
    }
  };

  const columns = useMemo<DataTableColumn<SepidarSyncLogSummary>[]>(
    () => [
      {
        key: "type",
        header: "نوع داده",
        render: (row) => SYNC_LABELS[row.syncType as SyncKey] || row.syncType,
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => <SyncStatusBadge status={row.status} />,
      },
      {
        key: "total",
        header: "تعداد کل",
        render: (row) => formatNumber(row.totalFromSepidar),
      },
      {
        key: "processed",
        header: "پردازش‌شده",
        render: (row) => formatNumber(row.processedCount),
      },
      {
        key: "created",
        header: "ایجادشده",
        render: (row) => formatNumber(row.createdCount),
      },
      {
        key: "updated",
        header: "به‌روزشده",
        render: (row) => formatNumber(row.updatedCount),
      },
      {
        key: "failed",
        header: "خطادار",
        render: (row) => formatNumber(row.failedCount),
      },
      {
        key: "last-run",
        header: "آخرین اجرا",
        render: (row) => formatDateValue(row.finishedAt || row.startedAt),
      },
      {
        key: "error",
        header: "خطا",
        cellClassName: "max-w-[280px] whitespace-normal leading-7",
        render: (row) => row.errorMessage || "-",
      },
    ],
    [],
  );

  return (
    <DashboardLayout role="support" title="تنظیمات سپیدار">
      <SectionHeader
        title="تنظیمات سپیدار"
        description="وضعیت اتصال، احراز هویت و همگام‌سازی داده‌های سپیدار را بررسی کنید."
      />

      {message ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {error ? <InlineErrorMessage message={error} /> : null}
      {settingsEnvOnly ? (
        <div className="rounded-xl border border-[#F1D7AA] bg-[#FFF8EB] p-4 text-sm text-[#9A6C18]">
          تنظیمات سپیدار فعلاً از فایل محیطی خوانده می‌شود.
        </div>
      ) : null}

      {isLoading ? (
        <LoadingState title="در حال دریافت تنظیمات سپیدار" />
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <ConnectionInfoCard settings={settings} />
            <LastStatusCard settings={settings} />
          </div>

          <SettingsForm
            form={form}
            isSaving={isSaving}
            onChange={setForm}
            onSubmit={saveSettings}
          />

          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#102034]">
                  تست اتصال سپیدار
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  مراحل اتصال، ورود و دسترسی APIهای اصلی را بررسی کنید.
                </p>
              </div>
              <Button
                type="button"
                onClick={runConnectionTest}
                disabled={isTesting}
              >
                <Zap className="size-4" />
                {isTesting ? "در حال تست..." : "تست اتصال سپیدار"}
              </Button>
            </div>
            {testResult ? <ConnectionTestResult result={testResult} /> : null}
          </Card>

          <Card className="p-5">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#102034]">
                  همگام‌سازی با سپیدار
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  داده‌های آساما را با آخرین اطلاعات سپیدار به‌روزرسانی کنید.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                <SyncButton
                  label="کالاها"
                  loading={syncingKey === "items"}
                  disabled={Boolean(syncingKey)}
                  onClick={() => runSync("items", syncSepidarItems)}
                />
                <SyncButton
                  label="مشتریان"
                  loading={syncingKey === "customers"}
                  disabled={Boolean(syncingKey)}
                  onClick={() => runSync("customers", syncSepidarCustomers)}
                />
                <SyncButton
                  label="نوع‌های فروش"
                  loading={syncingKey === "sale-types"}
                  disabled={Boolean(syncingKey)}
                  onClick={() => runSync("sale-types", syncSepidarSaleTypes)}
                />
                <SyncButton
                  label="قیمت‌ها"
                  loading={syncingKey === "prices"}
                  disabled={Boolean(syncingKey)}
                  onClick={() => runSync("prices", syncSepidarPrices)}
                />
                <SyncButton
                  label="انبارهای سپیدار"
                  loading={syncingKey === "stocks"}
                  disabled={Boolean(syncingKey)}
                  onClick={() => runSync("stocks", syncSepidarStocks)}
                />
              </div>
            </div>
            {lastSyncResult ? (
              <SyncOperationSummary summary={lastSyncResult} />
            ) : null}
          </Card>

          <div>
            <SectionHeader
              title="خلاصه همگام‌سازی"
              description="آخرین وضعیت اجرای همگام‌سازی داده‌های سپیدار"
            />
            <DataTable
              columns={columns}
              rows={syncSummary}
              rowKey={(row) => row.syncType}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function ConnectionInfoCard({
  settings,
}: {
  settings: SepidarSettings | null;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#102034]">
          <ServerCog className="size-5 text-[#1F3A5F]" />
          اطلاعات اتصال
        </h2>
        <Badge
          variant={settings?.status === "authorized" ? "success" : "warning"}
          dot
        >
          {settings?.status === "authorized" ? "فعال" : "ناموفق"}
        </Badge>
      </div>
      <InfoGrid
        rows={[
          ["Base URL", settings?.baseUrl],
          ["Integration ID", settings?.integrationId],
          ["Device Title", settings?.deviceTitle],
          ["Device Serial", settings?.deviceSerialMasked],
          ["Username", settings?.username],
          ["Password configured", settings?.passwordConfigured ? "بله" : "خیر"],
          ["Has public key", settings?.hasPublicKey ? "بله" : "خیر"],
          ["Has token", settings?.hasToken ? "بله" : "خیر"],
          ["Token preview", settings?.tokenPreview],
        ]}
      />
    </Card>
  );
}

function LastStatusCard({ settings }: { settings: SepidarSettings | null }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#102034]">
        <Activity className="size-5 text-[#1F3A5F]" />
        آخرین وضعیت
      </h2>
      <InfoGrid
        rows={[
          ["آخرین رجیستر", formatDateValue(settings?.lastRegisterAt)],
          ["آخرین لاگین", formatDateValue(settings?.lastLoginAt)],
          ["آخرین بررسی اعتبار", formatDateValue(settings?.lastAuthorizedAt)],
          ["آخرین خطا", settings?.errorMessage || "-"],
        ]}
      />
    </Card>
  );
}

function SettingsForm({
  form,
  isSaving,
  onChange,
  onSubmit,
}: {
  form: UpdateSepidarSettingsPayload;
  isSaving: boolean;
  onChange: (value: UpdateSepidarSettingsPayload) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const setField = (key: keyof UpdateSepidarSettingsPayload, value: string) =>
    onChange({ ...form, [key]: value });

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#102034]">
          تنظیمات اتصال
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          مقدار رمز و سریال کامل نمایش داده نمی‌شود.
        </p>
      </div>
      <form
        noValidate
        onSubmit={onSubmit}
        className="grid gap-4 md:grid-cols-2"
      >
        <label className="grid gap-2 text-sm font-medium text-[#334155]">
          <span>Base URL</span>
          <Input
            value={form.baseUrl ?? ""}
            onChange={(event) => setField("baseUrl", event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#334155]">
          <span>Username</span>
          <Input
            value={form.username ?? ""}
            onChange={(event) => setField("username", event.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#334155]">
          <span>Password</span>
          <Input
            type="password"
            value={form.password ?? ""}
            onChange={(event) => setField("password", event.target.value)}
            placeholder="برای تغییر رمز، مقدار جدید را وارد کنید."
            autoComplete="new-password"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#334155]">
          <span>Device Serial</span>
          <Input
            value={form.deviceSerial ?? ""}
            onChange={(event) => setField("deviceSerial", event.target.value)}
            placeholder="برای تغییر سریال، مقدار جدید را وارد کنید."
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
          <span>Generation Version</span>
          <Input
            value={form.generationVersion ?? ""}
            onChange={(event) =>
              setField("generationVersion", event.target.value)
            }
          />
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={isSaving}>
            <Save className="size-4" />
            {isSaving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ConnectionTestResult({
  result,
}: {
  result: SepidarConnectionTestResult;
}) {
  return (
    <div className="mt-5 space-y-2">
      {result.steps.map((step) => (
        <StepRow key={`${step.key}-${step.title}`} step={step} />
      ))}
    </div>
  );
}

function StepRow({ step }: { step: SepidarDiagnosticStep }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#E7EDF3] bg-[#FBFCFD] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-[#102034]">{step.title}</p>
        <p className="mt-1 text-xs leading-6 text-[#6B7280]">
          {step.userMessage || step.message || "-"}
        </p>
      </div>
      <StepStatusBadge status={step.status} />
    </div>
  );
}

function SyncButton({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 justify-center gap-2"
      onClick={onClick}
      disabled={disabled}
    >
      <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
      <span>{loading ? "در حال اجرا" : label}</span>
    </Button>
  );
}

function SyncOperationSummary({
  summary,
}: {
  summary: SepidarSyncOperationSummary;
}) {
  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-[#D6E8DA] bg-[#F3FAF4] p-4 text-sm sm:grid-cols-3 xl:grid-cols-6">
      <SummaryCell label="تعداد کل" value={summary.total} />
      <SummaryCell label="پردازش‌شده" value={summary.processed} />
      <SummaryCell label="ایجادشده" value={summary.created} />
      <SummaryCell label="به‌روزشده" value={summary.updated} />
      <SummaryCell label="ردشده" value={summary.skipped} />
      <SummaryCell label="خطادار" value={summary.failed} />
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-[#536275]">{label}</p>
      <p className="mt-1 font-semibold text-[#1F3A5F]">{formatNumber(value)}</p>
    </div>
  );
}

function InfoGrid({
  rows,
}: {
  rows: Array<[string, string | null | undefined]>;
}) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-1 rounded-xl border border-[#E7EDF3] bg-[#FBFCFD] p-3 sm:grid-cols-[170px_1fr]"
        >
          <dt className="text-xs font-medium text-[#6B7280]">{label}</dt>
          <dd className="wrap-break-words text-sm font-semibold text-[#102034]">
            {value || "-"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StepStatusBadge({ status }: { status: string }) {
  if (status === "success") return <Badge variant="success">موفق</Badge>;
  if (status === "failed") return <Badge variant="destructive">ناموفق</Badge>;
  return <Badge variant="neutral">رد شده</Badge>;
}

function SyncStatusBadge({ status }: { status: string }) {
  if (status === "success") return <Badge variant="success">موفق</Badge>;
  if (status === "failed") return <Badge variant="destructive">ناموفق</Badge>;
  if (status === "running") return <Badge variant="warning">در حال اجرا</Badge>;
  if (status === "never_run") return <Badge variant="neutral">اجرا نشده</Badge>;
  return <Badge variant="neutral">{status || "-"}</Badge>;
}

function formatDateValue(value?: string | null): string {
  return value ? formatDateTime(value) : "-";
}

function getSepidarUiError(error: unknown): string {
  if (isApiErrorCode(error, "SEPIDAR_DNS_FAILED")) {
    return "دامنه سپیدار پیدا نشد. تنظیم DNS یا آدرس Base URL را بررسی کنید.";
  }
  if (
    isApiErrorCode(error, "SEPIDAR_TIMEOUT") ||
    isApiErrorCode(error, "ECONNABORTED") ||
    isApiErrorCode(error, "ETIMEDOUT")
  ) {
    return "اتصال به سپیدار بیش از حد طول کشید.";
  }
  if (
    isApiErrorCode(error, "SEPIDAR_UNAUTHORIZED") ||
    isApiErrorCode(error, "UNAUTHORIZED")
  ) {
    return "ورود یا توکن سپیدار معتبر نیست.";
  }
  if (isApiErrorCode(error, "SEPIDAR_SETTINGS_ENV_ONLY")) {
    return "تنظیمات سپیدار فعلاً از فایل محیطی خوانده می‌شود.";
  }
  return getErrorMessage(error) || "بررسی اتصال سپیدار ناموفق بود.";
}

function isApiErrorCode(error: unknown, code: string): error is ApiError {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as ApiError).code === code,
  );
}
