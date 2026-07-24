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
    priceListObjectId: toNullableString(record.priceListObjectId || record.priceListId),
    priceListId: toNullableString(record.priceListId || record.priceListObjectId),
    priceListTitle: toNullableString(record.priceListTitle),
    priceListType: toNullableString(record.priceListType),
    priceListBrand: toNullableString(record.priceListBrand),
    customerName: toNullableString(record.customerName),
    customerPhone: toNullableString(record.customerPhone),
    customer,
    expertName: toNullableString(record.expertName),
    status: normalizeStatus(record.status),
    subtotal: toNumberValue(record.subtotal),
    discount: toNumberValue(record.discount),
    tax: toNumberValue(record.tax),
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
