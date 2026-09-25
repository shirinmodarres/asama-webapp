import { mapCustomerDto } from "@/lib/mappers/customer.mapper";
import { toArray, toNullableString, toNumberValue, toRecord, toStringValue } from "@/lib/mappers/mapper-utils";
import type {
  SalesQuotation,
  SalesQuotationItem,
  SalesQuotationProductOption,
} from "@/lib/models/sales-quotation.model";

export function mapSalesQuotationDto(dto: unknown): SalesQuotation {
  const record = toRecord(dto);
  const customer = record.customer ? mapCustomerDto(record.customer) : null;
  return {
    objectId: toStringValue(record.objectId || record.id),
    id: toStringValue(record.id || record.objectId),
    quotationNumber: toStringValue(record.quotationNumber),
    expertObjectId: toNullableString(record.expertObjectId),
    customerObjectId: toNullableString(record.customerObjectId),
    salesTypeObjectId: toNullableString(record.salesTypeObjectId || record.saleTypeObjectId),
    salesTypeTitle: toNullableString(record.salesTypeTitle || record.saleTypeTitle),
    salesTypeInternalCode:
      record.salesTypeInternalCode === undefined || record.salesTypeInternalCode === null
        ? (record.saleTypeCode === undefined || record.saleTypeCode === null
          ? null
          : toNumberValue(record.saleTypeCode))
        : toNumberValue(record.salesTypeInternalCode),
    salesTypeSepidarCode:
      record.salesTypeSepidarCode === undefined || record.salesTypeSepidarCode === null
        ? (record.sepidarSaleTypeId === undefined || record.sepidarSaleTypeId === null
          ? null
          : toNumberValue(record.sepidarSaleTypeId))
        : toNumberValue(record.salesTypeSepidarCode),
    priceListObjectId: toNullableString(record.priceListObjectId || record.priceListId),
    priceListId: toNullableString(record.priceListId || record.priceListObjectId),
    priceListTitle: toNullableString(record.priceListTitle),
    priceListType: toNullableString(record.priceListType),
    priceListBrand: toNullableString(record.priceListBrand),
    customerName: toNullableString(record.customerName),
    customerPhone: toNullableString(record.customerPhone),
    customer,
    expertName: toNullableString(record.expertName),
    salesType: record.salesType || record.salesTypeObjectId || record.salesTypeTitle ? {
      objectId: toNullableString(record.salesTypeObjectId || record.saleTypeObjectId),
      title: toNullableString(record.salesTypeTitle || record.saleTypeTitle),
      internalCode:
        record.salesTypeInternalCode === undefined || record.salesTypeInternalCode === null
          ? (record.saleTypeCode === undefined || record.saleTypeCode === null
            ? null
            : toNumberValue(record.saleTypeCode))
          : toNumberValue(record.salesTypeInternalCode),
      sepidarCode:
        record.salesTypeSepidarCode === undefined || record.salesTypeSepidarCode === null
          ? (record.sepidarSaleTypeId === undefined || record.sepidarSaleTypeId === null
            ? null
            : toNumberValue(record.sepidarSaleTypeId))
          : toNumberValue(record.salesTypeSepidarCode),
    } : null,
    status: normalizeStatus(record.status),
    orderObjectId: toNullableString(record.orderObjectId),
    stockObjectId: toNullableString(record.stockObjectId),
    subtotal: toNumberValue(record.subtotal),
    adjustments: toArray(record.adjustments).map((value) => {
      const adjustment = toRecord(value);
      return {
        title: toStringValue(adjustment.title),
        percentage: toNumberValue(adjustment.percentage),
        type: adjustment.type === "addition" ? "addition" : "deduction",
        amount: toNumberValue(adjustment.amount),
      };
    }),
    deductionTotal: toNumberValue(record.deductionTotal),
    additionTotal: toNumberValue(record.additionTotal),
    finalTotal: toNumberValue(record.finalTotal ?? record.total),
    discountPercentage: toNumberValue(record.discountPercentage),
    discountAmount: toNumberValue(record.discountAmount ?? record.discount),
    discount: toNumberValue(record.discountAmount ?? record.discount),
    taxPercentage: toNumberValue(record.taxPercentage),
    taxAmount: toNumberValue(record.taxAmount ?? record.tax),
    tax: toNumberValue(record.taxAmount ?? record.tax),
    total: toNumberValue(record.total),
    notes: toNullableString(record.notes),
    validUntil: toNullableString(record.validUntil),
    pdfUrl: toNullableString(record.pdfUrl),
    finalizedAt: toNullableString(record.finalizedAt),
    cancelledAt: toNullableString(record.cancelledAt),
    cancelledByName: toNullableString(record.cancelledByName),
    createdByName: toNullableString(record.createdByName),
    createdByUserId: toNullableString(record.createdByUserId),
    createdAt: toNullableString(record.createdAt),
    updatedAt: toNullableString(record.updatedAt),
    items: toArray(record.items).map(mapSalesQuotationItemDto),
  };
}

export function mapSalesQuotationItemDto(dto: unknown): SalesQuotationItem {
  const record = toRecord(dto);
  return {
    rowNumber:
      record.rowNumber === undefined || record.rowNumber === null
        ? undefined
        : toNumberValue(record.rowNumber),
    productObjectId: toStringValue(record.productObjectId || record.productId),
    productId: toNullableString(record.productId || record.productObjectId),
    productSku: toNullableString(record.productSku),
    productName: toStringValue(record.productName),
    brandName: toNullableString(record.brandName),
    sepidarItemId:
      record.sepidarItemId === undefined || record.sepidarItemId === null
        ? null
        : toNumberValue(record.sepidarItemId),
    quantity: toNumberValue(record.quantity),
    unitPrice: toNumberValue(record.unitPrice),
    discount: toNumberValue(record.discount),
    tax: toNumberValue(record.tax),
    lineSubtotal: toNumberValue(record.lineSubtotal),
    lineTotal: toNumberValue(record.lineTotal),
    priceListId: toNullableString(record.priceListId),
    priceListItemId: toNullableString(record.priceListItemId),
    pricingSource: toNullableString(record.pricingSource),
  };
}

export function mapSalesQuotationListDto(dto: unknown): SalesQuotation[] {
  return toArray(dto).map(mapSalesQuotationDto);
}

export function mapSalesQuotationProductOptionDto(dto: unknown): SalesQuotationProductOption {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId || record.productObjectId),
    productObjectId: toStringValue(record.productObjectId || record.objectId),
    sepidarItemId:
      record.sepidarItemId === undefined || record.sepidarItemId === null
        ? null
        : toNumberValue(record.sepidarItemId),
    sepidarCode: toNullableString(record.sepidarCode || record.sku),
    sku: toNullableString(record.sku || record.sepidarCode),
    name: toStringValue(record.name || record.title),
    title: toStringValue(record.title || record.name),
    brandName: toNullableString(record.brandName),
    unitPrice: toNumberValue(record.unitPrice),
    priceListId: toNullableString(record.priceListId),
    priceListItemId: toNullableString(record.priceListItemId),
    pricingSource: toNullableString(record.pricingSource),
    availableForSale: toNumberValue(record.availableForSale),
    availableSalesQuantity: toNumberValue(record.availableSalesQuantity || record.availableForSale),
    availableStocks: toArray(record.availableStocks).map((stock) => {
      const row = toRecord(stock);
      return {
        stockObjectId: toStringValue(row.stockObjectId),
        sepidarStockId:
          row.sepidarStockId === undefined || row.sepidarStockId === null
            ? null
            : toNumberValue(row.sepidarStockId),
        stockTitle: toStringValue(row.stockTitle),
        realQuantity: toNumberValue(row.realQuantity),
        salesQuantity: toNumberValue(row.salesQuantity),
        reservedQuantity: toNumberValue(row.reservedQuantity),
        useFullRealQuantityForSales: row.useFullRealQuantityForSales === true,
        availableForSale: toNumberValue(row.availableForSale),
        availableSalesQuantity: toNumberValue(row.availableSalesQuantity || row.availableForSale),
      };
    }),
  };
}

export function mapSalesQuotationProductOptionListDto(dto: unknown): SalesQuotationProductOption[] {
  return toArray(dto).map(mapSalesQuotationProductOptionDto);
}

function normalizeStatus(value: unknown): "draft" | "finalized" | "cancelled" {
  return value === "finalized" || value === "cancelled" ? value : "draft";
}
