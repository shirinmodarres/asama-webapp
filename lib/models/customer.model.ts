import type { SepidarStock } from "@/lib/models/stock.model";
import type { PriceList } from "@/lib/models/pricing.model";

export type CustomerStatus = "active" | "inactive";
export type CustomerAddressStatus = "active" | "inactive";
export type ReceiverType = "self" | "other";

export interface CustomerAddress {
  objectId: string;
  id: string;
  customerId: string;
  title: string;
  receiverType: ReceiverType;
  receiverFullName: string;
  receiverPhone: string | null;
  province: string;
  city: string;
  county: string | null;
  fullAddress: string;
  postalCode: string | null;
  plaque: string | null;
  unit: string | null;
  isDefault: boolean;
  status: CustomerAddressStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  objectId: string;
  id: string;
  sepidarCustomerId: string | null;
  sepidarCustomerCode: string | null;
  saleType: {
    objectId: string | null;
    sepidarSaleTypeId: number | null;
    title: string | null;
  } | null;
  priceListId: string | null;
  priceListIds: string[];
  priceListTitle: string | null;
  priceListType: string | null;
  priceListBrand: string | null;
  priceLists: PriceList[];
  allowedStockObjectIds: string[];
  allowedSepidarStockIds: number[];
  allowedStocks: SepidarStock[];
  allowedStockTitles: string[];
  isSyncedFromSepidar: boolean;
  fullName: string;
  phone: string;
  mobile: string | null;
  address: string | null;
  postalCode: string | null;
  nationalId: string | null;
  assignedExpertName: string | null;
  status: CustomerStatus;
  statusLabel: string;
  defaultAddress: CustomerAddress | null;
  addresses: CustomerAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus;
  limit?: number;
  offset?: number;
}

export interface CustomerPayload {
  fullName: string;
  phone: string;
  nationalId?: string | null;
  status?: CustomerStatus;
  defaultAddress?: CustomerAddressPayload | null;
}

export interface CustomerAddressPayload {
  title?: string | null;
  receiverType: ReceiverType;
  receiverFullName?: string | null;
  receiverPhone?: string | null;
  province: string;
  city: string;
  county?: string | null;
  fullAddress: string;
  postalCode?: string | null;
  plaque?: string | null;
  unit?: string | null;
  isDefault?: boolean;
}
