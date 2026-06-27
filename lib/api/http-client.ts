import { ApiError, FALLBACK_ERROR_MESSAGE } from "@/lib/api/api-error";
import { clearStoredSession } from "@/lib/auth/storage";

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/$/, "")
  : "http://localhost:4000";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error?: {
        code?: string;
        message?: string;
        details?: unknown;
      };
    };

const ASAMA_AUTH_ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "AUTH_REQUIRED",
  "SESSION_EXPIRED",
]);

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
}

export async function httpRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (typeof window !== "undefined") {
    const sessionToken = window.localStorage.getItem("sessionToken");
    if (sessionToken) {
      headers["session-token"] = sessionToken;
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiError({
      code: "NETWORK_ERROR",
      message: "اتصال به سرور برقرار نشد.",
      details: error,
    });
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const apiError = createApiError(payload, response.status);
    if (
      typeof window !== "undefined" &&
      ASAMA_AUTH_ERROR_CODES.has(apiError.code)
    ) {
      clearStoredSession();
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }
    throw apiError;
  }

  if (isApiResponse<T>(payload)) {
    if (payload.ok) return payload.data;
    throw createApiError(payload, response.status);
  }

  return payload as T;
}

export const httpClient = {
  get: <T>(path: string) => httpRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    httpRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    httpRequest<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) =>
    httpRequest<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => httpRequest<T>(path, { method: "DELETE" }),
};

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");
  return text.trim() ? text : null;
}

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    !!payload &&
    typeof payload === "object" &&
    "ok" in payload &&
    typeof (payload as { ok: unknown }).ok === "boolean"
  );
}

function createApiError(payload: unknown, status?: number): ApiError {
  if (isApiResponse<unknown>(payload) && !payload.ok) {
    const code = payload.error?.code ?? `HTTP_${status ?? 500}`;
    const message = payload.error?.message ?? FALLBACK_ERROR_MESSAGE;

    return new ApiError({
      code,
      message,
      status,
      details:
        payload.error?.details ??
        (payload.error && "duplicates" in payload.error
          ? { duplicates: payload.error.duplicates }
          : undefined),
    });
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const error = record.error;

    if (error && typeof error === "object") {
      const errorRecord = error as Record<string, unknown>;
      return new ApiError({
        code: toStringValue(errorRecord.code) || `HTTP_${status ?? 500}`,
        message: toStringValue(errorRecord.message) || FALLBACK_ERROR_MESSAGE,
        status,
        details: errorRecord.details,
      });
    }

    return new ApiError({
      code: toStringValue(record.code) || `HTTP_${status ?? 500}`,
      message:
        toStringValue(record.message) ||
        toStringValue(record.error) ||
        FALLBACK_ERROR_MESSAGE,
      status,
      details: payload,
    });
  }

  return new ApiError({
    code: `HTTP_${status ?? 500}`,
    message: typeof payload === "string" && payload ? payload : FALLBACK_ERROR_MESSAGE,
    status,
    details: payload,
  });
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
