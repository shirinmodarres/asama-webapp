import { httpClient } from "@/lib/api/http-client";
import { toBooleanValue, toNumberValue, toRecord, toStringValue } from "@/lib/mappers/mapper-utils";

export interface SepidarSettings {
  baseUrl: string;
  integrationId: string | null;
  deviceTitle: string | null;
  deviceSerialMasked: string | null;
  username: string;
  passwordConfigured: boolean;
  generationVersion: string;
  hasPublicKey: boolean;
  hasToken: boolean;
  tokenPreview: string | null;
  status: string | null;
  errorMessage: string | null;
  lastRegisterAt: string | null;
  lastLoginAt: string | null;
  lastAuthorizedAt: string | null;
}

export interface UpdateSepidarSettingsPayload {
  baseUrl?: string;
  username?: string;
  password?: string;
  deviceSerial?: string;
  generationVersion?: string;
}

export type SepidarDiagnosticStepStatus = "success" | "failed" | "skipped";

export interface SepidarDiagnosticStep {
  key: string;
  title: string;
  status: SepidarDiagnosticStepStatus;
  message: string;
  userMessage: string | null;
}

export interface SepidarConnectionTestResult {
  ok: boolean;
  checkedAt: string | null;
  baseUrl: string;
  steps: SepidarDiagnosticStep[];
}

export interface SepidarSyncLogSummary {
  syncType: string;
  status: string;
  totalFromSepidar: number;
  processedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  logId: string | null;
}

export interface SepidarSyncOperationSummary {
  syncType: string;
  total: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  logId: string | null;
}

export async function getSepidarSettings(): Promise<SepidarSettings> {
  const data = await httpClient.get<unknown>("/api/integrations/sepidar/settings");
  return mapSepidarSettings(data);
}

export async function updateSepidarSettings(
  payload: UpdateSepidarSettingsPayload,
): Promise<SepidarSettings> {
  const data = await httpClient.patch<unknown>(
    "/api/integrations/sepidar/settings",
    payload,
  );
  return mapSepidarSettings(data);
}

export async function testSepidarConnection(): Promise<SepidarConnectionTestResult> {
  const data = await httpClient.post<unknown>(
    "/api/integrations/sepidar/test-connection",
  );
  return mapSepidarConnectionTestResult(data);
}

export async function getSepidarSyncSummary(): Promise<SepidarSyncLogSummary[]> {
  const data = await httpClient.get<unknown>("/api/integrations/sepidar/sync/summary");
  const record = toRecord(data);
  return ["items", "customers", "sale-types", "prices", "stocks"].map((syncType) =>
    mapSepidarSyncLogSummary(record[syncType], syncType),
  );
}

export async function syncSepidarItems(): Promise<SepidarSyncOperationSummary> {
  return syncSepidar("/api/integrations/sepidar/sync/items");
}

export async function syncSepidarCustomers(): Promise<SepidarSyncOperationSummary> {
  return syncSepidar("/api/integrations/sepidar/sync/customers");
}

export async function syncSepidarSaleTypes(): Promise<SepidarSyncOperationSummary> {
  return syncSepidar("/api/integrations/sepidar/sync/sale-types");
}

export async function syncSepidarPrices(): Promise<SepidarSyncOperationSummary> {
  return syncSepidar("/api/integrations/sepidar/sync/prices");
}

export async function syncSepidarStocks(): Promise<SepidarSyncOperationSummary> {
  return syncSepidar("/api/integrations/sepidar/sync/stocks");
}

async function syncSepidar(path: string): Promise<SepidarSyncOperationSummary> {
  const data = await httpClient.post<unknown>(path);
  return mapSepidarSyncOperationSummary(data);
}

function mapSepidarSettings(dto: unknown): SepidarSettings {
  const record = toRecord(dto);
  return {
    baseUrl: toStringValue(record.baseUrl),
    integrationId: toStringValue(record.integrationId) || null,
    deviceTitle: toStringValue(record.deviceTitle) || null,
    deviceSerialMasked: toStringValue(record.deviceSerialMasked) || null,
    username: toStringValue(record.username),
    passwordConfigured: toBooleanValue(record.passwordConfigured),
    generationVersion: toStringValue(record.generationVersion),
    hasPublicKey: toBooleanValue(record.hasPublicKey),
    hasToken: toBooleanValue(record.hasToken),
    tokenPreview: toStringValue(record.tokenPreview) || null,
    status: toStringValue(record.status) || null,
    errorMessage: toStringValue(record.errorMessage) || null,
    lastRegisterAt: toStringValue(record.lastRegisterAt) || null,
    lastLoginAt: toStringValue(record.lastLoginAt) || null,
    lastAuthorizedAt: toStringValue(record.lastAuthorizedAt) || null,
  };
}

function mapSepidarConnectionTestResult(dto: unknown): SepidarConnectionTestResult {
  const record = toRecord(dto);
  const steps = Array.isArray(record.steps) ? record.steps : [];
  return {
    ok: toBooleanValue(record.ok),
    checkedAt: toStringValue(record.checkedAt) || null,
    baseUrl: toStringValue(record.baseUrl),
    steps: steps.map(mapSepidarDiagnosticStep),
  };
}

function mapSepidarDiagnosticStep(dto: unknown): SepidarDiagnosticStep {
  const record = toRecord(dto);
  const details = toRecord(record.details);
  const status = toStringValue(record.status);
  return {
    key: toStringValue(record.key),
    title: getStepTitle(toStringValue(record.key), toStringValue(record.title)),
    status:
      status === "success" || status === "failed" || status === "skipped"
        ? status
        : "skipped",
    message: toStringValue(record.message),
    userMessage: toStringValue(details.userMessage) || null,
  };
}

function mapSepidarSyncLogSummary(
  dto: unknown,
  fallbackType: string,
): SepidarSyncLogSummary {
  const record = toRecord(dto);
  return {
    syncType: toStringValue(record.syncType) || fallbackType,
    status: toStringValue(record.status) || "never_run",
    totalFromSepidar: toNumberValue(record.totalFromSepidar),
    processedCount: toNumberValue(record.processedCount),
    createdCount: toNumberValue(record.createdCount),
    updatedCount: toNumberValue(record.updatedCount),
    skippedCount: toNumberValue(record.skippedCount),
    failedCount: toNumberValue(record.failedCount),
    startedAt: toStringValue(record.startedAt) || null,
    finishedAt: toStringValue(record.finishedAt) || null,
    errorMessage: toStringValue(record.errorMessage) || null,
    logId: toStringValue(record.logId) || null,
  };
}

function mapSepidarSyncOperationSummary(dto: unknown): SepidarSyncOperationSummary {
  const record = toRecord(dto);
  return {
    syncType: toStringValue(record.syncType),
    total: toNumberValue(record.total ?? record.totalCount ?? record.totalFromSepidar),
    processed: toNumberValue(record.processed ?? record.processedCount),
    created: toNumberValue(record.created ?? record.createdCount),
    updated: toNumberValue(record.updated ?? record.updatedCount),
    skipped: toNumberValue(record.skipped ?? record.skippedCount),
    failed: toNumberValue(record.failed ?? record.failedCount ?? record.errorCount),
    logId: toStringValue(record.logId) || null,
  };
}

function getStepTitle(key: string, fallback: string): string {
  const titles: Record<string, string> = {
    config: "تنظیمات",
    dns: "بررسی DNS",
    reachability: "اتصال به سرور",
    register: "رجیستر دستگاه",
    login: "ورود کاربر",
    authorization: "اعتبارسنجی توکن",
    items: "تست API کالاها",
    customers: "تست API مشتریان",
    saleTypes: "تست API نوع فروش",
  };
  return titles[key] || fallback || key;
}
