import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Boxes,
  BriefcaseBusiness,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Headset,
  History,
  LayoutDashboard,
  Package,
  PencilLine,
  PlusCircle,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type { RoleIconName, SidebarIconName } from "@/lib/types";

export const roleIconMap: Record<RoleIconName, LucideIcon> = {
  briefcase: BriefcaseBusiness,
  "shield-check": ShieldCheck,
  warehouse: Warehouse,
  receipt: ReceiptText,
  headset: Headset,
};

export const sidebarIconMap: Record<SidebarIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  boxes: Boxes,
  "shopping-cart": ShoppingCart,
  "plus-circle": PlusCircle,
  "clipboard-check": ClipboardCheck,
  activity: Activity,
  truck: Truck,
  package: Package,
  "file-check": FileCheck2,
  "file-text": FileText,
  layers: FileSpreadsheet,
  history: History,
  pencil: PencilLine,
  users: Users,
};
