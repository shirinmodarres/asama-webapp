import { httpClient } from "@/lib/api/http-client";
import { getOrder } from "@/lib/services/order.service";
import { mapOrderListDto } from "@/lib/mappers/order.mapper";
import { mapProductListDto } from "@/lib/mappers/product.mapper";
import { mapProductStockInventoryListDto } from "@/lib/mappers/stock.mapper";
import {
  mapExitSlipDto,
  mapExitSlipPdfDataDto,
  mapExitSlipListDto,
  mapProductWarehouseInventoryListDto,
  mapWarehouseInboundReceiptDto,
  mapWarehouseInboundReceiptPageDto,
  mapWarehouseItemUnitDto,
  mapWarehouseItemUnitListDto,
} from "@/lib/mappers/warehouse.mapper";
import {
  toArray,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import type { Order } from "@/lib/models/order.model";
import type { Product } from "@/lib/models/product.model";
import type { ProductStockInventory } from "@/lib/models/stock.model";
import type {
  ConfirmDeliveryPayload,
  CreateExitSlipPayload,
  CreateInboundReceiptPayload,
  ExitSlip,
  ExitSlipPdfData,
  ProductWarehouseInventory,
  UpdateInboundReceiptPayload,
  ValidateExitSlipScanPayload,
  WarehouseInboundReceipt,
  WarehouseInboundReceiptPage,
  WarehouseInventoryUnitRow,
  WarehouseItemUnit,
  WarehouseStockUnitDetail,
  WarehouseStockUnitSummary,
  WarehouseStockBrand,
  WarehouseStockKpis,
  WarehouseStockProductSummary,
  WarehouseStockProductUnitsPage,
} from "@/lib/models/warehouse.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

export async function getWarehouseInventory(
  filters?: Record<string, string | undefined>,
): Promise<Product[]> {
  const data = await httpClient.get<unknown>(buildWarehouseInventoryPath(filters));
  return mapProductListDto(data);
}

export async function getProductWarehouseInventory(
  productObjectId: string,
): Promise<ProductWarehouseInventory[]> {
  const data = await httpClient.get<unknown>(
    `/api/products/${productObjectId}/warehouse-inventory`,
  );
  return mapProductWarehouseInventoryListDto(data);
}

export async function listWarehouseInventoryUnits(filters?: {
  stockObjectId?: string;
  productObjectId?: string;
  trackingCode?: string;
  serialNumber?: string;
  status?: string;
}): Promise<WarehouseInventoryUnitRow[]> {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await httpClient.get<unknown>(`/api/warehouse/inventory-units${suffix}`);
  return toArray(data).map(mapWarehouseInventoryUnitRow);
}

export async function listWarehouseStocksWithUnits(search = ""): Promise<WarehouseStockUnitSummary[]> {
  const suffix = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const data = await httpClient.get<unknown>(`/api/warehouse/stocks${suffix}`);
  return toArray(data).map(mapWarehouseStockUnitSummary);
}

export async function getWarehouseStockUnitDetail(
  stockObjectId: string,
): Promise<WarehouseStockUnitDetail> {
  const data = await httpClient.get<unknown>(`/api/warehouse/stocks/${stockObjectId}`);
  const record = toRecord(data);
  const stockRecord = toRecord(record.stock);
  return {
    stock: {
      objectId: toStringValue(stockRecord.objectId),
      id: toStringValue(stockRecord.id) || toStringValue(stockRecord.objectId),
      sepidarStockId:
        stockRecord.sepidarStockId === undefined || stockRecord.sepidarStockId === null
          ? null
          : toNumberValue(stockRecord.sepidarStockId),
      code: toNullableString(stockRecord.code),
      title: toStringValue(stockRecord.title),
    },
    kpis: mapWarehouseStockKpis(record.kpis),
  };
}

function mapWarehouseStockKpis(dto: unknown): WarehouseStockKpis {
  const record = toRecord(dto);
  return {
    realQuantity: toNumberValue(record.realQuantity),
    reservedQuantity: toNumberValue(record.reservedQuantity),
    availableForSale: toNumberValue(record.availableForSale),
    exitedQuantity: toNumberValue(record.exitedQuantity),
  };
}

export async function listWarehouseStockBrands(stockObjectId: string): Promise<WarehouseStockBrand[]> {
  const data = await httpClient.get<unknown>(`/api/warehouse/stocks/${stockObjectId}/brands`);
  return toArray(toRecord(data).brands).map((dto) => {
    const record = toRecord(dto);
    return {
      brandObjectId: toNullableString(record.brandObjectId),
      brandName: toStringValue(record.brandName),
      productCount: toNumberValue(record.productCount),
      realQuantity: toNumberValue(record.realQuantity),
      reservedQuantity: toNumberValue(record.reservedQuantity),
      availableForSale: toNumberValue(record.availableForSale),
      exitedQuantity: toNumberValue(record.exitedQuantity),
    };
  });
}

export async function listWarehouseStockBrandProducts(
  stockObjectId: string,
  brandObjectId: string,
): Promise<{ products: WarehouseStockProductSummary[]; kpis: WarehouseStockKpis }> {
  const data = await httpClient.get<unknown>(
    `/api/warehouse/stocks/${stockObjectId}/brands/${encodeURIComponent(brandObjectId)}/products`,
  );
  const record = toRecord(data);
  return {
    products: toArray(record.products).map((dto) => {
      const product = toRecord(dto);
      return {
        productObjectId: toStringValue(product.productObjectId),
        productCode: toStringValue(product.productCode),
        productName: toStringValue(product.productName),
        brandObjectId: toNullableString(product.brandObjectId),
        brandName: toStringValue(product.brandName),
        realQuantity: toNumberValue(product.realQuantity),
        reservedQuantity: toNumberValue(product.reservedQuantity),
        availableForSale: toNumberValue(product.availableForSale),
        exitedQuantity: toNumberValue(product.exitedQuantity),
      };
    }),
    kpis: mapWarehouseStockKpis(record.kpis),
  };
}

export async function listWarehouseStockProductUnits(
  stockObjectId: string,
  productObjectId: string,
  page = 1,
  pageSize = 25,
): Promise<WarehouseStockProductUnitsPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const data = await httpClient.get<unknown>(
    `/api/warehouse/stocks/${stockObjectId}/products/${productObjectId}/units?${params.toString()}`,
  );
  return mapWarehouseStockProductUnitsPage(data);
}

function mapWarehouseStockProductUnitsPage(data: unknown): WarehouseStockProductUnitsPage {
  const record = toRecord(data);
  const pagination = toRecord(record.pagination);
  return {
    stockObjectId: toStringValue(record.stockObjectId),
    productObjectId: toStringValue(record.productObjectId),
    units: toArray(record.units).map((dto) => {
      const unit = toRecord(dto);
      return {
        objectId: toStringValue(unit.objectId),
        id: toStringValue(unit.id) || toStringValue(unit.objectId),
        productCode: toStringValue(unit.productCode),
        productName: toStringValue(unit.productName),
        trackingCode: toStringValue(unit.trackingCode),
        serialNumber: toStringValue(unit.serialNumber),
        productIdentifier: toStringValue(unit.productIdentifier),
        quantity: toNumberValue(unit.quantity),
        status: toStringValue(unit.status),
        statusLabel: toStringValue(unit.statusLabel),
        inboundReceiptId: toNullableString(unit.inboundReceiptId),
        inboundReceiptCode: toNullableString(unit.inboundReceiptCode),
        createdAt: toNullableString(unit.createdAt),
      };
    }),
    pagination: {
      page: toNumberValue(pagination.page),
      pageSize: toNumberValue(pagination.pageSize),
      total: toNumberValue(pagination.total),
      totalPages: toNumberValue(pagination.totalPages),
    },
  };
}

export async function listWarehouseStockUnitsByTrackingCode(
  stockObjectId: string,
  trackingCode: string,
  page = 1,
  pageSize = 25,
): Promise<WarehouseStockProductUnitsPage> {
  const params = new URLSearchParams({ trackingCode, page: String(page), pageSize: String(pageSize) });
  const data = await httpClient.get<unknown>(
    `/api/warehouse/stocks/${stockObjectId}/units?${params.toString()}`,
  );
  return mapWarehouseStockProductUnitsPage(data);
}

function mapWarehouseStockUnitSummary(dto: unknown): WarehouseStockUnitSummary {
  const record = toRecord(dto);
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    sepidarStockId:
      record.sepidarStockId === undefined || record.sepidarStockId === null
        ? null
        : toNumberValue(record.sepidarStockId),
    code: toNullableString(record.code),
    title: toStringValue(record.title),
    isActive: Boolean(record.isActive),
    totalProductCount: toNumberValue(record.totalProductCount),
    totalUnitCount: toNumberValue(record.totalUnitCount),
    realQuantity: toNumberValue(record.realQuantity),
    reservedQuantity: toNumberValue(record.reservedQuantity),
    availableForSale: toNumberValue(record.availableForSale),
    exitedQuantity: toNumberValue(record.exitedQuantity),
    lastSepidarSyncAt: toNullableString(record.lastSepidarSyncAt),
  };
}

function mapWarehouseInventoryUnitRow(dto: unknown): WarehouseInventoryUnitRow {
  const record = toRecord(dto);
  const status = toStringValue(record.status);
  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    productObjectId: record.productObjectId ? String(record.productObjectId) : null,
    sepidarItemId:
      record.sepidarItemId === undefined || record.sepidarItemId === null
        ? null
        : toNumberValue(record.sepidarItemId),
    productSku: toStringValue(record.productSku),
    productName: toStringValue(record.productName),
    stockObjectId: record.stockObjectId ? String(record.stockObjectId) : null,
    sepidarStockId:
      record.sepidarStockId === undefined || record.sepidarStockId === null
        ? null
        : toNumberValue(record.sepidarStockId),
    stockTitle: toStringValue(record.stockTitle),
    status,
    statusLabel: toStringValue(record.statusLabel || status),
    realQuantity: toNumberValue(record.realQuantity),
    salesQuantity: toNumberValue(record.salesQuantity),
    salesCapacity: toNumberValue(record.salesCapacity),
    reservedQuantity: toNumberValue(record.reservedQuantity),
    availableForSale: toNumberValue(
      record.availableForSale ??
        record.availableSalesQuantity ??
        record.salesCapacity,
    ),
    availableSalesQuantity: toNumberValue(
      record.availableForSale ??
        record.availableSalesQuantity ??
        record.salesCapacity,
    ),
    units: mapWarehouseItemUnitListDto(record.units),
  };
}

export async function createInboundReceipt(
  payload: CreateInboundReceiptPayload,
): Promise<WarehouseInboundReceipt> {
  const data = await httpClient.post<unknown>(
    "/api/warehouse/inbound",
    normalizeInboundPayload(payload),
  );
  return mapWarehouseInboundReceiptDto(data);
}

export async function listInboundReceipts(
  { page = 1, pageSize = 25 }: { page?: number; pageSize?: number } = {},
): Promise<WarehouseInboundReceiptPage> {
  const data = await httpClient.get<unknown>(
    `/api/warehouse/inbound?page=${page}&pageSize=${pageSize}`,
  );
  return mapWarehouseInboundReceiptPageDto(data);
}

export async function getInboundReceipt(
  objectId: string,
  { page = 1, pageSize = 50 }: { page?: number; pageSize?: number } = {},
): Promise<WarehouseInboundReceipt> {
  const data = await httpClient.get<unknown>(
    `/api/warehouse/inbound/${objectId}?page=${page}&pageSize=${pageSize}`,
  );
  return mapWarehouseInboundReceiptDto(data);
}

export async function getInboundReceiptEditData(
  objectId: string,
): Promise<WarehouseInboundReceipt> {
  const data = await httpClient.get<unknown>(
    `/api/warehouse/inbound-receipts/${objectId}/edit`,
  );
  return mapWarehouseInboundReceiptDto(data);
}

export async function updateInboundReceipt(
  objectId: string,
  payload: UpdateInboundReceiptPayload,
): Promise<WarehouseInboundReceipt> {
  const data = await httpClient.patch<unknown>(
    `/api/warehouse/inbound-receipts/${objectId}`,
    normalizeUpdateInboundPayload(payload),
  );
  return mapWarehouseInboundReceiptDto(data);
}

export async function listWarehouseUnits(
  filters?: Record<string, string | undefined>,
): Promise<WarehouseItemUnit[]> {
  const data = await httpClient.get<unknown>(buildWarehouseUnitsPath(filters));
  return mapWarehouseItemUnitListDto(data);
}

export async function listWarehouseOrders(): Promise<Order[]> {
  const data = await httpClient.get<unknown>("/api/warehouse/orders");
  return mapOrderListDto(data);
}

export async function listWarehouseInventory(): Promise<
  ProductStockInventory[]
> {
  const data = await httpClient.get<unknown>("/api/warehouse/inventory");
  return mapProductStockInventoryListDto(data);
}

export async function validateExitSlipScan(
  orderObjectId: string,
  payload: ValidateExitSlipScanPayload,
): Promise<WarehouseItemUnit> {
  const data = await httpClient.post<unknown>(
    `/api/orders/${orderObjectId}/exit-slip/validate-scan`,
    {
      scannedCode: normalizeDigits(payload.scannedCode.trim()),
      currentScannedUnitIds: payload.currentScannedUnitIds,
    },
  );
  return mapWarehouseItemUnitDto(data);
}

export async function createExitSlip(
  orderObjectId: string,
  payload: CreateExitSlipPayload,
): Promise<ExitSlip> {
  const data = await httpClient.post<unknown>(
    `/api/orders/${orderObjectId}/exit-slip`,
    {
      ...payload,
      unitObjectIds: payload.unitObjectIds,
    },
  );
  return mapExitSlipDto(data);
}

export async function listExitSlips(): Promise<ExitSlip[]> {
  const data = await httpClient.get<unknown>("/api/exit-slips");
  return mapExitSlipListDto(data);
}

export async function getExitSlip(objectId: string): Promise<ExitSlip> {
  const data = await httpClient.get<unknown>(`/api/exit-slips/${objectId}`);
  const slip = mapExitSlipDto(data);
  return hydrateExitSlipOrder(slip);
}

export async function getExitSlipPdfData(
  objectId: string,
): Promise<ExitSlipPdfData> {
  const [data, slip] = await Promise.all([
    httpClient.get<unknown>(`/api/exit-slips/${objectId}/pdf-data`),
    getExitSlip(objectId),
  ]);
  const pdfData = mapExitSlipPdfDataDto(data);

  return {
    ...pdfData,
    customer: {
      name: pdfData.customer.name || slip.customerName,
      sepidarCustomerCode:
        pdfData.customer.sepidarCustomerCode || slip.sepidarCustomerCode,
      mobile: pdfData.customer.mobile || slip.customerMobile,
      phone: pdfData.customer.phone || slip.customerPhone,
      address:
        pdfData.customer.sepidarAddress?.Address ||
        pdfData.customer.sepidarAddress?.address ||
        slip.customerAddress ||
        slip.deliveryAddress ||
        slip.deliveryFullAddress,
    },
    recipient: {
      firstName:
        pdfData.recipient.firstName || slip.recipientFirstName,
      lastName: pdfData.recipient.lastName || slip.recipientLastName,
      nationalId:
        pdfData.recipient.nationalId || slip.recipientNationalId,
      mobile: pdfData.recipient.mobile || slip.recipientMobile,
      najaOrderNumber:
        pdfData.recipient.najaOrderNumber || slip.najaOrderNumber,
    },
    order: pdfData.order || slip.order,
  };
}

export async function getDeliveryByToken(token: string): Promise<ExitSlip> {
  const data = await httpClient.get<unknown>(`/api/delivery/${token}`);
  const delivery = mapExitSlipDto(data);
  return hydrateExitSlipOrder(delivery);
}

export async function confirmDelivery(
  token: string,
  payload: ConfirmDeliveryPayload,
): Promise<ExitSlip> {
  const data = await httpClient.post<unknown>(
    `/api/delivery/${token}/confirm`,
    {
      phone: normalizePhone(payload.phone),
      deliveryCode: normalizeDigits(payload.deliveryCode.trim()),
    },
  );
  const delivery = mapExitSlipDto(data);
  return hydrateExitSlipOrder(delivery);
}

export async function confirmExitSlipDelivery(
  exitSlipObjectId: string,
): Promise<ExitSlip> {
  const data = await httpClient.post<unknown>(
    `/api/exit-slips/${exitSlipObjectId}/confirm-delivery`,
  );
  return mapExitSlipDto(data);
}

function normalizeInboundPayload(
  payload: CreateInboundReceiptPayload,
): CreateInboundReceiptPayload {
  const items = Array.isArray(payload.items)
    ? payload.items
        .map((item) => ({
          productObjectId: String(item.productObjectId).trim(),
          units: item.units.map((unit) => ({
            productObjectId: String(unit.productObjectId || item.productObjectId || "").trim(),
            productIdentifier: normalizeDigits(unit.productIdentifier.trim()),
            serialNumber: normalizeDigits(unit.serialNumber.trim()),
            trackingCode: normalizeDigits(unit.trackingCode.trim()),
          })),
        }))
        .filter((item) => item.productObjectId && item.units.length > 0)
    : undefined;

  return {
    ...payload,
    units: payload.units?.map((unit) => ({
      productIdentifier: normalizeDigits(unit.productIdentifier.trim()),
      productObjectId: unit.productObjectId ? String(unit.productObjectId).trim() : payload.productObjectId,
      serialNumber: normalizeDigits(unit.serialNumber.trim()),
      trackingCode: normalizeDigits(unit.trackingCode.trim()),
    })) || [],
    items,
  };
}

function normalizeUpdateInboundPayload(
  payload: UpdateInboundReceiptPayload,
): UpdateInboundReceiptPayload {
  return {
    ...payload,
    productObjectId: payload.productObjectId,
    sepidarItemId: payload.sepidarItemId,
    units: payload.units.map((unit) => ({
      objectId: unit.objectId,
      productObjectId: unit.productObjectId,
      productIdentifier: normalizeDigits(unit.productIdentifier.trim()),
      serialNumber: normalizeDigits(unit.serialNumber.trim()),
      trackingCode: normalizeDigits(unit.trackingCode.trim()),
      quantity: Number(unit.quantity) || 0,
    })),
  };
}

function buildWarehouseUnitsPath(
  filters?: Record<string, string | undefined>,
): string {
  if (!filters) return "/api/warehouse/units";

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `/api/warehouse/units?${query}` : "/api/warehouse/units";
}

function buildWarehouseInventoryPath(
  filters?: Record<string, string | undefined>,
): string {
  if (!filters) return "/api/warehouse/inventory";

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `/api/warehouse/inventory?${query}` : "/api/warehouse/inventory";
}

async function hydrateExitSlipOrder(slip: ExitSlip): Promise<ExitSlip> {
  if (slip.order || !slip.orderId) return slip;

  try {
    const order = await getOrder(slip.orderId);
    return { ...slip, order };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[EXIT_SLIP_ORDER_LOAD_FAILED]", {
        exitSlipObjectId: slip.objectId,
        orderId: slip.orderId,
        error,
      });
    }
    return slip;
  }
}
