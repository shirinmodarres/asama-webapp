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
  pending: "در انتظار تأیید",
  pending_manager_approval: "در انتظار تأیید مدیر",
  approved_waiting_warehouse_scan: "در انتظار اسکن انبار",
  approved_waiting_tracking_codes: "در انتظار ثبت کدهای رهگیری",
  approved: "تأیید شده",
  completed: "تکمیل شده",
  rejected: "رد شده",
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
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    productObjectId: toNullableString(record.productObjectId),
    sepidarItemId:
      record.sepidarItemId === undefined || record.sepidarItemId === null
        ? null
        : toNumberValue(record.sepidarItemId),
    productSku: normalizeDigits(toStringValue(record.productSku)),
    productName: toStringValue(record.productName),
    stockObjectId: toNullableString(record.stockObjectId),
    sepidarStockId:
      record.sepidarStockId === undefined || record.sepidarStockId === null
        ? null
        : toNumberValue(record.sepidarStockId),
    stockTitle: toStringValue(record.stockTitle ?? stock?.title),
    stock,
    realQuantity: toNumberValue(record.realQuantity),
    salesQuantity: toNumberValue(record.salesQuantity),
    useFullRealQuantityForSales: toBooleanValue(
      record.useFullRealQuantityForSales,
    ),
    reservedQuantity: toNumberValue(record.reservedQuantity),
    availableSalesQuantity: toNumberValue(record.availableSalesQuantity),
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
    productName: toNullableString(record.productName),
    quantity: toNumberValue(record.quantity),
    items: toArray(record.items).map((itemDto) => {
      const item = toRecord(itemDto);
      return {
        productObjectId: toStringValue(item.productObjectId),
        sepidarItemId:
          item.sepidarItemId === undefined || item.sepidarItemId === null
            ? null
            : toNumberValue(item.sepidarItemId),
        productName: toNullableString(item.productName),
        quantity: toNumberValue(item.quantity),
        scannedUnitObjectIds: toArray(item.scannedUnitObjectIds).map((id) =>
          toStringValue(id),
        ),
      };
    }),
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
