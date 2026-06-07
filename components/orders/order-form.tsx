"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, PackageSearch, Trash2 } from "lucide-react";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import {
  formatCurrency,
  formatNumber,
  getOrderItemCount,
  getOrderLineTotal,
  getOrderTotalQuantity,
} from "@/lib/expert/utils";
import type { Customer, CustomerAddress } from "@/lib/models/customer.model";
import type { Order, OrderItem } from "@/lib/models/order.model";
import type { Product } from "@/lib/models/product.model";
import {
  listCustomerAddresses,
  listCustomers,
} from "@/lib/services/customer.service";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listAssignedCustomersForExpert } from "@/lib/services/expert-customer.service";
import {
  listOrderProductsBySaleType,
  listProducts,
} from "@/lib/services/product.service";
import {
  formatDeliveryAddress,
  getReceiverName,
} from "@/lib/utils/address-format";
import { formatFaDigits, toNumber } from "@/lib/utils/number-format";
import {
  POSITIVE_NUMBER_MESSAGE,
  SELECT_REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";

interface DraftItem {
  rowId: string;
  productId: string;
  quantity: number;
}

export interface OrderFormSubmitPayload {
  customerName?: string;
  customerObjectId?: string;
  customerAddressObjectId?: string;
  items: Array<{
    productObjectId: string;
    quantity: number;
    unitPrice?: number;
    priceNoteItemId?: number | null;
  }>;
  saleTypeObjectId?: string;
  sepidarSaleTypeId?: number;
}

interface OrderFormProps {
  mode: "create" | "edit";
  initialOrder?: Order | null;
  submitLabel: string;
  isSubmitting?: boolean;
  assignedCustomersOnly?: boolean;
  sepidarProductsOnly?: boolean;
  onSubmit: (payload: OrderFormSubmitPayload) => Promise<void>;
}

export function OrderForm({
  mode,
  initialOrder,
  submitLabel,
  isSubmitting = false,
  assignedCustomersOnly = false,
  sepidarProductsOnly = false,
  onSubmit,
}: OrderFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(!sepidarProductsOnly);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [customersError, setCustomersError] = useState("");
  const [items, setItems] = useState<DraftItem[]>(() =>
    initialOrder ? mapOrderItems(initialOrder.items, []) : [createEmptyRow(0)],
  );
  const [customerName, setCustomerName] = useState(
    initialOrder?.customerName ?? "",
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialOrder?.customerObjectId ?? "",
  );
  const [selectedAddressId, setSelectedAddressId] = useState(
    initialOrder?.customerAddressObjectId ?? "",
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<
    Record<string, { productId?: string; quantity?: string }>
  >({});

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setIsLoadingProducts(!sepidarProductsOnly);
      setIsLoadingCustomers(true);
      setError("");
      setProductsError("");
      setCustomersError("");

      const [productsResult, customersResult] = await Promise.allSettled([
        sepidarProductsOnly
          ? Promise.resolve<Product[]>([])
          : listProducts("expert"),
        assignedCustomersOnly
          ? listAssignedCustomersForExpert(getStoredCurrentUser()?.objectId)
          : listCustomers(),
      ]);

      if (!isMounted) return;

      if (productsResult.status === "fulfilled") {
        setProducts(productsResult.value);
        if (initialOrder && !sepidarProductsOnly) {
          setItems(mapOrderItems(initialOrder.items, productsResult.value));
        }
      } else {
        setProducts([]);
        setProductsError(
          sepidarProductsOnly
            ? "دریافت کالاهای سپیدار انجام نشد."
            : getErrorMessage(productsResult.reason),
        );
      }

      if (customersResult.status === "fulfilled") {
        setCustomers(customersResult.value);
      } else {
        setCustomers([]);
        setCustomersError(
          assignedCustomersOnly
            ? "دریافت مشتریان اختصاص‌یافته انجام نشد."
            : getErrorMessage(customersResult.reason),
        );
      }

      setIsLoadingProducts(false);
      setIsLoadingCustomers(false);
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [assignedCustomersOnly, initialOrder, sepidarProductsOnly]);

  useEffect(() => {
    let isMounted = true;

    async function loadProductsBySaleType() {
      if (!sepidarProductsOnly) return;

      const customer = customers.find(
        (entry) => entry.objectId === selectedCustomerId,
      );
      const saleTypeId = customer?.saleType?.sepidarSaleTypeId;

      setProducts([]);
      setProductsError("");
      if (!selectedCustomerId) {
        setIsLoadingProducts(false);
        return;
      }
      if (!saleTypeId) {
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);
      try {
        const data = await listOrderProductsBySaleType(saleTypeId);
        if (!isMounted) return;
        setProducts(data);
        if (initialOrder) {
          setItems(mapOrderItems(initialOrder.items, data));
        }
      } catch {
        if (!isMounted) return;
        setProducts([]);
        setProductsError("دریافت کالاهای قیمت‌گذاری‌شده انجام نشد.");
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }

    loadProductsBySaleType();

    return () => {
      isMounted = false;
    };
  }, [customers, initialOrder, selectedCustomerId, sepidarProductsOnly]);

  useEffect(() => {
    let isMounted = true;

    async function loadAddresses() {
      if (!selectedCustomerId) {
        setAddresses([]);
        setSelectedAddressId("");
        return;
      }

      const customer = customers.find(
        (entry) => entry.objectId === selectedCustomerId,
      );
      setCustomerName(customer?.fullName ?? "");
      setIsLoadingAddresses(true);
      setError("");

      try {
        const data = await listCustomerAddresses(selectedCustomerId);
        if (!isMounted) return;
        setAddresses(data);
        setSelectedAddressId((current) => {
          if (current && data.some((address) => address.objectId === current)) {
            return current;
          }
          const defaultAddress =
            data.find((address) => address.isDefault) ??
            customer?.defaultAddress ??
            data[0];
          return defaultAddress?.objectId ?? "";
        });
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoadingAddresses(false);
      }
    }

    loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [assignedCustomersOnly, customers, selectedCustomerId]);

  const normalizedItems = useMemo(
    () =>
      items
        .filter((item) => item.productId && item.quantity > 0)
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
    [items],
  );

  const totalItems = getOrderItemCount(normalizedItems);
  const totalQuantity = getOrderTotalQuantity(normalizedItems);
  const productsById = useMemo(
    () =>
      products.reduce<Record<string, Product>>((accumulator, product) => {
        accumulator[product.objectId] = product;
        return accumulator;
      }, {}),
    [products],
  );
  const totalAmount = normalizedItems.reduce((sum, item) => {
    const product = productsById[item.productId];
    return sum + item.quantity * (product?.unitPrice ?? 0);
  }, 0);
  const selectedCustomer = customers.find(
    (customer) => customer.objectId === selectedCustomerId,
  );
  const selectedAddress = addresses.find(
    (address) => address.objectId === selectedAddressId,
  );

  const addRow = () => {
    setItems((current) => [
      ...current,
      {
        rowId: `new-${Date.now()}-${current.length}`,
        productId: "",
        quantity: 1,
      },
    ]);
  };

  const removeRow = (rowId: string) => {
    setItems((current) => {
      if (current.length === 1) return current;
      return current.filter((item) => item.rowId !== rowId);
    });
  };

  const updateRow = (rowId: string, patch: Partial<DraftItem>) => {
    setRowErrors((current) => ({
      ...current,
      [rowId]: {
        ...current[rowId],
        ...(patch.productId !== undefined ? { productId: "" } : {}),
        ...(patch.quantity !== undefined ? { quantity: "" } : {}),
      },
    }));
    setItems((current) =>
      current.map((item) =>
        item.rowId === rowId ? { ...item, ...patch } : item,
      ),
    );
  };

  const handleSubmit = async () => {
    setError("");
    setFieldErrors({});
    setRowErrors({});

    if (assignedCustomersOnly && !selectedCustomerId) {
      setFieldErrors({ selectedCustomerId: "لطفاً مشتری را انتخاب کنید." });
      return;
    }

    if (sepidarProductsOnly && selectedCustomer && !selectedCustomer.saleType?.sepidarSaleTypeId) {
      setFieldErrors({
        selectedCustomerId: "برای این مشتری نوع فروش مشخص نشده است.",
      });
      return;
    }

    const nextRowErrors: Record<
      string,
      { productId?: string; quantity?: string }
    > = {};
    for (const item of items) {
      const errors: { productId?: string; quantity?: string } = {};
      if (!item.productId) {
        errors.productId = sepidarProductsOnly
          ? "لطفاً کالا را انتخاب کنید."
          : SELECT_REQUIRED_MESSAGE;
      } else if (
        sepidarProductsOnly &&
        (productsById[item.productId]?.unitPrice ?? 0) <= 0
      ) {
        errors.productId = "قیمت کالا برای این نوع فروش ثبت نشده است.";
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        errors.quantity = POSITIVE_NUMBER_MESSAGE;
      }
      if (Object.keys(errors).length > 0) {
        nextRowErrors[item.rowId] = errors;
      }
    }

    if (sepidarProductsOnly && normalizedItems.length === 0) {
      setError("حداقل یک کالا به سفارش اضافه کنید.");
    }

    if (Object.keys(nextRowErrors).length > 0) {
      setRowErrors(nextRowErrors);
      return;
    }

    if (normalizedItems.length === 0) {
      setError(
        assignedCustomersOnly
          ? "حداقل یک کالا به سفارش اضافه کنید."
          : "حداقل یک آیتم معتبر به سفارش اضافه کنید.",
      );
      return;
    }

    if (assignedCustomersOnly && !selectedCustomerId) {
      return;
    }

    if (!sepidarProductsOnly) {
      const requestedByProduct = new Map<string, number>();
      normalizedItems.forEach((item) => {
        requestedByProduct.set(
          item.productId,
          (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      });
      const insufficientProduct = Array.from(requestedByProduct.entries()).find(
        ([productId, quantity]) =>
          quantity > (productsById[productId]?.availableStock ?? 0),
      );
      if (insufficientProduct) {
        const product = productsById[insufficientProduct[0]];
        setError(`موجودی قابل فروش برای «${product?.name ?? "کالا"}» کافی نیست.`);
        return;
      }
    }

    if (selectedCustomerId && !selectedAddressId) {
      setFieldErrors({ selectedAddressId: "لطفاً آدرس تحویل را انتخاب کنید." });
      return;
    }

    try {
      await onSubmit({
        customerName: selectedCustomerId ? undefined : customerName.trim(),
        customerObjectId: selectedCustomerId || undefined,
        customerAddressObjectId: selectedAddressId || undefined,
        saleTypeObjectId: selectedCustomer?.saleType?.objectId || undefined,
        sepidarSaleTypeId:
          selectedCustomer?.saleType?.sepidarSaleTypeId ?? undefined,
        items: normalizedItems.map((item) => ({
          productObjectId: item.productId,
          quantity: item.quantity,
          ...(sepidarProductsOnly
            ? {
                unitPrice: productsById[item.productId]?.unitPrice ?? 0,
                priceNoteItemId:
                  productsById[item.productId]?.priceNoteItemId ?? null,
              }
            : {}),
        })),
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>مشتری</span>
            <SearchableSelect
              value={selectedCustomerId || undefined}
              onValueChange={(value) => {
                setSelectedCustomerId(value);
                if (sepidarProductsOnly) {
                  setProducts([]);
                  setProductsError("");
                  setItems([createEmptyRow(0)]);
                  setRowErrors({});
                }
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
              placeholder="انتخاب مشتری"
              searchPlaceholder="جستجو بر اساس نام"
              emptyMessage={
                assignedCustomersOnly
                  ? "هنوز مشتری‌ای به شما اختصاص داده نشده است."
                  : "مشتری پیدا نشد"
              }
              disabled={isLoadingCustomers || Boolean(customersError)}
              invalid={Boolean(fieldErrors.selectedCustomerId)}
            />
            <FieldError message={fieldErrors.selectedCustomerId} />
            {customersError ? (
              <FieldError message={customersError} />
            ) : assignedCustomersOnly &&
              !isLoadingCustomers &&
              customers.length === 0 ? (
              <p className="text-xs font-medium text-[#8A5A00]">
                هنوز مشتری‌ای به شما اختصاص داده نشده است.
              </p>
            ) : null}
          </label>

          {/* <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>آدرس تحویل</span>
            <SearchableSelect
              value={selectedAddressId || undefined}
              onValueChange={(value) => {
                setSelectedAddressId(value);
                setFieldErrors((current) => ({
                  ...current,
                  selectedAddressId: "",
                }));
              }}
              options={addresses.map((address) => ({
                value: address.objectId,
                label: formatDeliveryAddress(address),
              }))}
              placeholder={
                isLoadingAddresses ? "در حال دریافت آدرس‌ها" : "انتخاب آدرس"
              }
              searchPlaceholder="جستجو در آدرس‌ها"
              emptyMessage="آدرسی پیدا نشد"
              disabled={!selectedCustomerId || isLoadingAddresses}
              invalid={Boolean(fieldErrors.selectedAddressId)}
            />
            <FieldError message={fieldErrors.selectedAddressId} />
          </label> */}
        </div>

        {selectedCustomer ? (
          <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-4 text-sm leading-7 text-[#334155]">
            {assignedCustomersOnly ? (
              <p className="mb-2 font-semibold text-[#102034]">
                مشتری انتخاب‌شده
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <span>نام مشتری: {selectedCustomer.fullName || "-"}</span>
              <span>
                کد مشتری:{" "}
                {selectedCustomer.sepidarCustomerCode ||
                  selectedCustomer.id ||
                  "-"}
              </span>
              <span>
                {assignedCustomersOnly ? "شماره تماس: " : "موبایل: "}
                {selectedCustomer.phone
                  ? formatFaDigits(selectedCustomer.phone)
                  : "-"}
              </span>
              {assignedCustomersOnly ? (
                <span>
                  نوع فروش: {selectedCustomer.saleType?.title || "-"}
                </span>
              ) : null}
            </div>
            {assignedCustomersOnly ? (
              selectedCustomer.allowedStocks.length ? (
                <div className="mt-3 rounded-xl border border-[#DDEAE0] bg-[#F3FAF4] p-3 text-xs leading-6 text-[#2F6B3A]">
                  انبارهای مجاز:{" "}
                  {selectedCustomer.allowedStocks
                    .map((stock) =>
                      [stock.code ? formatFaDigits(stock.code) : null, stock.title]
                        .filter(Boolean)
                        .join(" - "),
                    )
                    .join("، ")}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-[#F3D9A4] bg-[#FFF8E6] p-3 text-xs leading-6 text-[#8A5A00]">
                  برای این کارشناس انبار مجاز تعریف نشده است.
                </div>
              )
            ) : null}
            {selectedAddress ? (
              <div className="mt-2 space-y-1 text-[#6B7280]">
                {selectedAddress.title ? (
                  <p className="text-xs text-[#94A3B8]">
                    {selectedAddress.title}
                  </p>
                ) : null}
                <p>
                  گیرنده بار:{" "}
                  {getReceiverName(selectedAddress, selectedCustomer) || "-"}
                </p>
                <p>
                  موبایل گیرنده:{" "}
                  {getReceiverPhone(selectedAddress, selectedCustomer)}
                </p>
                <p>آدرس کامل: {formatDeliveryAddress(selectedAddress)}</p>
              </div>
            ) : addresses.length === 0 && !isLoadingAddresses ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#F3D9A4] bg-[#FFF8E6] p-3 text-[#8A5A00]">
                <span>این مشتری آدرس فعالی ندارد.</span>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/expert/customers/${selectedCustomer.objectId}/edit`}
                  >
                    افزودن آدرس
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : !assignedCustomersOnly ? (
          <label className="mt-4 grid gap-2 text-sm font-medium text-[#334155]">
            <span>نام مشتری دستی</span>
            <Input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="در صورت نبود مشتری ثبت شده، نام را وارد کنید"
            />
          </label>
        ) : null}

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#102034]">
              آیتم های سفارش
            </h3>
            <p className="mt-1 text-sm leading-7 text-[#6B7280]">
              {mode === "edit"
                ? "کالاهای سفارش را بازبینی کنید و تعداد هر ردیف را اصلاح کنید."
                : "کالاهای مورد نیاز را انتخاب کنید و تعداد هر ردیف را برای ثبت نهایی سفارش مشخص کنید."}
            </p>
          </div>
        </div>

        {isLoadingProducts ? (
          <div className="mt-5">
            <LoadingState
              title="در حال دریافت کالاها"
              description="فهرست کالاها از سرور دریافت می شود."
            />
          </div>
        ) : null}
        {!isLoadingProducts && productsError ? (
          <div className="mt-5">
            <InlineErrorMessage message={productsError} />
          </div>
        ) : null}
        {!isLoadingProducts &&
        !productsError &&
        sepidarProductsOnly &&
        !selectedCustomerId ? (
          <p className="mt-5 rounded-xl border border-[#D7DEE6] bg-[#F8FAFC] p-3 text-sm text-[#536275]">
            ابتدا مشتری را انتخاب کنید.
          </p>
        ) : null}
        {!isLoadingProducts &&
        !productsError &&
        sepidarProductsOnly &&
        selectedCustomerId &&
        !selectedCustomer?.saleType?.sepidarSaleTypeId ? (
          <p className="mt-5 rounded-xl border border-[#F3D9A4] bg-[#FFF8E6] p-3 text-sm text-[#8A5A00]">
            برای این مشتری نوع فروش مشخص نشده است.
          </p>
        ) : null}
        {!isLoadingProducts &&
        !productsError &&
        sepidarProductsOnly &&
        selectedCustomer?.saleType?.sepidarSaleTypeId &&
        products.length === 0 ? (
          <p className="mt-5 rounded-xl border border-[#F3D9A4] bg-[#FFF8E6] p-3 text-sm text-[#8A5A00]">
            برای نوع فروش انتخاب‌شده قیمتی ثبت نشده است.
          </p>
        ) : null}

        <div className="mt-5 space-y-3">
          {items.map((item, index) => {
            const product = productsById[item.productId];

            return (
              <div
                key={item.rowId}
                className="grid gap-3 border-b border-[#E7EDF3] py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_88px_170px_190px_auto] md:items-center"
              >
                <div className="relative">
                  <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                  <SearchableSelect
                    value={item.productId || undefined}
                    onValueChange={(value) =>
                      updateRow(item.rowId, { productId: value })
                    }
                    options={products
                      .filter(
                        (option) =>
                          sepidarProductsOnly ||
                          option.availableStock > 0 ||
                          option.objectId === item.productId,
                      )
                      .map((option) => ({
                        value: option.objectId,
                        label: sepidarProductsOnly
                          ? `${option.sepidarCode || option.sku} - ${option.name} - قیمت ${formatCurrency(option.unitPrice)}`
                          : `${option.name} - ${option.brand} - موجودی قابل فروش ${formatNumber(option.availableStock)} ${option.unit}`,
                      }))}
                    placeholder={
                      sepidarProductsOnly && !selectedCustomerId
                        ? "ابتدا مشتری را انتخاب کنید."
                        : "انتخاب کالا"
                    }
                    searchPlaceholder="جستجو در کالاها"
                    emptyMessage={
                      sepidarProductsOnly &&
                      selectedCustomer?.saleType?.sepidarSaleTypeId &&
                      products.length === 0
                        ? "برای نوع فروش انتخاب‌شده قیمتی ثبت نشده است."
                        : "کالایی پیدا نشد"
                    }
                    triggerClassName="pr-10"
                    disabled={
                      sepidarProductsOnly &&
                      (!selectedCustomerId ||
                        !selectedCustomer?.saleType?.sepidarSaleTypeId ||
                        isLoadingProducts ||
                        Boolean(productsError))
                    }
                    invalid={Boolean(rowErrors[item.rowId]?.productId)}
                  />
                  <FieldError message={rowErrors[item.rowId]?.productId} />
                </div>

                <div>
                  <Input
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(event) =>
                      updateRow(item.rowId, {
                        quantity: toNumber(event.target.value),
                      })
                    }
                    className="px-2.5 text-center"
                    aria-invalid={Boolean(rowErrors[item.rowId]?.quantity)}
                  />
                  <FieldError message={rowErrors[item.rowId]?.quantity} />
                </div>

                <div className="flex h-11 items-center justify-between gap-3 rounded-[14px] border border-[#E7EDF3] bg-[#FBFCFD] px-3.5 text-sm">
                  <span className="text-xs font-medium text-[#6B7280]">
                    قیمت واحد
                  </span>
                  <span className="text-sm font-semibold text-[#102034]">
                    {product ? formatCurrency(product.unitPrice) : "-"}
                  </span>
                </div>

                <div className="flex h-11 items-center justify-between gap-3 rounded-[14px] border border-[#E7EDF3] bg-[#FBFCFD] px-3.5 text-sm">
                  <span className="text-xs font-medium text-[#6B7280]">
                    مبلغ ردیف
                  </span>
                  <span className="text-sm font-semibold text-[#102034]">
                    {product
                      ? formatCurrency(
                          getOrderLineTotal(item.quantity, product.unitPrice),
                        )
                      : "-"}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={() => removeRow(item.rowId)}
                  variant="outline"
                  size="icon"
                  aria-label="حذف آیتم"
                >
                  <Trash2 className="size-4" />
                </Button>

                <p className="text-xs text-[#6B7280] md:col-span-5">
                  {product
                    ? `${sepidarProductsOnly ? `کد کالا / بارکد: ${formatFaDigits(product.sepidarCode || product.sku)}${product.barcode ? ` / ${formatFaDigits(product.barcode)}` : ""} • ` : `موجودی قابل فروش: ${formatNumber(product.availableStock)} ${product.unit} • `}قیمت واحد: ${formatCurrency(product.unitPrice)}`
                    : `آیتم ${formatNumber(index + 1)}`}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#6B7280]">مبلغ تقریبی سفارش</span>
            <span className="font-semibold text-[#102034]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={addRow}>
            افزودن آیتم
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              isLoadingProducts ||
              isLoadingCustomers ||
              Boolean(productsError) ||
              Boolean(customersError) ||
              (assignedCustomersOnly && customers.length === 0)
            }
          >
            {isSubmitting ? "در حال ذخیره..." : submitLabel}
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        {error ? (
          <div className="mt-4">
            <InlineErrorMessage message={error} />
          </div>
        ) : null}
      </Card>

      <OrderSummaryCard
        customerName={selectedCustomer?.fullName || customerName || "ثبت نشده"}
        itemCount={totalItems}
        totalQuantity={totalQuantity}
        totalAmount={totalAmount}
        status={initialOrder?.orderStatus ?? "pending_approval"}
        warehouseStatus={initialOrder?.warehouseStatus ?? "reserved"}
      />
    </section>
  );
}

function createEmptyRow(index: number): DraftItem {
  return { rowId: `empty-${index}`, productId: "", quantity: 1 };
}

function mapOrderItems(items: OrderItem[], products: Product[]): DraftItem[] {
  const mappedItems = items.map((item, index) => ({
    rowId: `${index}-${item.objectId || item.productId || item.productSku}`,
    productId: resolveProductObjectId(item, products),
    quantity: item.quantity,
  }));

  return mappedItems.length ? mappedItems : [createEmptyRow(0)];
}

function resolveProductObjectId(item: OrderItem, products: Product[]): string {
  const rawProductId = item.productId || "";
  const matchedProduct = products.find(
    (product) =>
      product.objectId === rawProductId ||
      product.id === rawProductId ||
      product.sku === rawProductId ||
      product.sku === item.productSku,
  );

  return matchedProduct?.objectId ?? rawProductId;
}

function getReceiverPhone(
  address: CustomerAddress,
  customer: Customer,
): string {
  const phone =
    address.receiverType === "self"
      ? address.receiverPhone || customer.phone
      : address.receiverPhone;

  return phone ? formatFaDigits(phone) : "-";
}
