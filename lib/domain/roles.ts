export type BackendRoleKey =
  | "god"
  | "expert"
  | "sales_manager"
  | "financial_control"
  | "systems_expert"
  | "warehouse"
  | "finance"
  | "support"
  | "naja_expert"
  | "store_sales_expert";

export type PanelRoleKey =
  | "expert"
  | "manager"
  | "finance-control"
  | "warehouse"
  | "finance"
  | "support"
  | "naja"
  | "store-expert";

export const ROLE_LABELS: Record<BackendRoleKey, string> = {
  god: "مدیرکل",
  expert: "کارشناس",
  sales_manager: "مدیر فروش",
  financial_control: "خزانه‌دار",
  warehouse: "انباردار",
  finance: "حسابدار فروش",
  systems_expert: "کارشناس سامانه‌ها",
  support: "پشتیبان",
  naja_expert: "کارشناس ناجا",
  store_sales_expert: "کارشناس فروش فروشگاه",
};

export const PANEL_ROUTE_BY_ROLE: Record<BackendRoleKey, `/${PanelRoleKey}`> = {
  god: "/manager",
  expert: "/expert",
  sales_manager: "/manager",
  financial_control: "/finance-control",
  systems_expert: "/finance-control",
  warehouse: "/warehouse",
  finance: "/finance",
  support: "/support",
  naja_expert: "/naja",
  store_sales_expert: "/store-expert",
};

export const PANEL_ROLE_BY_BACKEND_ROLE: Record<BackendRoleKey, PanelRoleKey> = {
  god: "manager",
  expert: "expert",
  sales_manager: "manager",
  financial_control: "finance-control",
  systems_expert: "finance-control",
  warehouse: "warehouse",
  finance: "finance",
  support: "support",
  naja_expert: "naja",
  store_sales_expert: "store-expert",
};

export const BACKEND_ROLE_BY_PANEL_ROLE: Record<PanelRoleKey, BackendRoleKey> = {
  expert: "expert",
  manager: "sales_manager",
  "finance-control": "financial_control",
  warehouse: "warehouse",
  finance: "finance",
  support: "support",
  naja: "naja_expert",
  "store-expert": "store_sales_expert",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS)
  .filter(([value]) => value !== "financial_control")
  .map(([value, label]) => ({
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

export function getEffectiveRole(
  user: { role: BackendRoleKey; activeRole?: BackendRoleKey | null },
): BackendRoleKey {
  return user.role === "god" && user.activeRole && user.activeRole !== "god"
    ? user.activeRole
    : user.role;
}

export function getPanelRoleForBackendRole(
  role: BackendRoleKey | null | undefined,
): PanelRoleKey | null {
  if (!role) return null;
  return PANEL_ROLE_BY_BACKEND_ROLE[role] ?? null;
}
