export type BackendRoleKey =
  | "expert"
  | "sales_manager"
  | "warehouse"
  | "finance"
  | "support"
  | "naja_expert";

export type PanelRoleKey =
  | "expert"
  | "manager"
  | "warehouse"
  | "finance"
  | "support"
  | "naja";

export const ROLE_LABELS: Record<BackendRoleKey, string> = {
  expert: "کارشناس",
  sales_manager: "مدیر فروش",
  warehouse: "انباردار",
  finance: "حسابداری",
  support: "پشتیبان",
  naja_expert: "کارشناس ناجا",
};

export const PANEL_ROUTE_BY_ROLE: Record<BackendRoleKey, `/${PanelRoleKey}`> = {
  expert: "/expert",
  sales_manager: "/manager",
  warehouse: "/warehouse",
  finance: "/finance",
  support: "/support",
  naja_expert: "/naja",
};

export const PANEL_ROLE_BY_BACKEND_ROLE: Record<BackendRoleKey, PanelRoleKey> = {
  expert: "expert",
  sales_manager: "manager",
  warehouse: "warehouse",
  finance: "finance",
  support: "support",
  naja_expert: "naja",
};

export const BACKEND_ROLE_BY_PANEL_ROLE: Record<PanelRoleKey, BackendRoleKey> = {
  expert: "expert",
  manager: "sales_manager",
  warehouse: "warehouse",
  finance: "finance",
  support: "support",
  naja: "naja_expert",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as BackendRoleKey,
  label,
}));

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role as BackendRoleKey] ?? role;
}

export function getPanelRouteForRole(
  role: BackendRoleKey | null | undefined,
): "/" | `/${PanelRoleKey}` {
  if (!role) return "/";
  return PANEL_ROUTE_BY_ROLE[role] ?? "/";
}

export function getPanelRoleForBackendRole(
  role: BackendRoleKey | null | undefined,
): PanelRoleKey | null {
  if (!role) return null;
  return PANEL_ROLE_BY_BACKEND_ROLE[role] ?? null;
}
