import type { Customer } from "@/lib/models/customer.model";
import type { AuthUser } from "@/lib/models/auth.model";
import type { SepidarStock } from "@/lib/models/stock.model";
import type { PriceList } from "@/lib/models/pricing.model";

export type CustomerAssignmentStatus = "active" | "inactive";

export interface ExpertCustomerAssignment {
  objectId: string;
  expertObjectId: string;
  customerObjectId: string;
  saleTypeObjectId: string | null;
  priceListId: string | null;
  priceListTitle: string | null;
  priceListType: string | null;
  priceListBrand: string | null;
  expert: AuthUser | null;
  customer: Customer | null;
  saleType: SepidarSaleType | null;
  priceList: PriceList | null;
  expertName: string;
  customerName: string;
  customerPhone: string;
  sepidarCustomerCode: string | null;
  saleTypeTitle: string | null;
  sepidarSaleTypeId: number | null;
  allowedStockObjectIds: string[];
  allowedSepidarStockIds: number[];
  allowedStocks: SepidarStock[];
  assignedAt: string;
  status: CustomerAssignmentStatus;
  statusLabel: string;
}

export interface CreateExpertCustomerAssignmentPayload {
  expertUserId: string;
  customerObjectId: string;
  saleTypeObjectId?: string;
  priceListId?: string;
  allowedStockObjectIds: string[];
  assignedByName: string;
}

export interface UpdateExpertCustomerAssignmentPayload {
  expertUserId: string;
  customerObjectId: string;
  saleTypeObjectId?: string;
  priceListId?: string;
  allowedStockObjectIds: string[];
  updatedByName: string;
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
