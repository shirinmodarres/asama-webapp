import type { PanelRoleKey } from "@/lib/domain/roles";

export type RoleKey = PanelRoleKey;

export type RoleIconName =
  | "briefcase"
  | "shield-check"
  | "warehouse"
  | "receipt"
  | "headset";

export type SidebarIconName =
  | "dashboard"
  | "boxes"
  | "shopping-cart"
  | "plus-circle"
  | "clipboard-check"
  | "activity"
  | "truck"
  | "package"
  | "file-check"
  | "file-text"
  | "layers"
  | "history"
  | "pencil"
  | "users"
  | "warehouse"
  | "building-2";

export interface Role {
  key: RoleKey;
  title: string;
  description: string;
  path: `/${RoleKey}`;
  userName: string;
  team: string;
  icon: RoleIconName;
  entrySummary: string;
  accent: "brand" | "success" | "neutral";
}

export interface SidebarItem {
  label: string;
  href: string;
  icon: SidebarIconName;
  description?: string;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  hint: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
}
