import {
  toArray,
  toBooleanValue,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import type {
  ProductStockInventory,
  SepidarStock,
  StockTransferRequest,
} from "@/lib/models/stock.model";
import { normalizeDigits } from "@/lib/utils/number-format";

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار تأیید مدیر",
  pending_manager_approval: "در انتظار تأیید مدیر",
  approved_waiting_warehouse_scan: "در انتظار اسکن انبار",
  approved_waiting_tracking_codes: "در انتظار اسکن انبار",
  approved: "تکمیل شده",
  completed: "تکمیل شده",
  rejected: "رد شده",
  cancelled: "لغو شده",
};

export function mapSepidarStockDto(dto: unknown): SepidarStock {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId ?? record.stockObjectId),
    id:
      toStringValue(record.id) ||
      toStringValue(record.objectId ?? record.stockObjectId),
    sepidarStockId:
      record.sepidarStockId === undefined || record.sepidarStockId === null
        ? null
        : toNumberValue(record.sepidarStockId),
    code: toNullableString(record.code),
    title: toStringValue(record.title),
    isActive: toBooleanValue(record.isActive ?? true),
    isZagros: toBooleanValue(record.isZagros),
    realInventoryCount: toNumberValue(record.realInventoryCount),
    salesInventoryCount: toNumberValue(record.salesInventoryCount),
    reservedInventoryCount: toNumberValue(record.reservedInventoryCount),
    availableSalesInventoryCount: toNumberValue(
      record.availableSalesInventoryCount,
    ),
    lastSepidarSyncAt: toNullableString(record.lastSepidarSyncAt),
    createdAt: toNullableString(record.createdAt),
    updatedAt: toNullableString(record.updatedAt),
  };
}

export function mapSepidarStockListDto(dto: unknown): SepidarStock[] {
  const record = toRecord(dto);
  const source = Array.isArray(dto)
    ? dto
    : record.items ?? record.stocks ?? record.results ?? [];
  return toArray(source).map(mapSepidarStockDto);
}

export function mapProductStockInventoryDto(
  dto: unknown,
): ProductStockInventory {
  const record = toRecord(dto);
  const stock = record.stock ? mapSepidarStockDto(record.stock) : null;
  const useFullRealQuantityForSales = toBooleanValue(
    record.useFullRealQuantityForSales,
  );
  const realQuantity = toNumberValue(record.realQuantity);
  const salesQuantity = toNumberValue(record.salesQuantity);
  const salesCapacity = toNumberValue(
    record.salesCapacity ??
      (useFullRealQuantityForSales
        ? realQuantity
        : salesQuantity),
  );
  const backendReservedQuantity = toNumberValue(record.reservedQuantity);
  const availableForSaleFromBackend = toNumberValue(
    record.availableForSale ??
      record.availableSalesQuantity ??
      (salesCapacity - backendReservedQuantity),
  );
  const derivedReservedQuantity = Math.max(
    0,
    realQuantity - availableForSaleFromBackend,
  );
  const reservedQuantity =
    backendReservedQuantity > 0 ? backendReservedQuantity : derivedReservedQuantity;
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    productObjectId: toNullableString(record.productObjectId),
    sepidarItemId:
      record.sepidarItemId === undefined || record.sepidarItemId === null
        ? null
        : toNumberValue(record.sepidarItemId),
    productCode: toNullableString(record.productCode ?? record.productSku),
    productTitle: toNullableString(record.productTitle ?? record.productName),
    productSku: normalizeDigits(
      toStringValue(record.productSku ?? record.productCode),
    ),
    productName: toStringValue(record.productName ?? record.productTitle),
    brandObjectId: toNullableString(record.brandObjectId),
    brandName: toNullableString(record.brandName ?? record.productBrandName),
    brandTitle: toNullableString(record.brandTitle ?? record.brandName),
    stockObjectId: toNullableString(record.stockObjectId),
    sepidarStockId:
      record.sepidarStockId === undefined || record.sepidarStockId === null
        ? null
        : toNumberValue(record.sepidarStockId),
    stockTitle: toStringValue(record.stockTitle ?? stock?.title),
    stock,
    realQuantity,
    salesQuantity,
    salesCapacity,
    useFullRealQuantityForSales,
    reservedQuantity,
    unreservedQuantity: toNumberValue(record.unreservedQuantity),
    availableForSale: toNumberValue(
      record.availableForSale ??
        record.availableSalesQuantity ??
        (salesCapacity - reservedQuantity),
    ),
    availableSalesQuantity: toNumberValue(
      record.availableForSale ??
        record.availableSalesQuantity ??
        (salesCapacity - reservedQuantity),
    ),
    createdAt: toNullableString(record.createdAt),
    updatedAt: toNullableString(record.updatedAt),
  };
}

export function mapProductStockInventoryListDto(
  dto: unknown,
): ProductStockInventory[] {
  const record = toRecord(dto);
  const source = Array.isArray(dto)
    ? dto
    : record.items ?? record.inventories ?? record.results ?? [];
  return toArray(source).map(mapProductStockInventoryDto);
}

export function mapStockTransferRequestDto(dto: unknown): StockTransferRequest {
  const record = toRecord(dto);
  const status = toStringValue(record.status) || "pending";
  const items = toArray(record.items).map((itemDto) => {
    const item = toRecord(itemDto);
    return {
      productObjectId: toStringValue(item.productObjectId),
      sepidarItemId:
        item.sepidarItemId === undefined || item.sepidarItemId === null
          ? null
          : toNumberValue(item.sepidarItemId),
      productCode: toNullableString(item.productCode ?? item.productSku),
      productName: toNullableString(item.productName ?? item.productNameSnapshot),
      productNameSnapshot: toNullableString(
        item.productNameSnapshot ?? item.productName,
      ),
      quantity: toNumberValue(item.quantity),
      scannedUnitIds: toArray(
        item.scannedUnitIds ?? item.scannedUnitObjectIds,
      ).map((id) => toStringValue(id)),
      scannedUnitObjectIds: toArray(
        item.scannedUnitObjectIds ?? item.scannedUnitIds,
      ).map((id) => toStringValue(id)),
      units: toArray(item.units).map((unitDto) => {
        const unit = toRecord(unitDto);
        return {
          unitObjectId: toStringValue(unit.unitObjectId ?? unit.objectId),
          productIdentifier: toNullableString(unit.productIdentifier),
          serialNumber: toNullableString(unit.serialNumber),
          trackingCode: toNullableString(unit.trackingCode),
        };
      }),
    };
  });
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    sourceStockObjectId: toNullableString(record.sourceStockObjectId),
    sourceSepidarStockId:
      record.sourceSepidarStockId === undefined ||
      record.sourceSepidarStockId === null
        ? null
        : toNumberValue(record.sourceSepidarStockId),
    sourceStockTitle: toNullableString(record.sourceStockTitle),
    destinationStockObjectId: toNullableString(
      record.destinationStockObjectId,
    ),
    destinationSepidarStockId:
      record.destinationSepidarStockId === undefined ||
      record.destinationSepidarStockId === null
        ? null
        : toNumberValue(record.destinationSepidarStockId),
    destinationStockTitle: toNullableString(record.destinationStockTitle),
    productObjectId: toNullableString(record.productObjectId),
    sepidarItemId:
      record.sepidarItemId === undefined || record.sepidarItemId === null
        ? null
        : toNumberValue(record.sepidarItemId),
    productCode: toNullableString(record.productCode ?? record.productSku),
    productName: toNullableString(record.productName),
    quantity:
      record.quantity === undefined
        ? items.reduce((sum, item) => sum + item.quantity, 0)
        : toNumberValue(record.quantity),
    items,
    requestedByName: toNullableString(record.requestedByName),
    approvedByName: toNullableString(record.approvedByName),
    rejectedByName: toNullableString(record.rejectedByName),
    status,
    statusLabel: TRANSFER_STATUS_LABELS[status] || status,
    scannedUnitObjectIds: toArray(record.scannedUnitObjectIds).map((id) =>
      toStringValue(id),
    ),
    movedUnitCount: toNumberValue(record.movedUnitCount),
    transferSlipId: toNullableString(record.transferSlipId),
    requestedAt: toNullableString(record.requestedAt),
    approvedAt: toNullableString(record.approvedAt),
    rejectedAt: toNullableString(record.rejectedAt),
    note: toNullableString(record.note),
    createdAt: toNullableString(record.createdAt),
    updatedAt: toNullableString(record.updatedAt),
  };
}

export function mapStockTransferRequestListDto(
  dto: unknown,
): StockTransferRequest[] {
  const record = toRecord(dto);
  const source = Array.isArray(dto)
    ? dto
    : record.items ?? record.transfers ?? record.results ?? [];
  return toArray(source).map(mapStockTransferRequestDto);
}
