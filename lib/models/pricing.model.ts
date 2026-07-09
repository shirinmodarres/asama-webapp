export interface SepidarPriceList {
  objectId: string;
  id: string;
  brandName: string | null;
  title: string;
  saleTypeTitle: string;
  code: string | null;
  saleTypeCode: string | null;
  sepidarSaleTypeId: number | null;
  itemCount: number;
  lastSyncedAt: string | null;
  status: string;
  isAvailable: boolean;
}

export interface PricingBrand {
  brandName: string;
  source: string;
  productCount: number;
}

export interface PricingReference {
  objectId: string;
  id: string;
  brandName: string | null;
  sepidarSaleTypeId: number | null;
  sourceSaleTypeObjectId: string | null;
  internalCode: string | null;
  displayName: string | null;
  notes: string | null;
  isActive: boolean;
  archivedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
}

export interface PriceList {
  objectId: string;
  id: string;
  brandName: string | null;
  name: string;
  title: string;
  code: string | null;
  internalCode: string | null;
  displayName: string;
  referenceInternalCode: string | null;
  typeCode: string | null;
  typeTitle: string | null;
  sourceReferenceId: string | null;
  sourceSepidarSaleTypeId: number | null;
  formulaMultiplier: number;
  formulaDescription: string | null;
  isActive: boolean;
  generatedAt: string | null;
  itemCount: number;
}

export interface PriceListItem {
  objectId: string;
  id: string;
  priceListId: string | null;
  productObjectId: string | null;
  sepidarItemId: number | null;
  productCode: string | null;
  productName: string;
  brandName: string | null;
  sourcePrice: number | null;
  finalPrice: number | null;
  formulaMultiplier: number | null;
  sourcePriceNoteItemId: number | null;
}

export interface ExpertPriceListAssignment {
  objectId: string;
  id: string;
  expertUserId: string | null;
  expertName: string | null;
  priceListIds: string[];
  priceLists: PriceList[];
  isActive: boolean;
  assignedBy: string | null;
  assignedAt: string | null;
}
