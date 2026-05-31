import type { Customer } from "@/lib/models/customer.model";
import type { AuthUser } from "@/lib/models/auth.model";

export type CustomerAssignmentStatus = "active" | "inactive";

export interface ExpertCustomerAssignment {
  objectId: string;
  expertObjectId: string;
  customerObjectId: string;
  saleTypeObjectId: string | null;
  expert: AuthUser | null;
  customer: Customer | null;
  saleType: SepidarSaleType | null;
  expertName: string;
  customerName: string;
  customerPhone: string;
  sepidarCustomerCode: string | null;
  saleTypeTitle: string | null;
  sepidarSaleTypeId: number | null;
  assignedAt: string;
  status: CustomerAssignmentStatus;
  statusLabel: string;
}

export interface CreateExpertCustomerAssignmentPayload {
  expertUserId: string;
  customerObjectId: string;
  saleTypeObjectId: string;
  assignedByName: string;
}

export interface SepidarSaleType {
  objectId: string;
  id: string;
  sepidarSaleTypeId: number | null;
  title: string;
  market: string | null;
  isAvailable: boolean;
  lastSepidarSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SepidarCustomerSyncSummary {
  total: number;
  processed: number;
  created: number;
  updated: number;
  rejected: number;
  failed: number;
}
