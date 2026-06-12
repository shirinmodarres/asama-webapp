import {
  toArray,
  toBooleanValue,
  toNullableString,
  toNumberValue,
  toRecord,
  toStringValue,
} from "@/lib/mappers/mapper-utils";
import { mapOrderDto } from "@/lib/mappers/order.mapper";
import type {
  ExitSlip,
  ExitSlipItemGroup,
  ExitSlipItemUnit,
  ExitSlipPdfData,
  ProductWarehouseInventory,
  WarehouseInboundReceipt,
  WarehouseItemUnit,
  WarehouseUnitStatus,
} from "@/lib/models/warehouse.model";
import { normalizeDigits, normalizePhone } from "@/lib/utils/number-format";

const UNIT_STATUS_LABELS: Record<WarehouseUnitStatus, string> = {
  in_stock: "موجود در انبار",
  reserved_for_order: "رزرو شده برای سفارش",
  dispatched: "خارج شده از انبار",
  delivered: "تحویل شده",
  returned: "برگشتی",
};

export function mapProductWarehouseInventoryDto(
  dto: unknown,
): ProductWarehouseInventory {
  const record = toRecord(dto);
  const warehouse = toRecord(record.warehouse);
  const stock = toNumberValue(record.stock ?? record.warehouseStock);
  const reservedStock = toNumberValue(record.reservedStock);
  return {
    warehouseId: toStringValue(
      record.warehouseId ?? record.warehouseObjectId ?? warehouse.objectId,
    ),
    warehouseName: toStringValue(record.warehouseName ?? warehouse.name),
    warehouseType: toStringValue(record.warehouseType ?? warehouse.type) || "general",
    stock,
    reservedStock,
    availableStock:
      record.availableStock === undefined
        ? stock - reservedStock
        : toNumberValue(record.availableStock),
  };
}

export function mapProductWarehouseInventoryListDto(
  dto: unknown,
): ProductWarehouseInventory[] {
  return toArray(dto).map(mapProductWarehouseInventoryDto);
}

export function mapWarehouseItemUnitDto(dto: unknown): WarehouseItemUnit {
  const wrapper = toRecord(dto);
  const nestedUnit = toRecord(wrapper.unit);
  const record = Object.keys(nestedUnit).length ? nestedUnit : wrapper;
  const productRecord = toRecord(record.product ?? wrapper.product);
  const status = toStringValue(record.status) || "in_stock";

  return {
    objectId: toStringValue(record.objectId ?? record.unitObjectId),
    id:
      toStringValue(record.id) ||
      toStringValue(record.objectId ?? record.unitObjectId),
    productObjectId: toStringValue(
      record.productObjectId ?? productRecord.objectId ?? wrapper.productObjectId,
    ),
    productSku: normalizeDigits(
      toStringValue(record.productSku ?? productRecord.sku ?? wrapper.productSku),
    ),
    productName: toStringValue(
      record.productName ?? productRecord.name ?? wrapper.productName,
    ),
    productBrand: toStringValue(
      record.productBrand ??
        record.brand ??
        productRecord.brand ??
        wrapper.productBrand,
    ),
    productModel: toNullableString(
      record.productModel ??
        record.model ??
        productRecord.model ??
        wrapper.productModel,
    ),
    productIdentifier: normalizeDigits(toStringValue(record.productIdentifier)),
    serialNumber: normalizeDigits(toStringValue(record.serialNumber)),
    trackingCode: normalizeDigits(toStringValue(record.trackingCode)),
    quantity: toNumberValue(record.quantity) || 1,
    status,
    statusLabel:
      UNIT_STATUS_LABELS[status as WarehouseUnitStatus] ||
      toStringValue(record.statusLabel) ||
      status,
    inboundReceiptId: toNullableString(record.inboundReceiptId),
    exitSlipId: toNullableString(record.exitSlipId),
    orderId: toNullableString(record.orderId),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapWarehouseItemUnitListDto(dto: unknown): WarehouseItemUnit[] {
  return toArray(dto).map(mapWarehouseItemUnitDto);
}

export function mapExitSlipItemGroupDto(dto: unknown): ExitSlipItemGroup {
  const record = toRecord(dto);
  const productRecord = toRecord(record.product);
  const rawUnits = toArray(record.units);
  const units = rawUnits.map(mapExitSlipItemUnitDto);
  const firstUnit = rawUnits.length ? mapWarehouseItemUnitDto(rawUnits[0]) : null;

  return {
    productObjectId: toStringValue(
      record.productObjectId ?? productRecord.objectId ?? firstUnit?.productObjectId,
    ),
    productSku: normalizeDigits(
      toStringValue(record.productSku ?? productRecord.sku ?? firstUnit?.productSku),
    ),
    productName: toStringValue(
      record.productName ?? productRecord.name ?? firstUnit?.productName,
    ),
    productBrand: toStringValue(
      record.productBrand ?? record.brand ?? productRecord.brand ?? firstUnit?.productBrand,
    ),
    productModel: toNullableString(
      record.productModel ?? record.model ?? productRecord.model ?? firstUnit?.productModel,
    ),
    quantity: toNumberValue(record.quantity) || units.length,
    units,
  };
}

export function mapExitSlipItemGroupListDto(dto: unknown): ExitSlipItemGroup[] {
  return toArray(dto).map(mapExitSlipItemGroupDto);
}

function mapExitSlipItemUnitDto(dto: unknown): ExitSlipItemUnit {
  const unit = mapWarehouseItemUnitDto(dto);
  return {
    unitObjectId: unit.objectId,
    productIdentifier: unit.productIdentifier,
    serialNumber: unit.serialNumber,
    trackingCode: unit.trackingCode,
    status: unit.status,
  };
}

function groupUnitsByProduct(units: WarehouseItemUnit[]): ExitSlipItemGroup[] {
  const groups = new Map<string, ExitSlipItemGroup>();

  for (const unit of units) {
    const key =
      unit.productObjectId ||
      (unit.productSku ? `sku:${unit.productSku}` : `unknown:${unit.productName}`);
    const existing = groups.get(key);
    const itemUnit: ExitSlipItemUnit = {
      unitObjectId: unit.objectId,
      productIdentifier: unit.productIdentifier,
      serialNumber: unit.serialNumber,
      trackingCode: unit.trackingCode,
      status: unit.status,
    };

    if (existing) {
      existing.units.push(itemUnit);
      existing.quantity = existing.units.length;
      continue;
    }

    groups.set(key, {
      productObjectId: unit.productObjectId,
      productSku: unit.productSku,
      productName: unit.productName,
      productBrand: unit.productBrand,
      productModel: unit.productModel,
      quantity: 1,
      units: [itemUnit],
    });
  }

  return Array.from(groups.values());
}

export function mapWarehouseInboundReceiptDto(
  dto: unknown,
): WarehouseInboundReceipt {
  const record = toRecord(dto);

  return {
    objectId: toStringValue(record.objectId),
    id: toStringValue(record.id) || toStringValue(record.objectId),
    receiptCode: normalizeDigits(toStringValue(record.receiptCode)),
    productObjectId: toStringValue(record.productObjectId),
    productSku: normalizeDigits(toStringValue(record.productSku)),
    productName: toStringValue(record.productName),
    quantity: toNumberValue(record.quantity),
    createdByName: toNullableString(record.createdByName),
    notes: toNullableString(record.notes),
    units: mapWarehouseItemUnitListDto(record.units),
    createdAt: toStringValue(record.createdAt),
    updatedAt: toStringValue(record.updatedAt),
  };
}

export function mapWarehouseInboundReceiptListDto(
  dto: unknown,
): WarehouseInboundReceipt[] {
  return toArray(dto).map(mapWarehouseInboundReceiptDto);
}

export function mapExitSlipDto(dto: unknown): ExitSlip {
  const record = toRecord(dto);
  const nestedSlip = toRecord(record.exitSlip);
  const internalInvoice = toRecord(
    record.internalInvoice ?? nestedSlip.internalInvoice,
  );
  const source = Object.keys(nestedSlip).length ? nestedSlip : record;
  const orderSource = source.order ?? record.order;
  const orderRecord = toRecord(orderSource);
  const order = Object.keys(orderRecord).length ? mapOrderDto(orderSource) : null;
  const deliveryAddress = toRecord(source.deliveryAddress);
  const fullAddress = toNullableString(
    source.deliveryFullAddress ??
      deliveryAddress.formatted ??
      deliveryAddress.fullAddress,
  );
  const groupedSourceItems = hasGroupedItems(source.items);
  const sourceUnits = toArray(source.units);
  const units = mapWarehouseItemUnitListDto(
    sourceUnits.length ? source.units : groupedSourceItems ? [] : source.items,
  );
  const items = groupedSourceItems
    ? mapExitSlipItemGroupListDto(source.items)
    : groupUnitsByProduct(units);

  return {
    objectId: toStringValue(source.objectId),
    id: toStringValue(source.id) || toStringValue(source.objectId),
    slipCode: normalizeDigits(
      toStringValue(source.slipCode) || toStringValue(source.slipNumber),
    ),
    orderId: toStringValue(source.orderId),
    orderCode: normalizeDigits(toStringValue(source.orderCode)),
    issuedByName: toStringValue(source.issuedByName),
    exitDate: toStringValue(source.exitDate),
    deliveryToken: toNullableString(source.deliveryToken),
    deliveryLink: toNullableString(source.deliveryLink),
    pdfUrl: toNullableString(source.pdfUrl),
    deliveryCode: source.deliveryCode
      ? normalizeDigits(toStringValue(source.deliveryCode))
      : null,
    deliveryConfirmed: toBooleanValue(source.deliveryConfirmed),
    deliveryConfirmedAt: toNullableString(source.deliveryConfirmedAt),
    deliveryConfirmedByPhone: source.deliveryConfirmedByPhone
      ? normalizePhone(toStringValue(source.deliveryConfirmedByPhone))
      : null,
    customerName: toNullableString(source.customerName),
    sepidarCustomerCode: toNullableString(
      source.sepidarCustomerCode ?? orderRecord.sepidarCustomerCode,
    ),
    customerMobile: normalizeNullablePhone(
      source.customerMobile ?? orderRecord.customerMobile,
    ),
    customerPhone: source.customerPhone
      ? normalizePhone(toStringValue(source.customerPhone))
      : normalizeNullablePhone(orderRecord.customerPhone),
    customerAddress: toNullableString(
      source.customerAddress ??
        source.customerAddressSnapshot ??
        orderRecord.customerAddress ??
        orderRecord.customerAddressSnapshot ??
        orderRecord.deliveryFullAddress,
    ),
    recipientFirstName: toNullableString(
      source.recipientFirstName ?? orderRecord.recipientFirstName,
    ),
    recipientLastName: toNullableString(
      source.recipientLastName ?? orderRecord.recipientLastName,
    ),
    recipientNationalId: normalizeNullableDigits(
      source.recipientNationalId ?? orderRecord.recipientNationalId,
    ),
    recipientMobile: normalizeNullablePhone(
      source.recipientMobile ?? orderRecord.recipientMobile,
    ),
    najaOrderNumber: normalizeNullableDigits(
      source.najaOrderNumber ??
        source.externalOrderNumber ??
        orderRecord.najaOrderNumber ??
        orderRecord.externalOrderNumber,
    ),
    receiverFullName: toNullableString(
      source.receiverFullName ?? source.receiverName,
    ),
    receiverPhone: source.receiverPhone
      ? normalizePhone(toStringValue(source.receiverPhone))
      : source.receiverPhoneMasked
        ? toStringValue(source.receiverPhoneMasked)
      : null,
    deliveryFullAddress: fullAddress,
    deliveryProvince: toNullableString(
      source.deliveryProvince ?? deliveryAddress.province,
    ),
    deliveryCity: toNullableString(source.deliveryCity ?? deliveryAddress.city),
    deliveryCounty: toNullableString(
      source.deliveryCounty ?? deliveryAddress.county,
    ),
    deliveryAddress: fullAddress,
    notes: toNullableString(source.notes),
    internalInvoiceObjectId: toNullableString(
      source.internalInvoiceObjectId ??
        record.internalInvoiceObjectId ??
        internalInvoice.objectId,
    ),
    internalInvoiceNumber: toNullableString(
      source.internalInvoiceNumber ??
        record.internalInvoiceNumber ??
        internalInvoice.invoiceNumber ??
        internalInvoice.invoiceCode,
    ),
    order,
    items: items.length ? items : groupUnitsByProduct(units),
    units,
    createdAt: toStringValue(source.createdAt),
    updatedAt: toStringValue(source.updatedAt),
  };
}

export function mapExitSlipListDto(dto: unknown): ExitSlip[] {
  return toArray(dto).map(mapExitSlipDto);
}

export function mapExitSlipPdfDataDto(dto: unknown): ExitSlipPdfData {
  const record = toRecord(dto);
  const customer = toRecord(record.customer);
  const recipient = toRecord(record.recipient);
  const orderRecord = toRecord(record.order);
  const order = Object.keys(orderRecord).length ? mapOrderDto(record.order) : null;
  const receiver = toRecord(record.receiver);
  const deliveryAddress = toRecord(record.deliveryAddress);

  const groupedSourceItems = hasGroupedItems(record.items);
  const sourceUnits = toArray(record.units);
  const units = mapWarehouseItemUnitListDto(
    sourceUnits.length ? record.units : groupedSourceItems ? [] : record.items,
  );
  const items = groupedSourceItems
    ? mapExitSlipItemGroupListDto(record.items)
    : groupUnitsByProduct(units);

  return {
    companyName: toStringValue(record.companyName) || "آساما",
    slipCode: normalizeDigits(toStringValue(record.slipCode)),
    orderCode: normalizeDigits(toStringValue(record.orderCode)),
    issueDate: toNullableString(record.issueDate),
    customer: {
      name: toNullableString(
        customer.name ?? record.customerName ?? orderRecord.customerName,
      ),
      sepidarCustomerCode: toNullableString(
        customer.sepidarCustomerCode ??
          record.sepidarCustomerCode ??
          orderRecord.sepidarCustomerCode,
      ),
      mobile: normalizeNullablePhone(
        customer.mobile ?? record.customerMobile ?? orderRecord.customerMobile,
      ),
      phone: normalizeNullablePhone(
        customer.phone ?? record.customerPhone ?? orderRecord.customerPhone,
      ),
      address: toNullableString(
        customer.address ??
          record.customerAddress ??
          orderRecord.customerAddress ??
          orderRecord.customerAddressSnapshot ??
          orderRecord.deliveryFullAddress,
      ),
    },
    recipient: {
      firstName: toNullableString(
        recipient.firstName ??
          record.recipientFirstName ??
          orderRecord.recipientFirstName,
      ),
      lastName: toNullableString(
        recipient.lastName ??
          record.recipientLastName ??
          orderRecord.recipientLastName,
      ),
      nationalId: normalizeNullableDigits(
        recipient.nationalId ??
          record.recipientNationalId ??
          orderRecord.recipientNationalId,
      ),
      mobile: normalizeNullablePhone(
        recipient.mobile ?? record.recipientMobile ?? orderRecord.recipientMobile,
      ),
      najaOrderNumber: normalizeNullableDigits(
        recipient.najaOrderNumber ??
          record.najaOrderNumber ??
          orderRecord.najaOrderNumber ??
          orderRecord.externalOrderNumber,
      ),
    },
    receiver: {
      fullName: toNullableString(receiver.fullName),
      phone: receiver.phone ? normalizePhone(toStringValue(receiver.phone)) : null,
    },
    deliveryAddress: {
      province: toNullableString(deliveryAddress.province),
      city: toNullableString(deliveryAddress.city),
      county: toNullableString(deliveryAddress.county),
      fullAddress: toNullableString(deliveryAddress.fullAddress),
      formatted: toNullableString(deliveryAddress.formatted),
    },
    items: items.length ? items : groupUnitsByProduct(units),
    units,
    deliveryCode: record.deliveryCode
      ? normalizeDigits(toStringValue(record.deliveryCode))
      : null,
    notes: toNullableString(record.notes),
    order,
  };
}

function hasGroupedItems(value: unknown): boolean {
  return toArray(value).some((item) => Array.isArray(toRecord(item).units));
}

function normalizeNullableDigits(value: unknown): string | null {
  const normalized = normalizeDigits(toStringValue(value));
  return normalized || null;
}

function normalizeNullablePhone(value: unknown): string | null {
  const normalized = normalizePhone(toStringValue(value));
  return normalized || null;
}
