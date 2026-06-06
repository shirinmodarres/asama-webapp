"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  initialExitSlips,
  initialInvoices,
  initialInventoryHistory,
  initialOrders,
  initialProducts,
  initialWarehouseHistory,
} from "@/lib/expert/mock-data";
import type {
  CompleteNajaWarehouseInput,
  CreateExitSlipInput,
  CreateInvoiceInput,
  CreateNajaOrderInput,
  CreateOrderInput,
  CreateProductInput,
  ExitSlip,
  ExpertOrder,
  Invoice,
  InventoryHistoryEntry,
  OrderItem,
  Product,
  ReturnNajaOrderInput,
  UpdateInventoryInput,
  UpdateOrderInput,
  UpdateProductInput,
  WarehouseHistoryEntry,
} from "@/lib/expert/types";
import { getAvailableStock, mergeOrderItems } from "@/lib/expert/utils";

interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  order?: ExpertOrder;
  slip?: ExitSlip;
  invoice?: Invoice;
  product?: Product;
}

interface ExpertStoreValue {
  products: Product[];
  orders: ExpertOrder[];
  exitSlips: ExitSlip[];
  invoices: Invoice[];
  warehouseHistory: WarehouseHistoryEntry[];
  inventoryHistory: InventoryHistoryEntry[];
  createOrder: (input: CreateOrderInput) => ActionResult;
  createNajaOrder: (input: CreateNajaOrderInput) => ActionResult;
  updateOrder: (input: UpdateOrderInput) => ActionResult;
  supportEditOrder: (input: UpdateOrderInput) => ActionResult;
  approveOrder: (id: string) => ActionResult;
  cancelOrder: (id: string) => ActionResult;
  createExitSlip: (input: CreateExitSlipInput) => ActionResult;
  completeNajaWarehouseDetails: (input: CompleteNajaWarehouseInput) => ActionResult;
  returnNajaOrder: (input: ReturnNajaOrderInput) => ActionResult;
  confirmExitSlipDelivery: (slipId: string) => ActionResult;
  createInvoice: (input: CreateInvoiceInput) => ActionResult;
  createProduct: (input: CreateProductInput) => ActionResult;
  updateProduct: (input: UpdateProductInput) => ActionResult;
  updateInventory: (input: UpdateInventoryInput) => ActionResult;
  getOrderById: (id: string) => ExpertOrder | undefined;
  getProductById: (id: string) => Product | undefined;
  getExitSlipById: (id: string) => ExitSlip | undefined;
  getExitSlipByOrderId: (orderId: string) => ExitSlip | undefined;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoiceByOrderId: (orderId: string) => Invoice | undefined;
}

const ExpertStoreContext = createContext<ExpertStoreValue | null>(null);

function validateOrderItems(items: OrderItem[]): string | null {
  if (items.length === 0) return "حداقل یک آیتم به سفارش اضافه کنید.";
  if (items.some((item) => item.quantity <= 0)) return "تعداد هر آیتم باید بیشتر از صفر باشد.";
  return null;
}

function buildNextOrderCode(orders: ExpertOrder[]): string {
  const maxCode = orders.reduce((max, order) => {
    const numeric = Number(order.code.replace("EX-", ""));
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 9000);

  return `EX-${maxCode + 1}`;
}

function shouldAffectReservedStock(order: ExpertOrder): boolean {
  if (order.orderSource === "naja") return false;
  return order.warehouseStatus === "reserved" || order.warehouseStatus === "reviewing";
}

function buildNextInvoiceNumber(invoices: Invoice[]): string {
  const maxNumber = invoices.reduce((max, invoice) => {
    const numeric = Number(invoice.invoiceNumber.replace("INV-", ""));
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 1000);

  return `INV-${maxNumber + 1}`;
}

export function ExpertStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<ExpertOrder[]>(initialOrders);
  const [exitSlips, setExitSlips] = useState<ExitSlip[]>(initialExitSlips);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [warehouseHistory, setWarehouseHistory] = useState<WarehouseHistoryEntry[]>(initialWarehouseHistory);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistoryEntry[]>(initialInventoryHistory);

  const getOrderById = (id: string) => orders.find((order) => order.id === id);
  const getProductById = (id: string) => products.find((product) => product.id === id);
  const getExitSlipById = (id: string) => exitSlips.find((slip) => slip.id === id);
  const getExitSlipByOrderId = (orderId: string) => exitSlips.find((slip) => slip.orderId === orderId);
  const getInvoiceById = (id: string) => invoices.find((invoice) => invoice.id === id);
  const getInvoiceByOrderId = (orderId: string) => invoices.find((invoice) => invoice.orderId === orderId);

  const addWarehouseHistory = (entry: Omit<WarehouseHistoryEntry, "id">) => {
    setWarehouseHistory((current) => [{ id: `wh-${Date.now()}`, ...entry }, ...current]);
  };

  const addInventoryHistory = (entry: Omit<InventoryHistoryEntry, "id">) => {
    setInventoryHistory((current) => [{ id: `ih-${Date.now()}`, ...entry }, ...current]);
  };

  const createOrder = ({ customerName, items }: CreateOrderInput): ActionResult => {
    const mergedItems = mergeOrderItems(items);
    const baseValidation = validateOrderItems(mergedItems);

    if (baseValidation) return { ok: false, error: baseValidation };
    if (!customerName.trim()) return { ok: false, error: "نام مشتری را وارد کنید." };

    for (const item of mergedItems) {
      const product = getProductById(item.productId);
      if (!product) return { ok: false, error: "کالای انتخاب شده معتبر نیست." };

      const availableStock = getAvailableStock(product);
      if (item.quantity > availableStock) {
        return { ok: false, error: `موجودی قابل استفاده برای «${product.name}» کافی نیست.` };
      }
    }

    const timestamp = new Date().toISOString();

    const newOrder: ExpertOrder = {
      id: `o-${Date.now()}`,
      code: buildNextOrderCode(orders),
      orderSource: "normal",
      createdBy: "علی رضایی",
      customerName: customerName.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "pending_approval",
      warehouseStatus: "reserved",
      items: mergedItems,
    };

    setProducts((current) =>
      current.map((product) => {
        const matchedItem = mergedItems.find((item) => item.productId === product.id);
        if (!matchedItem) return product;

        return {
          ...product,
          reservedStock: product.reservedStock + matchedItem.quantity,
        };
      }),
    );

    setOrders((current) => [newOrder, ...current]);

    return { ok: true, order: newOrder };
  };

  const createNajaOrder = ({
    productId,
    quantity,
    customerName,
    nationalId,
    phoneNumber,
    najaExpertName,
  }: CreateNajaOrderInput): ActionResult => {
    if (!customerName.trim() || !nationalId.trim() || !phoneNumber.trim() || !najaExpertName.trim()) {
      return { ok: false, error: "اطلاعات سفارش ناجا کامل نیست." };
    }

    const product = getProductById(productId);
    if (!product) return { ok: false, error: "کالای انتخاب شده معتبر نیست." };
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, error: "تعداد سفارش باید بیشتر از صفر باشد." };
    }
    if (quantity > product.najaInventoryQty) {
      return { ok: false, error: `موجودی ناجا برای «${product.name}» کافی نیست.` };
    }

    const timestamp = new Date().toISOString();
    const maxCode = orders.reduce((max, order) => {
      const numeric = Number(order.code.replace("NJ-", ""));
      return Number.isNaN(numeric) ? max : Math.max(max, numeric);
    }, 9100);

    const newOrder: ExpertOrder = {
      id: `o-${Date.now()}`,
      code: `NJ-${maxCode + 1}`,
      orderSource: "naja",
      createdBy: najaExpertName.trim(),
      najaExpertName: najaExpertName.trim(),
      customerName: customerName.trim(),
      nationalId: nationalId.trim(),
      phoneNumber: phoneNumber.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "approved",
      warehouseStatus: "awaitingNajaDetails",
      items: [{ productId, quantity }],
    };

    setProducts((current) =>
      current.map((entry) =>
        entry.id === productId
          ? { ...entry, najaInventoryQty: Math.max(entry.najaInventoryQty - quantity, 0) }
          : entry,
      ),
    );
    setOrders((current) => [newOrder, ...current]);
    addInventoryHistory({
      productId,
      inventoryScope: "naja",
      changeType: "decrease",
      amount: quantity,
      note: `کسر از موجودی ناجا بابت سفارش ${newOrder.code}`,
      createdAt: timestamp,
      createdBy: najaExpertName.trim(),
    });
    addWarehouseHistory({
      orderId: newOrder.id,
      status: "awaitingNajaDetails",
      changedAt: timestamp,
      changedBy: najaExpertName.trim(),
      note: "سفارش ناجا ثبت شد و به صف تکمیل اطلاعات انبار رفت.",
    });

    return {
      ok: true,
      order: newOrder,
      message: "سفارش ناجا ثبت شد و موجودی اختصاصی ناجا کسر گردید.",
    };
  };

  const updateOrderItemsWithStockCheck = (targetOrder: ExpertOrder, nextItems: OrderItem[]): ActionResult => {
    const mergedItems = mergeOrderItems(nextItems);
    const baseValidation = validateOrderItems(mergedItems);
    if (baseValidation) return { ok: false, error: baseValidation };

    const previousQuantityByProduct = new Map<string, number>();
    targetOrder.items.forEach((item) => {
      previousQuantityByProduct.set(item.productId, item.quantity);
    });

    for (const item of mergedItems) {
      const product = getProductById(item.productId);
      if (!product) return { ok: false, error: "کالای انتخاب شده معتبر نیست." };

      const previousQuantity = previousQuantityByProduct.get(item.productId) ?? 0;
      const maxEditableQuantity = getAvailableStock(product) + previousQuantity;

      if (item.quantity > maxEditableQuantity) {
        return {
          ok: false,
          error: `موجودی قابل ویرایش برای «${product.name}» کافی نیست.`,
        };
      }
    }

    if (shouldAffectReservedStock(targetOrder)) {
      setProducts((current) => {
        return current.map((product) => {
          const oldQty = previousQuantityByProduct.get(product.id) ?? 0;
          const newQty = mergedItems.find((item) => item.productId === product.id)?.quantity ?? 0;
          const diff = newQty - oldQty;

          if (diff === 0) return product;

          return {
            ...product,
            reservedStock: Math.max(product.reservedStock + diff, 0),
          };
        });
      });
    }

    const updatedOrder: ExpertOrder = {
      ...targetOrder,
      items: mergedItems,
      updatedAt: new Date().toISOString(),
      warehouseStatus: shouldAffectReservedStock(targetOrder) ? "reserved" : targetOrder.warehouseStatus,
    };

    setOrders((current) => current.map((order) => (order.id === targetOrder.id ? updatedOrder : order)));

    return { ok: true, order: updatedOrder };
  };

  const updateOrder = ({ id, customerName, items }: UpdateOrderInput): ActionResult => {
    const targetOrder = getOrderById(id);
    if (!targetOrder) return { ok: false, error: "سفارش مورد نظر یافت نشد." };
    if (targetOrder.status !== "pending_approval") return { ok: false, error: "فقط سفارش در انتظار تایید قابل ویرایش است." };
    if (!customerName.trim()) return { ok: false, error: "نام مشتری را وارد کنید." };

    const result = updateOrderItemsWithStockCheck(targetOrder, items);
    if (!result.ok || !result.order) return result;

    const updatedOrder = {
      ...result.order,
      customerName: customerName.trim(),
    };

    setOrders((current) => current.map((order) => (order.id === targetOrder.id ? updatedOrder : order)));
    return { ...result, order: updatedOrder };
  };

  const supportEditOrder = ({ id, customerName, items }: UpdateOrderInput): ActionResult => {
    const targetOrder = getOrderById(id);
    if (!targetOrder) return { ok: false, error: "سفارش مورد نظر یافت نشد." };
    if (!customerName.trim()) return { ok: false, error: "نام مشتری را وارد کنید." };

    const result = updateOrderItemsWithStockCheck(targetOrder, items);
    if (!result.ok || !result.order) return result;

    const updatedOrder = {
      ...result.order,
      customerName: customerName.trim(),
    };

    setOrders((current) => current.map((order) => (order.id === targetOrder.id ? updatedOrder : order)));

    return {
      ok: true,
      order: updatedOrder,
      message: "ویرایش ویژه پشتیبانی با موفقیت ثبت شد.",
    };
  };

  const approveOrder = (id: string): ActionResult => {
    const targetOrder = getOrderById(id);

    if (!targetOrder) return { ok: false, error: "سفارش مورد نظر یافت نشد." };
    if (targetOrder.status !== "pending_approval") return { ok: false, error: "این سفارش دیگر در انتظار تایید نیست." };

    const approvedOrder: ExpertOrder = {
      ...targetOrder,
      status: "approved",
      warehouseStatus: "reviewing",
      updatedAt: new Date().toISOString(),
    };

    setOrders((current) => current.map((order) => (order.id === id ? approvedOrder : order)));
    addWarehouseHistory({
      orderId: id,
      status: "reviewing",
      changedAt: approvedOrder.updatedAt,
      changedBy: "محمد کاظمی",
      note: "سفارش تایید و به بررسی انبار ارسال شد.",
    });

    return {
      ok: true,
      order: approvedOrder,
      message: "سفارش با موفقیت تایید شد و به بررسی انبار ارسال گردید.",
    };
  };

  const cancelOrder = (id: string): ActionResult => {
    const targetOrder = getOrderById(id);

    if (!targetOrder) return { ok: false, error: "سفارش مورد نظر یافت نشد." };
    if (targetOrder.status !== "pending_approval") return { ok: false, error: "این سفارش دیگر در انتظار تایید نیست." };

    const quantityByProduct = new Map<string, number>();
    targetOrder.items.forEach((item) => {
      quantityByProduct.set(item.productId, item.quantity);
    });

    setProducts((current) =>
      current.map((product) => {
        const quantity = quantityByProduct.get(product.id) ?? 0;
        if (quantity === 0) return product;

        return {
          ...product,
          reservedStock: Math.max(product.reservedStock - quantity, 0),
        };
      }),
    );

    const cancelledOrder: ExpertOrder = {
      ...targetOrder,
      status: "cancelled",
      warehouseStatus: "returned",
      updatedAt: new Date().toISOString(),
    };

    setOrders((current) => current.map((order) => (order.id === id ? cancelledOrder : order)));
    addWarehouseHistory({
      orderId: id,
      status: "returned",
      changedAt: cancelledOrder.updatedAt,
      changedBy: "محمد کاظمی",
      note: "سفارش لغو شد و رزرو موجودی آزاد شد.",
    });

    return {
      ok: true,
      order: cancelledOrder,
      message: "سفارش لغو شد و رزرو موجودی به انبار بازگشت.",
    };
  };

  const createExitSlip = ({ orderId, slipNumber, exitDate, createdBy, notes }: CreateExitSlipInput): ActionResult => {
    const targetOrder = getOrderById(orderId);

    if (!targetOrder) return { ok: false, error: "سفارش مرتبط یافت نشد." };
    if (targetOrder.status !== "approved" || targetOrder.warehouseStatus !== "reviewing") {
      return { ok: false, error: "صدور حواله فقط برای سفارش تاییدشده در بررسی انبار مجاز است." };
    }

    const existingSlip = getExitSlipByOrderId(orderId);
    if (existingSlip) return { ok: false, error: "برای این سفارش قبلا حواله خروج صادر شده است." };

    const timestamp = new Date().toISOString();

    const newSlip: ExitSlip = {
      id: `es-${Date.now()}`,
      slipNumber,
      orderId,
      createdBy,
      exitDate,
      notes,
      createdAt: timestamp,
    };

    const updatedOrder: ExpertOrder = {
      ...targetOrder,
      warehouseStatus: "dispatchIssued",
      updatedAt: timestamp,
    };

    setExitSlips((current) => [newSlip, ...current]);
    setOrders((current) => current.map((order) => (order.id === orderId ? updatedOrder : order)));
    addWarehouseHistory({
      orderId,
      status: "dispatchIssued",
      changedAt: timestamp,
      changedBy: createdBy,
      note: "حواله خروج صادر و خروج فیزیکی کالا ثبت شد.",
    });

    return {
      ok: true,
      slip: newSlip,
      order: updatedOrder,
      message: "حواله خروج صادر شد و سفارش وارد مرحله خروج فیزیکی شد.",
    };
  };

  const completeNajaWarehouseDetails = ({
    orderId,
    productIdentifier,
    trackingCode,
    createdBy,
  }: CompleteNajaWarehouseInput): ActionResult => {
    const targetOrder = getOrderById(orderId);
    if (!targetOrder) return { ok: false, error: "سفارش مورد نظر یافت نشد." };
    if (targetOrder.orderSource !== "naja") return { ok: false, error: "این عملیات فقط برای سفارش ناجا مجاز است." };
    if (targetOrder.warehouseStatus !== "awaitingNajaDetails") {
      return { ok: false, error: "اطلاعات انبار این سفارش قبلا تکمیل شده است." };
    }
    if (!productIdentifier.trim() || !trackingCode.trim()) {
      return { ok: false, error: "شناسه کالا و کد رهگیری را وارد کنید." };
    }

    const timestamp = new Date().toISOString();
    const updatedOrder: ExpertOrder = {
      ...targetOrder,
      productIdentifier: productIdentifier.trim(),
      trackingCode: trackingCode.trim(),
      warehouseStatus: "najaDetailsCompleted",
      updatedAt: timestamp,
    };

    setOrders((current) => current.map((order) => (order.id === orderId ? updatedOrder : order)));
    addWarehouseHistory({
      orderId,
      status: "najaDetailsCompleted",
      changedAt: timestamp,
      changedBy: createdBy,
      note: "اطلاعات انبار سفارش ناجا تکمیل شد.",
    });

    return {
      ok: true,
      order: updatedOrder,
      message: "شناسه کالا و کد رهگیری برای سفارش ناجا ثبت شد.",
    };
  };

  const returnNajaOrder = ({
    orderId,
    reason,
    createdBy,
  }: ReturnNajaOrderInput): ActionResult => {
    const targetOrder = getOrderById(orderId);
    if (!targetOrder) return { ok: false, error: "سفارش مورد نظر یافت نشد." };
    if (targetOrder.orderSource !== "naja") {
      return { ok: false, error: "بازگردانی فقط برای سفارش های ناجا فعال است." };
    }
    if (!reason.trim()) {
      return { ok: false, error: "دلیل برگشت را وارد کنید." };
    }
    if (targetOrder.status === "returned" || targetOrder.status === "returnedAfterInvoice") {
      return { ok: false, error: "این سفارش قبلا بازگردانی شده است." };
    }

    const timestamp = new Date().toISOString();
    let nextStatus: ExpertOrder["status"] = "returned";
    let nextWarehouseStatus: ExpertOrder["warehouseStatus"] = "returnedToInventory";
    let warehouseNote = `سفارش ناجا پیش از تکمیل اطلاعات انبار بازگردانی شد. دلیل: ${reason.trim()}`;
    let successMessage = "سفارش ناجا بازگردانی شد و موجودی اختصاصی اصلاح گردید.";

    if (targetOrder.status === "approved" && targetOrder.warehouseStatus === "awaitingNajaDetails") {
      nextStatus = "returned";
      nextWarehouseStatus = "returnedToInventory";
    } else if (targetOrder.status === "approved" && targetOrder.warehouseStatus === "najaDetailsCompleted") {
      nextStatus = "returned";
      nextWarehouseStatus = "returnedFromWarehouse";
      warehouseNote = `سفارش ناجا پس از تکمیل اطلاعات انبار بازگردانی شد. دلیل: ${reason.trim()}`;
    } else if (targetOrder.status === "invoiced") {
      nextStatus = "returnedAfterInvoice";
      nextWarehouseStatus = "returnedFromWarehouse";
      warehouseNote = `سفارش ناجا پس از صدور فاکتور بازگردانی شد. دلیل: ${reason.trim()}`;
      successMessage = "سفارش ناجا پس از صدور فاکتور بازگردانی شد و نیازمند پیگیری مالی است.";
    } else {
      return { ok: false, error: "بازگردانی در وضعیت فعلی این سفارش ممکن نیست." };
    }

    const updatedOrder: ExpertOrder = {
      ...targetOrder,
      status: nextStatus,
      warehouseStatus: nextWarehouseStatus,
      returnReason: reason.trim(),
      returnedAt: timestamp,
      returnedBy: createdBy,
      updatedAt: timestamp,
    };

    setProducts((current) =>
      current.map((product) => {
        const matchedItem = targetOrder.items.find((item) => item.productId === product.id);
        return matchedItem
          ? { ...product, najaInventoryQty: product.najaInventoryQty + matchedItem.quantity }
          : product;
      }),
    );
    setOrders((current) => current.map((order) => (order.id === orderId ? updatedOrder : order)));

    targetOrder.items.forEach((item) => {
      addInventoryHistory({
        productId: item.productId,
        inventoryScope: "naja",
        changeType: "increase",
        amount: item.quantity,
        note: `بازگشت موجودی ناجا بابت سفارش ${targetOrder.code}`,
        createdAt: timestamp,
        createdBy,
      });
    });

    addWarehouseHistory({
      orderId,
      status: nextWarehouseStatus,
      changedAt: timestamp,
      changedBy: createdBy,
      note: warehouseNote,
    });

    return {
      ok: true,
      order: updatedOrder,
      message: successMessage,
    };
  };

  const confirmExitSlipDelivery = (slipId: string): ActionResult => {
    const targetSlip = getExitSlipById(slipId);
    if (!targetSlip) return { ok: false, error: "حواله خروج یافت نشد." };

    const targetOrder = getOrderById(targetSlip.orderId);
    if (!targetOrder) return { ok: false, error: "سفارش مرتبط با حواله یافت نشد." };
    if (targetOrder.warehouseStatus !== "dispatchIssued") {
      return { ok: false, error: "این سفارش هنوز در مرحله حواله خروج صادرشده نیست." };
    }

    const timestamp = new Date().toISOString();

    const updatedSlip: ExitSlip = {
      ...targetSlip,
      deliveredAt: timestamp,
    };

    const updatedOrder: ExpertOrder = {
      ...targetOrder,
      warehouseStatus: "delivered",
      updatedAt: timestamp,
    };

    setExitSlips((current) => current.map((slip) => (slip.id === slipId ? updatedSlip : slip)));
    setOrders((current) => current.map((order) => (order.id === targetOrder.id ? updatedOrder : order)));
    addWarehouseHistory({
      orderId: targetOrder.id,
      status: "delivered",
      changedAt: timestamp,
      changedBy: "رضا احمدی",
      note: "تحویل سفارش به مشتری تایید شد.",
    });

    return {
      ok: true,
      slip: updatedSlip,
      order: updatedOrder,
      message: "تحویل سفارش به مشتری تایید شد.",
    };
  };

  const createInvoice = ({ orderId, createdBy }: CreateInvoiceInput): ActionResult => {
    const targetOrder = getOrderById(orderId);
    if (!targetOrder) return { ok: false, error: "سفارش مورد نظر یافت نشد." };
    if (targetOrder.orderSource === "naja") {
      if (targetOrder.status !== "approved" || targetOrder.warehouseStatus !== "najaDetailsCompleted") {
        return { ok: false, error: "صدور فاکتور ناجا فقط پس از تکمیل اطلاعات انبار ممکن است." };
      }

      const existingInvoice = getInvoiceByOrderId(orderId);
      if (existingInvoice) return { ok: false, error: "برای این سفارش قبلا فاکتور صادر شده است." };
      if (!targetOrder.nationalId || !targetOrder.phoneNumber || !targetOrder.productIdentifier || !targetOrder.trackingCode) {
        return { ok: false, error: "اطلاعات ضمیمه سفارش ناجا کامل نیست." };
      }

      const timestamp = new Date().toISOString();
      const product = getProductById(targetOrder.items[0]?.productId ?? "");
      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: buildNextInvoiceNumber(invoices),
        orderId,
        createdBy,
        issuedAt: timestamp,
        status: "issued",
        invoiceName: "ناجا",
        items: targetOrder.items,
        attachmentRecords: [
          {
            customerName: targetOrder.customerName,
            nationalId: targetOrder.nationalId,
            phoneNumber: targetOrder.phoneNumber,
            productName: product?.name ?? "کالای نامشخص",
            productIdentifier: targetOrder.productIdentifier,
            trackingCode: targetOrder.trackingCode,
          },
        ],
      };

      const updatedOrder: ExpertOrder = {
        ...targetOrder,
        status: "invoiced",
        updatedAt: timestamp,
      };

      setInvoices((current) => [newInvoice, ...current]);
      setOrders((current) => current.map((order) => (order.id === orderId ? updatedOrder : order)));
      addWarehouseHistory({
        orderId,
        status: targetOrder.warehouseStatus,
        changedAt: timestamp,
        changedBy: createdBy,
        note: `فاکتور ناجا ${newInvoice.invoiceNumber} صادر شد.`,
      });

      return {
        ok: true,
        order: updatedOrder,
        invoice: newInvoice,
        message: "فاکتور سفارش ناجا با موفقیت صادر شد.",
      };
    }

    if (targetOrder.status !== "approved" || targetOrder.warehouseStatus !== "delivered") {
      return { ok: false, error: "فقط سفارش تاییدشده با تحویل تاییدشده قابل صدور فاکتور است." };
    }

    const existingInvoice = getInvoiceByOrderId(orderId);
    if (existingInvoice) return { ok: false, error: "برای این سفارش قبلا فاکتور صادر شده است." };

    const relatedSlip = getExitSlipByOrderId(orderId);
    if (!relatedSlip) return { ok: false, error: "حواله خروج مرتبط با این سفارش یافت نشد." };

    const timestamp = new Date().toISOString();

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: buildNextInvoiceNumber(invoices),
      orderId,
      exitSlipId: relatedSlip.id,
      createdBy,
      issuedAt: timestamp,
      status: "issued",
      items: targetOrder.items,
    };

    const updatedOrder: ExpertOrder = {
      ...targetOrder,
      status: "invoiced",
      updatedAt: timestamp,
    };

    setInvoices((current) => [newInvoice, ...current]);
    setOrders((current) => current.map((order) => (order.id === orderId ? updatedOrder : order)));
    addWarehouseHistory({
      orderId,
      status: targetOrder.warehouseStatus,
      changedAt: timestamp,
      changedBy: createdBy,
      note: `فاکتور ${newInvoice.invoiceNumber} صادر و سفارش نهایی شد.`,
    });

    return {
      ok: true,
      order: updatedOrder,
      invoice: newInvoice,
      message: "فاکتور با موفقیت صادر شد.",
    };
  };

  const createProduct = ({ name, brand, category, unit, unitPrice, initialStock, description }: CreateProductInput): ActionResult => {
    if (!name.trim() || !brand.trim() || !category.trim() || !unit.trim()) {
      return { ok: false, error: "اطلاعات اصلی کالا کامل نیست." };
    }

    if (initialStock < 0) {
      return { ok: false, error: "موجودی اولیه نمی تواند منفی باشد." };
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return { ok: false, error: "قیمت واحد باید بیشتر از صفر باشد." };
    }

    const product: Product = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      unit: unit.trim(),
      unitPrice,
      description: description?.trim(),
      status: "active",
      totalStock: initialStock,
      reservedStock: 0,
      najaInventoryQty: 0,
    };

    setProducts((current) => [product, ...current]);
    addInventoryHistory({
      productId: product.id,
      inventoryScope: "normal",
      changeType: "increase",
      amount: initialStock,
      note: "ثبت اولیه کالا توسط پشتیبانی",
      createdAt: new Date().toISOString(),
      createdBy: "سارا کریمی",
    });

    return { ok: true, product, message: "کالای جدید با موفقیت ثبت شد." };
  };

  const updateProduct = ({ id, name, brand, category, unit, unitPrice, description, status }: UpdateProductInput): ActionResult => {
    const existing = getProductById(id);
    if (!existing) return { ok: false, error: "کالای مورد نظر یافت نشد." };
    if (!name.trim() || !brand.trim() || !category.trim() || !unit.trim()) {
      return { ok: false, error: "اطلاعات اصلی کالا کامل نیست." };
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return { ok: false, error: "قیمت واحد باید بیشتر از صفر باشد." };
    }

    const updated: Product = {
      ...existing,
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      unit: unit.trim(),
      unitPrice,
      description: description?.trim(),
      status,
    };

    setProducts((current) => current.map((product) => (product.id === id ? updated : product)));
    return { ok: true, product: updated, message: "اطلاعات کالا به روز شد." };
  };

  const updateInventory = ({ productId, inventoryScope = "normal", changeType, amount, note, createdBy }: UpdateInventoryInput): ActionResult => {
    const targetProduct = getProductById(productId);
    if (!targetProduct) return { ok: false, error: "کالای مورد نظر یافت نشد." };
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "مقدار تغییر باید بیشتر از صفر باشد." };

    if (
      inventoryScope === "normal" &&
      changeType === "decrease" &&
      targetProduct.totalStock - amount < targetProduct.reservedStock
    ) {
      return { ok: false, error: "با این کاهش، موجودی کل کمتر از موجودی رزروشده می شود." };
    }
    if (
      inventoryScope === "naja" &&
      changeType === "decrease" &&
      targetProduct.najaInventoryQty - amount < 0
    ) {
      return { ok: false, error: "موجودی ناجا برای این کاهش کافی نیست." };
    }

    const updated: Product = {
      ...targetProduct,
      totalStock:
        inventoryScope === "normal"
          ? changeType === "increase"
            ? targetProduct.totalStock + amount
            : targetProduct.totalStock - amount
          : targetProduct.totalStock,
      najaInventoryQty:
        inventoryScope === "naja"
          ? changeType === "increase"
            ? targetProduct.najaInventoryQty + amount
            : targetProduct.najaInventoryQty - amount
          : targetProduct.najaInventoryQty,
    };

    setProducts((current) => current.map((product) => (product.id === productId ? updated : product)));
    addInventoryHistory({
      productId,
      inventoryScope,
      changeType,
      amount,
      note: note.trim() || "ثبت تغییر موجودی",
      createdAt: new Date().toISOString(),
      createdBy,
    });

    return {
      ok: true,
      product: updated,
      message:
        inventoryScope === "naja"
          ? "موجودی ناجا با موفقیت به روز شد."
          : "موجودی کالا با موفقیت به روز شد.",
    };
  };

  const value = {
    products,
    orders,
    exitSlips,
    invoices,
    warehouseHistory,
    inventoryHistory,
    createOrder,
    createNajaOrder,
    updateOrder,
    supportEditOrder,
    approveOrder,
    cancelOrder,
    createExitSlip,
    completeNajaWarehouseDetails,
    returnNajaOrder,
    confirmExitSlipDelivery,
    createInvoice,
    createProduct,
    updateProduct,
    updateInventory,
    getOrderById,
    getProductById,
    getExitSlipById,
    getExitSlipByOrderId,
    getInvoiceById,
    getInvoiceByOrderId,
  };

  return <ExpertStoreContext.Provider value={value}>{children}</ExpertStoreContext.Provider>;
}

export function useExpertStore(): ExpertStoreValue {
  const context = useContext(ExpertStoreContext);

  if (!context) {
    throw new Error("useExpertStore must be used within ExpertStoreProvider");
  }

  return context;
}
