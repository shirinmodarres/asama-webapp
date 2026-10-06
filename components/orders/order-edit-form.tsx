"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, PackageSearch, Trash2 } from "lucide-react";
import { FieldError } from "@/components/shared/field-error";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Customer, CustomerAddress } from "@/lib/models/customer.model";
import type { Order, OrderItem } from "@/lib/models/order.model";
import type { Product } from "@/lib/models/product.model";
import { listOrderProductsByPriceList } from "@/lib/services/product.service";
import { listActiveSalesTypes } from "@/lib/services/sales-type.service";
import {
  formatDeliveryAddress,
  getReceiverName,
} from "@/lib/utils/address-format";
import {
  formatFaDigits,
  normalizeDigits,
  normalizePhone,
  toNumber,
  formatFaCurrency,
} from "@/lib/utils/number-format";

export interface OrderEditFormSubmitPayload {
  customerName?: string;
  customerObjectId?: string;
  customerAddressObjectId?: string;
  customerAddressId?: number | string;
  selectedCustomerAddressId?: number | string;
  customerAddressTitle?: string | null;
  customerAddressText?: string | null;
  customerAddressZipCode?: string | null;
  customerAddressCityRef?: number | null;
  customerAddressPathRef?: number | null;
  customerAddressIsMain?: boolean;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientNationalId?: string;
  recipientMobile?: string;
  najaOrderNumber?: string;
  najaPurchaseDate?: string | null;
  notes?: string;
  items: Array<{
    productObjectId: string;
    quantity: number;
    unitPrice?: number;
    priceNoteItemId?: number | null;
    priceListId?: string | null;
    priceListItemId?: string | null;
    pricingSource?: string | null;
  }>;
  salesTypeObjectId?: string;
  salesTypeTitle?: string;
  salesTypeInternalCode?: number | null;
  salesTypeSepidarCode?: number | null;
  priceListId?: string;
}

interface OrderEditFormProps {
  order: Order;
  submitLabel: string;
  isSubmitting?: boolean;
  roleScope?: "manager" | "expert" | "full";
  initialProducts?: Product[];
  initialCustomers?: Customer[];
  lockCustomer?: boolean;
  onSubmit: (payload: OrderEditFormSubmitPayload) => Promise<void>;
  header?: React.ReactNode;
}

interface EditDraftItem {
  rowId: string;
  productObjectId: string;
  quantity: number;
}

interface SalesTypeOption {
  objectId: string;
  title: string;
  internalCode: number | null;
  sepidarCode: number | null;
}

interface PriceListOption {
  objectId: string;
  title: string;
  brandName: string | null;
}

export function OrderEditForm({
  order,
  submitLabel,
  isSubmitting = false,
  roleScope = "full",
  initialProducts = [],
  initialCustomers = [],
  lockCustomer = false,
  onSubmit,
  header,
}: OrderEditFormProps) {
  const [customers] = useState<Customer[]>(() =>
    mergeCustomers(initialCustomers, order),
  );
  const [products, setProducts] = useState<Product[]>(() =>
    mergeProducts(getSelectableProducts(initialProducts), order),
  );
  const [salesTypes, setSalesTypes] = useState<SalesTypeOption[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    order.customerObjectId || order.customer?.objectId || "",
  );
  const [selectedPriceListId, setSelectedPriceListId] = useState(
    order.priceListId || order.priceList?.objectId || "",
  );
  const [selectedSalesTypeId, setSelectedSalesTypeId] = useState(
    order.salesTypeObjectId || order.saleTypeObjectId || "",
  );
  const [selectedAddressId, setSelectedAddressId] = useState(
    getOrderCustomerAddressKey(order) || "",
  );
  const customerName = order.customerName || "";
  const [recipientFirstName, setRecipientFirstName] = useState(
    order.recipientFirstName || "",
  );
  const [recipientLastName, setRecipientLastName] = useState(
    order.recipientLastName || "",
  );
  const [recipientNationalId, setRecipientNationalId] = useState(
    order.recipientNationalId || "",
  );
  const [recipientMobile, setRecipientMobile] = useState(
    order.recipientMobile || "",
  );
  const [najaOrderNumber, setNajaOrderNumber] = useState(
    order.najaOrderNumber || order.externalOrderNumber || "",
  );
  const [najaPurchaseDate, setNajaPurchaseDate] = useState(
    order.najaPurchaseDate?.slice(0, 10) || "",
  );
  const [notes, setNotes] = useState(order.notes || "");
  const [items, setItems] = useState<EditDraftItem[]>(() =>
    mapOrderItems(order.items, products),
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<
    Record<string, { productObjectId?: string; quantity?: string }>
  >({});
  const resolvedOrderPriceListId =
    selectedPriceListId || order.priceListId || order.priceList?.objectId || "";

  const isExpertEdit = roleScope === "expert";
  // Backend owns permission. An expert who reached this form has an allowed
  // correction/draft state and must be able to correct the same fields as the
  // normal order form.
  const canEditCustomerFields = true;
  const canEditItemSelection = true;
  const canEditItemQuantity = true;
  const canEditRecipientFields = true;
  const canEditDescription = true;

  useEffect(() => {
    let mounted = true;

    async function loadSalesTypes() {
      try {
        const data = await listActiveSalesTypes();
        if (!mounted) return;

        const merged = new Map<string, SalesTypeOption>();
        data.forEach((item) => {
          merged.set(getSalesTypeKey(item.objectId), {
            objectId: item.objectId,
            title: item.title,
            internalCode: item.internalCode ?? null,
            sepidarCode: item.sepidarCode ?? null,
          });
        });

        const fallback = getOrderSalesTypeSnapshot(order);
        if (fallback && !merged.has(getSalesTypeKey(fallback.objectId))) {
          merged.set(getSalesTypeKey(fallback.objectId), fallback);
        }

        const nextSalesTypes = Array.from(merged.values());
        setSalesTypes(nextSalesTypes);
        setSelectedSalesTypeId((current) => {
          if (current) return current;
          const resolved = resolveOrderSalesTypeOption(order, nextSalesTypes);
          return resolved?.objectId || current;
        });
      } catch {
        if (!mounted) return;
        const fallback = getOrderSalesTypeSnapshot(order);
        const nextSalesTypes = fallback ? [fallback] : [];
        setSalesTypes(nextSalesTypes);
        setSelectedSalesTypeId((current) => {
          if (current) return current;
          const resolved = resolveOrderSalesTypeOption(order, nextSalesTypes);
          return resolved?.objectId || current;
        });
      }
    }

    loadSalesTypes();
    return () => {
      mounted = false;
    };
  }, [order]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      const seededProducts = mergeProducts(
        getSelectableProducts(initialProducts),
        order,
      );
      if (!resolvedOrderPriceListId) {
        if (mounted) setProducts(seededProducts);
        return;
      }

      try {
        const fetchedProducts = await listOrderProductsByPriceList(
          resolvedOrderPriceListId,
          {
            customerObjectId: selectedCustomerId || undefined,
            expertUserId: order.expertUserId || undefined,
          },
        );
        if (!mounted) return;
        if (process.env.NODE_ENV === "development") {
          console.info("[ORDER_EDIT_PRICE_LIST_PRODUCTS]", {
            orderId: order.objectId,
            priceListId: resolvedOrderPriceListId,
            fetchedCount: fetchedProducts.length,
            seededCount: seededProducts.length,
          });
        }
        setProducts(
          mergeProducts([...seededProducts, ...fetchedProducts], order),
        );
      } catch {
        if (!mounted) return;
        setProducts(seededProducts);
      }
    }

    loadProducts();
    return () => {
      mounted = false;
    };
  }, [
    initialProducts,
    order,
    order.expertUserId,
    resolvedOrderPriceListId,
    selectedCustomerId,
    selectedPriceListId,
  ]);

  const selectableProducts = useMemo(
    () => getSelectableProducts(products),
    [products],
  );

  const selectedCustomer =
    customers.find((customer) => customer.objectId === selectedCustomerId) ||
    order.customer ||
    null;

  const selectedAddresses = getResolvedSepidarAddresses(selectedCustomer);
  const resolvedAddressKey =
    selectedAddressId || getOrderCustomerAddressKey(order) || "";
  const selectedAddress =
    selectedAddresses.find(
      (address) => getCustomerAddressKey(address) === resolvedAddressKey,
    ) ||
    resolveMainCustomerAddress(selectedCustomer) ||
    (selectedAddresses.length ? selectedAddresses[0] : null);

  const resolvedSalesTypeKey =
    selectedSalesTypeId ||
    resolveOrderSalesTypeOption(order, salesTypes)?.objectId ||
    "";
  const selectedSalesType =
    salesTypes.find(
      (item) => getSalesTypeKey(item.objectId) === resolvedSalesTypeKey,
    ) ||
    resolveOrderSalesTypeOption(order, salesTypes) ||
    getOrderSalesTypeSnapshot(order);
  const selectedSalesTypeForSubmit =
    selectedSalesType ||
    resolveOrderSalesTypeOption(order, salesTypes) ||
    getOrderSalesTypeSnapshot(order);

  const priceListOptions = useMemo(
    () => getCustomerPriceListOptions(selectedCustomer, order),
    [order, selectedCustomer],
  );
  const resolvedPriceListKey =
    resolvedOrderPriceListId ||
    getOrderPriceListSnapshot(order)?.objectId ||
    "";
  const selectedPriceList =
    priceListOptions.find((item) => item.objectId === resolvedPriceListKey) ||
    null;

  const productMap = useMemo(
    () =>
      products.reduce<Record<string, Product>>((accumulator, product) => {
        accumulator[product.objectId] = product;
        return accumulator;
      }, {}),
    [products],
  );
  const selectableProductMap = useMemo(
    () =>
      selectableProducts.reduce<Record<string, Product>>(
        (accumulator, product) => {
          accumulator[product.objectId] = product;
          return accumulator;
        },
        {},
      ),
    [selectableProducts],
  );
  const originalQuantityByProductId = useMemo(
    () =>
      order.items.reduce<Map<string, number>>((accumulator, item) => {
        if (!item.productId) return accumulator;
        accumulator.set(item.productId, Number(item.quantity || 0));
        return accumulator;
      }, new Map<string, number>()),
    [order.items],
  );

  const totalItems = items.length;
  const totalQuantity = items.reduce(
    (sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0),
    0,
  );
  const totalAmount = items.reduce((sum, item) => {
    const product = productMap[item.productObjectId];
    return sum + item.quantity * (product?.unitPrice ?? 0);
  }, 0);
  const currentStockTitles = selectedCustomer
    ? getAllowedStockTitles(selectedCustomer)
    : order.stockTitle
      ? [order.stockTitle]
      : [];

  const canShowRecipientSection =
    order.orderType === "naja" ||
    Boolean(
      order.recipientFirstName ||
      order.recipientLastName ||
      order.recipientNationalId ||
      order.recipientMobile,
    );

  const updateRow = (rowId: string, patch: Partial<EditDraftItem>) => {
    setRowErrors((current) => ({
      ...current,
      [rowId]: {
        ...(current[rowId] || {}),
        ...(patch.productObjectId !== undefined ? { productObjectId: "" } : {}),
        ...(patch.quantity !== undefined ? { quantity: "" } : {}),
      },
    }));
    setItems((current) =>
      current.map((item) =>
        item.rowId === rowId ? { ...item, ...patch } : item,
      ),
    );
  };

  const addRow = () => {
    setItems((current) => [
      ...current,
      {
        rowId: `row-${Date.now()}-${current.length}`,
        productObjectId: "",
        quantity: 1,
      },
    ]);
  };

  const removeRow = (rowId: string) => {
    setItems((current) =>
      current.length > 1
        ? current.filter((item) => item.rowId !== rowId)
        : current,
    );
  };

  const handleSubmit = async () => {
    setError("");
    setFieldErrors({});
    setRowErrors({});

    if (!selectedCustomerId) {
      setFieldErrors({ selectedCustomerId: "لطفاً مشتری را انتخاب کنید." });
      return;
    }
    if (!selectedSalesType) {
      setFieldErrors({
        selectedSalesTypeId: "لطفاً روش پرداخت را انتخاب کنید.",
      });
      return;
    }
    if (!selectedPriceList) {
      setFieldErrors({
        selectedPriceListId: "لطفاً لیست قیمت را انتخاب کنید.",
      });
      return;
    }
    if (selectedAddresses.length > 0 && !selectedAddress) {
      setFieldErrors({ selectedAddressId: "لطفاً آدرس تحویل را انتخاب کنید." });
      return;
    }
    if (!items.length) {
      setError("حداقل یک آیتم معتبر به سفارش اضافه کنید.");
      return;
    }

    const nextRowErrors: Record<
      string,
      { productObjectId?: string; quantity?: string }
    > = {};
    for (const item of items) {
      const rowError: { productObjectId?: string; quantity?: string } = {};
      if (!item.productObjectId)
        rowError.productObjectId = "لطفاً کالا را انتخاب کنید.";
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        rowError.quantity = "تعداد باید بزرگ‌تر از صفر باشد.";
      }
      if (Object.keys(rowError).length > 0)
        nextRowErrors[item.rowId] = rowError;
    }
    if (Object.keys(nextRowErrors).length > 0) {
      setRowErrors(nextRowErrors);
      return;
    }

    const addressPayload = selectedAddress
      ? {
          customerAddressObjectId: selectedAddress.objectId || undefined,
          customerAddressId:
            getCustomerAddressNumericId(selectedAddress) ?? undefined,
          selectedCustomerAddressId:
            getCustomerAddressNumericId(selectedAddress) ?? undefined,
          customerAddressTitle: selectedAddress.title ?? null,
          customerAddressText: getCustomerAddressText(selectedAddress),
          customerAddressZipCode: getCustomerAddressZipCode(selectedAddress),
          customerAddressCityRef: getCustomerAddressCityRef(selectedAddress),
          customerAddressPathRef: selectedAddress.pathRef ?? null,
          customerAddressIsMain: Boolean(selectedAddress.isMain),
        }
      : {};

    const payload: OrderEditFormSubmitPayload = {
      customerObjectId: selectedCustomerId || undefined,
      customerName: selectedCustomer?.fullName || customerName || undefined,
      recipientFirstName: trimOrUndefined(recipientFirstName),
      recipientLastName: trimOrUndefined(recipientLastName),
      recipientNationalId:
        normalizeDigits(recipientNationalId.trim()) || undefined,
      recipientMobile: normalizePhone(recipientMobile.trim()) || undefined,
      najaOrderNumber:
        order.orderType === "naja"
          ? normalizeDigits(najaOrderNumber.trim()) || undefined
          : undefined,
      najaPurchaseDate:
        order.orderType === "naja" ? najaPurchaseDate || null : undefined,
      notes: trimOrUndefined(notes),
      salesTypeObjectId: selectedSalesTypeForSubmit?.objectId || undefined,
      salesTypeTitle: selectedSalesTypeForSubmit?.title || undefined,
      salesTypeInternalCode:
        selectedSalesTypeForSubmit?.internalCode ?? undefined,
      salesTypeSepidarCode:
        selectedSalesTypeForSubmit?.sepidarCode ?? undefined,
      priceListId: selectedPriceList?.objectId || undefined,
      ...addressPayload,
      items: items.map((item) => {
        const product = productMap[item.productObjectId];
        return {
          productObjectId: item.productObjectId,
          quantity: item.quantity,
          unitPrice: product?.unitPrice,
          priceNoteItemId: product?.priceNoteItemId ?? null,
          priceListId:
            product?.priceListId ?? selectedPriceList?.objectId ?? null,
          priceListItemId: product?.priceListItemId ?? null,
          pricingSource: product?.pricingSource ?? null,
        };
      }),
    };

    console.info("[ORDER_EDIT_UPDATE_PAYLOAD]", {
      orderId: order.objectId,
      roleScope,
      payload,
    });

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
      throw submitError;
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-5">
        {header}

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>{order.orderType === "naja" ? "مرکز ناجا" : "مشتری"}</span>
            <SearchableSelect
              value={selectedCustomerId || undefined}
              onValueChange={(value) => {
                setSelectedCustomerId(value);
                setFieldErrors((current) => ({
                  ...current,
                  selectedCustomerId: "",
                }));
              }}
              options={customers.map((customer) => ({
                value: customer.objectId,
                label: [
                  customer.sepidarCustomerCode || customer.id,
                  customer.fullName,
                ]
                  .filter(Boolean)
                  .join(" - "),
              }))}
              placeholder={
                order.orderType === "naja" ? "انتخاب مرکز ناجا" : "انتخاب مشتری"
              }
              searchPlaceholder="جستجو بر اساس نام"
              emptyMessage="موردی یافت نشد"
              disabled={lockCustomer || !canEditCustomerFields}
              invalid={Boolean(fieldErrors.selectedCustomerId)}
            />
            <FieldError message={fieldErrors.selectedCustomerId} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>روش پرداخت</span>
            <SearchableSelect
              value={resolvedSalesTypeKey || undefined}
              onValueChange={(value) => {
                setSelectedSalesTypeId(value);
                setFieldErrors((current) => ({
                  ...current,
                  selectedSalesTypeId: "",
                }));
              }}
              options={salesTypes.map((salesType) => ({
                value: getSalesTypeKey(salesType.objectId),
                label: salesType.title,
                searchText: [
                  salesType.title,
                  salesType.internalCode,
                  salesType.sepidarCode,
                ]
                  .filter(Boolean)
                  .join(" "),
              }))}
              placeholder="انتخاب روش پرداخت"
              searchPlaceholder="جستجو در روش پرداخت"
              emptyMessage="روش پرداختی یافت نشد"
              disabled={!canEditCustomerFields}
              invalid={Boolean(fieldErrors.selectedSalesTypeId)}
            />
            <FieldError message={fieldErrors.selectedSalesTypeId} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>لیست قیمت</span>
            <SearchableSelect
              value={resolvedPriceListKey || undefined}
              onValueChange={(value) => {
                setSelectedPriceListId(value);
                setFieldErrors((current) => ({
                  ...current,
                  selectedPriceListId: "",
                }));
              }}
              options={priceListOptions.map((priceList) => ({
                value: priceList.objectId,
                label: priceList.title,
                searchText: [priceList.title, priceList.brandName]
                  .filter(Boolean)
                  .join(" "),
              }))}
              placeholder="انتخاب لیست قیمت"
              searchPlaceholder="جستجو در لیست قیمت‌ها"
              emptyMessage="لیست قیمتی یافت نشد"
              disabled={!canEditCustomerFields}
              invalid={Boolean(fieldErrors.selectedPriceListId)}
            />
            <FieldError message={fieldErrors.selectedPriceListId} />
          </label>
        </div>

        {selectedCustomer ? (
          <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-4 text-sm leading-7 text-[#334155]">
            <div className="grid gap-2 sm:grid-cols-2">
              <span>
                {order.orderType === "naja" ? "نام مرکز: " : "نام مشتری: "}
                {selectedCustomer.fullName || "-"}
              </span>
              <span>
                {order.orderType === "naja"
                  ? "کد مرکز در سپیدار: "
                  : "کد مشتری: "}
                {selectedCustomer.sepidarCustomerCode ||
                  selectedCustomer.id ||
                  "-"}
              </span>
              {currentStockTitles.length ? (
                <span className="sm:col-span-2">
                  انبارهای مجاز: {currentStockTitles.join("، ")}
                </span>
              ) : null}
              {selectedAddress ? (
                <span className="sm:col-span-2">
                  آدرس تحویل: {getCustomerAddressText(selectedAddress) || "-"}
                </span>
              ) : null}
            </div>

            {selectedAddresses.length > 1 ? (
              <div className="mt-4 grid gap-2 text-sm font-medium text-[#334155]">
                <span>آدرس تحویل</span>
                <SearchableSelect
                  value={resolvedAddressKey || undefined}
                  onValueChange={(value) => {
                    setSelectedAddressId(value);
                    setFieldErrors((current) => ({
                      ...current,
                      selectedAddressId: "",
                    }));
                  }}
                  options={selectedAddresses.map((address) => ({
                    value: getCustomerAddressKey(address),
                    label: formatCustomerAddressLabel(address),
                    description: formatCustomerAddressDescription(address),
                  }))}
                  placeholder="انتخاب آدرس"
                  searchPlaceholder="جستجو در آدرس‌ها"
                  emptyMessage="آدرسی یافت نشد"
                  disabled={!canEditCustomerFields}
                  invalid={Boolean(fieldErrors.selectedAddressId)}
                />
                <FieldError message={fieldErrors.selectedAddressId} />
              </div>
            ) : null}

            {selectedAddress && order.orderType !== "naja" ? (
              <div className="mt-2 space-y-1 text-[#6B7280]">
                <p>
                  گیرنده بار:{" "}
                  {getReceiverName(selectedAddress, selectedCustomer) || "-"}
                </p>
                <p>
                  آدرس کامل:{" "}
                  {getCustomerAddressText(selectedAddress) ||
                    formatDeliveryAddress(selectedAddress)}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {canShowRecipientSection ? (
          <div className="mt-5 rounded-xl border border-[#E7EDF3] bg-[#FBFCFD] p-4">
            <h3 className="text-base font-semibold text-[#102034]">
              اطلاعات تحویل‌گیرنده
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>نام</span>
                <Input
                  value={recipientFirstName}
                  onChange={(event) =>
                    setRecipientFirstName(event.target.value)
                  }
                  readOnly={!canEditRecipientFields}
                  disabled={!canEditRecipientFields}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>نام خانوادگی</span>
                <Input
                  value={recipientLastName}
                  onChange={(event) => setRecipientLastName(event.target.value)}
                  readOnly={!canEditRecipientFields}
                  disabled={!canEditRecipientFields}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کد ملی</span>
                <Input
                  value={recipientNationalId}
                  onChange={(event) =>
                    setRecipientNationalId(event.target.value)
                  }
                  readOnly={!canEditRecipientFields}
                  disabled={!canEditRecipientFields}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>موبایل تحویل‌گیرنده</span>
                <Input
                  value={recipientMobile}
                  onChange={(event) => setRecipientMobile(event.target.value)}
                  readOnly={!canEditRecipientFields}
                  disabled={!canEditRecipientFields}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
                <span>شماره سفارش ناجا</span>
                <Input
                  value={najaOrderNumber}
                  onChange={(event) => setNajaOrderNumber(event.target.value)}
                  readOnly={!canEditRecipientFields}
                  disabled={!canEditRecipientFields}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
                <span>تاریخ سفارش</span>
                <Input
                  value={najaPurchaseDate}
                  onChange={(event) => setNajaPurchaseDate(event.target.value)}
                  readOnly={!canEditRecipientFields}
                  disabled={!canEditRecipientFields}
                  placeholder="YYYY/MM/DD"
                />
              </label>
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[#102034]">
                آیتم‌های سفارش
              </h3>
              <p className="mt-1 text-sm leading-7 text-[#6B7280]">
                {isExpertEdit
                  ? "کالاها و تعدادهای سفارش را بررسی و در صورت نیاز اصلاح کنید."
                  : "کالاها را بازبینی کنید، در صورت نیاز آیتم اضافه کنید و تغییر دهید."}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {items.map((item, index) => {
              const product = productMap[item.productObjectId];
              const inventoryProduct =
                selectableProductMap[item.productObjectId] ?? product ?? null;

              const originalQuantity =
                originalQuantityByProductId.get(item.productObjectId) ??
                item.quantity;

              const editableAvailableQuantity = inventoryProduct
                ? Math.max(
                    0,
                    (inventoryProduct.availableForSale ??
                      inventoryProduct.availableSalesQuantity ??
                      0) + originalQuantity,
                  )
                : 0;

              return (
                <div
                  key={item.rowId}
                  className="rounded-2xl border border-[#E7EDF3] bg-white p-4"
                >
                  {/* کالا + حذف ردیف */}
                  <div className="flex items-end gap-2">
                    <label className="grid min-w-0 flex-1 gap-2 text-sm font-medium text-[#334155]">
                      <span>کالا</span>

                      <SearchableSelect
                        value={item.productObjectId || undefined}
                        onValueChange={(value) =>
                          updateRow(item.rowId, {
                            productObjectId: value,
                          })
                        }
                        options={selectableProducts.map((productOption) => ({
                          value: productOption.objectId,
                          label: productIdentityLabel(productOption),
                          searchText: [
                            productOption.sepidarCode,
                            productOption.name,
                            productOption.brandName || productOption.brand,
                          ]
                            .filter(Boolean)
                            .join(" "),
                        }))}
                        placeholder="انتخاب کالا"
                        searchPlaceholder="جستجو در کالاها"
                        emptyMessage="کالایی یافت نشد"
                        disabled={!canEditItemSelection}
                        invalid={Boolean(
                          rowErrors[item.rowId]?.productObjectId,
                        )}
                      />

                      <FieldError
                        message={rowErrors[item.rowId]?.productObjectId}
                      />
                    </label>

                    {canEditItemSelection ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-[#9B1C1C] hover:bg-[#FCEFEF] hover:text-[#7F1D1D]"
                        onClick={() => removeRow(item.rowId)}
                        aria-label="حذف کالا"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>

                  {/* اطلاعات کالا */}
                  {product ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-[#EEF2F6] bg-[#FBFCFD] px-3 py-2.5">
                        <p className="text-xs text-[#6B7280]">قیمت واحد</p>

                        <p className="mt-1 font-semibold text-[#102034]">
                          {formatFaCurrency(product.unitPrice)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#EEF2F6] bg-[#FBFCFD] px-3 py-2.5">
                        <p className="text-xs text-[#6B7280]">موجودی فروش</p>

                        <p className="mt-1 font-semibold text-[#102034]">
                          {formatFaDigits(editableAvailableQuantity)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#EEF2F6] bg-[#FBFCFD] px-3 py-2.5">
                        <p className="text-xs text-[#6B7280]">مبلغ ردیف</p>

                        <p className="mt-1 font-semibold text-[#102034]">
                          {formatFaCurrency(
                            item.quantity * (product.unitPrice ?? 0),
                          )}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* تعداد */}
                  <div className="mt-4">
                    <label className="grid max-w-[180px] gap-2 text-sm font-medium text-[#334155]">
                      <span>تعداد</span>

                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9۰-۹٠-٩]*"
                        max={editableAvailableQuantity}
                        value={item.quantity}
                        onChange={(event) =>
                          updateRow(item.rowId, {
                            quantity: toNumber(
                              normalizeDigits(event.target.value),
                            ),
                          })
                        }
                        disabled={!canEditItemQuantity}
                        readOnly={!canEditItemQuantity}
                        aria-invalid={Boolean(rowErrors[item.rowId]?.quantity)}
                      />

                      <FieldError message={rowErrors[item.rowId]?.quantity} />
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
                    <span>ردیف {formatFaDigits(index + 1)}</span>

                    <span>
                      {isExpertEdit
                        ? "فقط تعداد هر ردیف قابل ویرایش است."
                        : "این ردیف با داده‌های فعلی سفارش همگام شده است."}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {canEditItemSelection ? (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={addRow}
                className="gap-2"
              >
                <PackageSearch className="size-4" />
                افزودن آیتم
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>توضیحات داخلی سفارش</span>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              readOnly={!canEditDescription}
              disabled={!canEditDescription}
              rows={5}
              placeholder="توضیحات داخلی سفارش"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="size-4" />
            بازگشت
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "در حال ذخیره..." : submitLabel}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <OrderSummaryCard
          customerName={selectedCustomer?.fullName || customerName || null}
          itemCount={totalItems}
          totalQuantity={totalQuantity}
          totalAmount={totalAmount}
          status={order.orderStatus}
          warehouseStatus={order.warehouseStatus}
          saleTypeTitle={
            selectedSalesType?.title || order.salesTypeTitle || null
          }
          priceListTitle={
            selectedPriceList?.title || order.priceListTitle || null
          }
          stockTitles={currentStockTitles}
        />
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8EEF4] bg-[#FBFCFD] px-3.5 py-3">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="font-semibold text-[#102034]">{value}</dd>
    </div>
  );
}

function getOrderSalesTypeSnapshot(order: Order): SalesTypeOption | null {
  const legacySaleTypeCode =
    (order as Order & { saleTypeCode?: number | null }).saleTypeCode ?? null;
  const objectId =
    order.salesTypeObjectId ||
    order.saleTypeObjectId ||
    order.salesType?.objectId ||
    "";
  const title = order.salesTypeTitle || order.salesType?.title || "";
  const internalCode =
    order.salesTypeInternalCode ?? order.salesType?.internalCode ?? null;
  const sepidarCode =
    order.salesTypeSepidarCode ??
    order.sepidarSaleTypeId ??
    legacySaleTypeCode ??
    order.salesType?.sepidarCode ??
    null;

  if (!objectId && !title && internalCode === null && sepidarCode === null) {
    return null;
  }

  return {
    objectId: objectId || "",
    title: title || "-",
    internalCode,
    sepidarCode,
  };
}

function resolveOrderSalesTypeOption(
  order: Order,
  salesTypes: SalesTypeOption[],
): SalesTypeOption | null {
  if (!salesTypes.length) return getOrderSalesTypeSnapshot(order);

  const legacySaleTypeCode =
    (order as Order & { saleTypeCode?: number | null }).saleTypeCode ?? null;
  const snapshot = getOrderSalesTypeSnapshot(order);
  const matched =
    (order.salesTypeObjectId
      ? salesTypes.find((item) => item.objectId === order.salesTypeObjectId)
      : null) ||
    (order.saleTypeObjectId
      ? salesTypes.find((item) => item.objectId === order.saleTypeObjectId)
      : null) ||
    (order.salesTypeSepidarCode !== null &&
    order.salesTypeSepidarCode !== undefined
      ? salesTypes.find(
          (item) => item.sepidarCode === order.salesTypeSepidarCode,
        )
      : null) ||
    (order.sepidarSaleTypeId !== null && order.sepidarSaleTypeId !== undefined
      ? salesTypes.find((item) => item.sepidarCode === order.sepidarSaleTypeId)
      : null) ||
    (legacySaleTypeCode !== null && legacySaleTypeCode !== undefined
      ? salesTypes.find((item) => item.sepidarCode === legacySaleTypeCode)
      : null) ||
    (order.salesTypeInternalCode !== null &&
    order.salesTypeInternalCode !== undefined
      ? salesTypes.find(
          (item) => item.internalCode === order.salesTypeInternalCode,
        )
      : null) ||
    (order.salesTypeTitle
      ? salesTypes.find((item) => item.title === order.salesTypeTitle)
      : null);

  return matched || snapshot;
}

function getOrderPriceListSnapshot(order: Order): PriceListOption | null {
  const objectId = order.priceListId || order.priceList?.objectId || "";
  const title =
    order.priceListTitle ||
    order.priceList?.title ||
    order.priceList?.name ||
    "";
  const brandName = order.priceListBrand || order.priceList?.brandName || null;

  if (!objectId && !title && !brandName) return null;

  return {
    objectId: objectId || title,
    title: title || "-",
    brandName,
  };
}

function getCustomerPriceListOptions(
  customer: Customer | null,
  order: Order,
): PriceListOption[] {
  const items = customer?.priceLists?.length
    ? customer.priceLists.map((priceList) => ({
        objectId: priceList.objectId,
        title: priceList.title || priceList.name || priceList.objectId || "-",
        brandName: priceList.brandName ?? null,
      }))
    : [];
  const fallback = getOrderPriceListSnapshot(order);
  if (fallback && !items.some((item) => item.objectId === fallback.objectId)) {
    items.push(fallback);
  }
  return items;
}

function getResolvedSepidarAddresses(
  customer: Customer | null,
): CustomerAddress[] {
  if (!customer) return [];
  const addresses = customer.sepidarAddresses?.length
    ? customer.sepidarAddresses
    : customer.sepidarAddress
      ? [customer.sepidarAddress]
      : customer.addresses?.length
        ? customer.addresses
        : customer.defaultAddress
          ? [customer.defaultAddress]
          : [];
  return dedupeCustomerAddresses(addresses);
}

function resolveMainCustomerAddress(
  customer: Customer | null,
): CustomerAddress | null {
  if (!customer) return null;
  const addresses = getResolvedSepidarAddresses(customer);
  return (
    addresses.find((address) => Boolean(address.isMain)) ||
    customer.sepidarAddress ||
    customer.defaultAddress ||
    addresses[0] ||
    null
  );
}

function dedupeCustomerAddresses(
  addresses: CustomerAddress[],
): CustomerAddress[] {
  const seen = new Set<string>();
  return addresses.filter((address) => {
    const key = getCustomerAddressKey(address);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCustomerAddressKey(address: CustomerAddress): string {
  return String(
    address.customerAddressId ??
      address.sepidarAddressId ??
      address.objectId ??
      address.id ??
      "",
  ).trim();
}

function getCustomerAddressNumericId(
  address: CustomerAddress | null,
): number | null {
  if (!address) return null;
  const raw = address.customerAddressId ?? address.sepidarAddressId;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCustomerAddressText(
  address: CustomerAddress | null,
): string | null {
  if (!address) return null;
  return (
    address.Address ||
    address.address ||
    address.fullAddress ||
    address.title ||
    null
  );
}

function getCustomerAddressZipCode(
  address: CustomerAddress | null,
): string | null {
  if (!address) return null;
  return address.ZipCode || address.zipCode || address.postalCode || null;
}

function getCustomerAddressCityRef(
  address: CustomerAddress | null,
): number | null {
  if (!address) return null;
  const value = address.cityRef;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function formatCustomerAddressLabel(address: CustomerAddress): string {
  const parts = [
    address.title,
    getCustomerAddressText(address),
    getCustomerAddressZipCode(address),
  ]
    .filter(Boolean)
    .map((value) => String(value));
  return parts.join(" - ") || address.objectId || "-";
}

function formatCustomerAddressDescription(address: CustomerAddress): string {
  const parts = [
    address.isMain ? "آدرس اصلی" : "",
    address.cityRef ? `شهر: ${formatFaDigits(address.cityRef)}` : "",
    address.pathRef ? `مسیر: ${formatFaDigits(address.pathRef)}` : "",
  ].filter(Boolean);
  return parts.join(" • ");
}

function getAllowedStockTitles(customer: Customer): string[] {
  return customer.allowedStockTitles?.length
    ? customer.allowedStockTitles
    : customer.allowedStocks?.length
      ? customer.allowedStocks.map((stock) => stock.title).filter(Boolean)
      : [];
}

function productIdentityLabel(product: Product): string {
  const parts = [
    product.sepidarCode,
    product.name,
    product.brandName || product.brand,
  ]
    .filter(Boolean)
    .map((value) => String(value));
  return parts.join(" - ");
}

function trimOrUndefined(value: string): string | undefined {
  const text = value.trim();
  return text ? text : undefined;
}

function mergeCustomers(
  initialCustomers: Customer[],
  order: Order,
): Customer[] {
  const list = [...initialCustomers];
  if (
    order.customer &&
    !list.some((customer) => customer.objectId === order.customer?.objectId)
  ) {
    list.push(order.customer);
  }
  return list;
}

function getSelectableProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (!product.objectId) return false;
    if (product.inventorySource === "order_snapshot") return false;
    if (seen.has(product.objectId)) return false;
    seen.add(product.objectId);
    return true;
  });
}

function mergeProducts(initialProducts: Product[], order: Order): Product[] {
  const list = [...initialProducts];
  const productMap = new Map(
    list.map((product) => [product.objectId, product]),
  );
  order.items.forEach((item) => {
    if (productMap.has(item.productId)) return;
    const fallback = createProductFromOrderItem(item);
    if (!fallback) return;
    productMap.set(fallback.objectId, fallback);
  });
  return Array.from(productMap.values());
}

function createProductFromOrderItem(item: OrderItem): Product | null {
  if (!item.productId) return null;
  return {
    objectId: item.productId,
    productObjectId: item.productId,
    id: item.productSku || item.productId,
    sku: item.productSku || item.productId,
    barcode: null,
    sepidarItemId: item.sepidarItemId,
    sepidarCode: item.productSku || null,
    name: item.productName || item.productSku || item.productId,
    brand: item.brand || item.brandName || "",
    brandName: item.brandName || item.brand || null,
    saleGroupRef: null,
    model: null,
    category: "",
    unit: "عدد",
    unitPrice: item.unitPrice,
    priceNoteItemId: null,
    priceListId: item.priceListId ?? null,
    priceListItemId: item.priceListItemId ?? null,
    priceListTitle: null,
    pricingSource: item.pricingSource ?? null,
    priceListConflict: false,
    priceListConflicts: [],
    description: null,
    isSyncedFromSepidar: true,
    isActive: true,
    isSellable: true,
    status: "active",
    statusLabel: "فعال",
    totalStock: 0,
    salesStock: 0,
    warehouseStock: 0,
    reservedStock: 0,
    availableStock: 0,
    availableForSale: 0,
    availableSalesQuantity: 0,
    salesCapacity: 0,
    hasAvailableSalesQuantity: false,
    inventorySource: "order_snapshot",
    availableStocks: [],
    warehouseAvailableStock: 0,
    najaInventoryQty: 0,
    inventories: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mapOrderItems(
  items: OrderItem[],
  products: Product[],
): EditDraftItem[] {
  const productMap = new Map(
    products.map((product) => [product.objectId, product]),
  );
  return items.map((item, index) => {
    if (!productMap.has(item.productId)) {
      const fallback = createProductFromOrderItem(item);
      if (fallback) productMap.set(fallback.objectId, fallback);
    }
    return {
      rowId: item.objectId || `row-${index}`,
      productObjectId: item.productId,
      quantity: item.quantity,
    };
  });
}

function getOrderCustomerAddressKey(order: Order): string {
  return String(
    order.selectedCustomerAddressId ??
      order.customerAddressId ??
      order.customerAddressObjectId ??
      "",
  ).trim();
}

function getSalesTypeKey(objectId: string): string {
  return String(objectId || "").trim();
}
