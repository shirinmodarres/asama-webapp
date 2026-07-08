"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, PackageSearch, Trash2 } from "lucide-react";
import { FieldError } from "@/components/shared/field-error";
import { JalaliDateInput } from "@/components/shared/jalali-date-input";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
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
import {
  getAssignedCustomerForExpert,
  listAssignedCustomersForExpert,
} from "@/lib/services/expert-customer.service";
import {
  listOrderProductsBySaleType,
  listProducts,
} from "@/lib/services/product.service";
import { createDeprecatedProductInventoryFields } from "@/lib/mappers/product.mapper";
import {
  formatDeliveryAddress,
  getReceiverName,
} from "@/lib/utils/address-format";
import {
  formatFaDigits,
  normalizeDigits,
  toNumber,
} from "@/lib/utils/number-format";
import {
  logOrderDropdownProductSource,
} from "@/lib/utils/order-product-availability";
import {
  POSITIVE_NUMBER_MESSAGE,
  SELECT_REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";

interface DraftItem {
  rowId: string;
  productId: string;
  quantity: number;
}

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CUSTOMERS: Customer[] = [];

export interface OrderFormSubmitPayload {
  customerName?: string;
  customerObjectId?: string;
  customerAddressObjectId?: string;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientNationalId?: string;
  najaOrderNumber?: string;
  najaPurchaseDate?: string | null;
  notes?: string;
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
  initialProducts?: Product[];
  initialCustomers?: Customer[];
  lockCustomer?: boolean;
  onSubmit: (payload: OrderFormSubmitPayload) => Promise<void>;
}

export function OrderForm({
  mode,
  initialOrder,
  submitLabel,
  isSubmitting = false,
  assignedCustomersOnly = false,
  sepidarProductsOnly = false,
  initialProducts,
  initialCustomers,
  lockCustomer = false,
  onSubmit,
}: OrderFormProps) {
  const providedProducts = initialProducts ?? EMPTY_PRODUCTS;
  const providedCustomers = useMemo(
    () => mergeCustomers(initialCustomers ?? EMPTY_CUSTOMERS, initialOrder),
    [initialCustomers, initialOrder],
  );
  const [products, setProducts] = useState<Product[]>(providedProducts);
  const [customers, setCustomers] = useState<Customer[]>(providedCustomers);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(!sepidarProductsOnly);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [customersError, setCustomersError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
  const [items, setItems] = useState<DraftItem[]>(() =>
    initialOrder ? mapOrderItems(initialOrder.items, []) : [createEmptyRow(0)],
  );
  const [customerName, setCustomerName] = useState(
    initialOrder?.customerName ?? "",
  );
  const [recipientFirstName, setRecipientFirstName] = useState(
    initialOrder?.recipientFirstName ?? "",
  );
  const [recipientLastName, setRecipientLastName] = useState(
    initialOrder?.recipientLastName ?? "",
  );
  const [recipientNationalId, setRecipientNationalId] = useState(
    initialOrder?.recipientNationalId ?? "",
  );
  const [najaOrderNumber, setNajaOrderNumber] = useState(
    initialOrder?.najaOrderNumber ?? initialOrder?.externalOrderNumber ?? "",
  );
  const [najaPurchaseDate, setNajaPurchaseDate] = useState(
    initialOrder?.najaPurchaseDate?.slice(0, 10) ?? "",
  );
  const [notes, setNotes] = useState(initialOrder?.notes ?? "");
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialOrder?.customerObjectId ?? initialOrder?.customer?.objectId ?? "",
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
        providedProducts.length > 0 || sepidarProductsOnly
          ? Promise.resolve<Product[]>([])
          : listProducts("expert"),
        providedCustomers.length > 0
          ? Promise.resolve<Customer[]>(providedCustomers)
          : assignedCustomersOnly
            ? listAssignedCustomersForExpert(getStoredCurrentUser()?.objectId)
            : listCustomers(),
      ]);

      if (!isMounted) return;

      if (providedProducts.length > 0) {
        const mergedProducts = mergeProducts(providedProducts, initialOrder);
        setProducts(mergedProducts);
        if (initialOrder) {
          setItems(mapOrderItems(initialOrder.items, mergedProducts));
        }
      } else if (productsResult.status === "fulfilled") {
        const mergedProducts = mergeProducts(productsResult.value, initialOrder);
        setProducts(mergedProducts);
        if (initialOrder && !sepidarProductsOnly) {
          setItems(mapOrderItems(initialOrder.items, mergedProducts));
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
        setCustomers(mergeCustomers(customersResult.value, initialOrder));
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
  }, [
    assignedCustomersOnly,
    initialOrder,
    providedCustomers,
    providedProducts,
    sepidarProductsOnly,
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignment() {
      setSelectedAssignment(null);
      setAssignmentError("");
      if (!assignedCustomersOnly || !selectedCustomerId) return;

      setIsLoadingAssignment(true);
      try {
        const assignment = await getAssignedCustomerForExpert(
          selectedCustomerId,
          getStoredCurrentUser()?.objectId,
        );
        if (!isMounted) return;
        setSelectedAssignment(assignment);
        if (process.env.NODE_ENV === "development") {
          console.debug("[OrderForm] assignment inventory source", {
            customer: assignment,
            assignment: {
              customerObjectId: assignment.objectId,
              allowedStockObjectIds: assignment.allowedStockObjectIds,
            },
            saleType: assignment.saleType,
            allowedStocks: assignment.allowedStocks,
            allowedStockTitles: assignment.allowedStockTitles,
          });
        }
      } catch (assignmentLoadError) {
        if (!isMounted) return;
        setAssignmentError(getErrorMessage(assignmentLoadError));
      } finally {
        if (isMounted) setIsLoadingAssignment(false);
      }
    }

    loadAssignment();
    return () => {
      isMounted = false;
    };
  }, [assignedCustomersOnly, selectedCustomerId]);

  useEffect(() => {
    let isMounted = true;

    async function loadProductsBySaleType() {
      if (!sepidarProductsOnly) return;
      const fallbackProducts = mergeProducts(providedProducts, initialOrder);
      const keepOrderSnapshotProducts = () => {
        if (mode !== "edit" || !initialOrder) {
          setProducts([]);
          return;
        }
        setProducts(fallbackProducts);
        setItems(mapOrderItems(initialOrder.items, fallbackProducts));
      };

      if (providedProducts.length > 0 && mode !== "edit") {
        setProducts(mergeProducts(providedProducts, initialOrder));
        if (initialOrder) {
          setItems(mapOrderItems(initialOrder.items, providedProducts));
        }
        setIsLoadingProducts(false);
        return;
      }

      const customer = assignedCustomersOnly
        ? selectedAssignment
        : customers.find((entry) => entry.objectId === selectedCustomerId);
      const saleTypeId =
        customer?.saleType?.sepidarSaleTypeId ?? initialOrder?.sepidarSaleTypeId;

      setProductsError("");
      if (!selectedCustomerId) {
        keepOrderSnapshotProducts();
        setIsLoadingProducts(false);
        return;
      }
      if (
        !saleTypeId ||
        (assignedCustomersOnly && !hasAssignmentInventory(customer))
      ) {
        keepOrderSnapshotProducts();
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);
      try {
        const data = await listOrderProductsBySaleType(saleTypeId, {
          customerObjectId: selectedCustomerId || customer?.objectId,
          expertUserId:
            initialOrder?.expertUserId ?? getStoredCurrentUser()?.objectId,
        });
        if (!isMounted) return;
        const mergedProducts = mergeProducts(data, initialOrder);
        setProducts(mergedProducts);
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "[OrderForm] assignment product availability",
            data.map((product) => ({
              productObjectId: product.objectId,
              productName: product.name,
              availableQuantity: product.availableSalesQuantity,
              availableStocks: product.availableStocks,
            })),
          );
        }
        if (initialOrder) {
          setItems(mapOrderItems(initialOrder.items, mergedProducts));
        }
      } catch {
        if (!isMounted) return;
        keepOrderSnapshotProducts();
        setProductsError("دریافت کالاهای قیمت‌گذاری‌شده انجام نشد.");
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }

    loadProductsBySaleType();

    return () => {
      isMounted = false;
    };
  }, [
    assignedCustomersOnly,
    customers,
    initialOrder,
    mode,
    providedProducts,
    selectedAssignment,
    selectedCustomerId,
    sepidarProductsOnly,
  ]);

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
  const oldQuantityByProductId = useMemo(
    () => getOldOrderQuantities(initialOrder, products),
    [initialOrder, products],
  );
  const totalAmount = normalizedItems.reduce((sum, item) => {
    const product = productsById[item.productId];
    return sum + item.quantity * (product?.unitPrice ?? 0);
  }, 0);
  const selectedCustomer =
    (assignedCustomersOnly ? selectedAssignment : null) ??
    customers.find((customer) => customer.objectId === selectedCustomerId);
  const selectedAddress = addresses.find(
    (address) => address.objectId === selectedAddressId,
  );
  const isNajaOrder = initialOrder?.orderType === "naja";
  const currentSaleTypeTitle =
    selectedCustomer?.saleType?.title ?? initialOrder?.saleTypeTitle;
  const currentStockTitles = selectedCustomer
    ? getAllowedStockTitles(selectedCustomer)
    : initialOrder?.stockTitle
      ? [initialOrder.stockTitle]
      : [];

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
      setFieldErrors({
        selectedCustomerId: isNajaOrder
          ? "لطفاً مرکز ناجا را انتخاب کنید."
          : "لطفاً مشتری را انتخاب کنید.",
      });
      return;
    }

    if (
      assignedCustomersOnly &&
      selectedCustomerId &&
      !hasAssignmentInventory(selectedAssignment)
    ) {
      setFieldErrors({
        selectedCustomerId: "برای این مشتری تنظیمات فروش تعریف نشده است.",
      });
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

    if (initialOrder?.orderType === "naja") {
      const nextNajaErrors: Record<string, string> = {};
      if (!recipientFirstName.trim()) {
        nextNajaErrors.recipientFirstName = "نام الزامی است.";
      }
      if (!recipientLastName.trim()) {
        nextNajaErrors.recipientLastName = "نام خانوادگی الزامی است.";
      }
      if (!recipientNationalId.trim()) {
        nextNajaErrors.recipientNationalId = "کد ملی الزامی است.";
      }
      if (!najaOrderNumber.trim()) {
        nextNajaErrors.najaOrderNumber = "شماره سفارش الزامی است.";
      }
      if (Object.keys(nextNajaErrors).length > 0) {
        setFieldErrors(nextNajaErrors);
        return;
      }
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

    const requestedByProduct = new Map<string, number>();
    normalizedItems.forEach((item) => {
      requestedByProduct.set(
        item.productId,
        (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    });
    const insufficientProduct = Array.from(requestedByProduct.entries()).find(
      ([productId, quantity]) => {
        const product = productsById[productId];
        const availableQuantity = product
          ? getEditableAvailableQuantity({
              product,
              mode,
              oldQuantityByProductId,
            })
          : undefined;
        if (
          sepidarProductsOnly &&
          product &&
          !product.hasAvailableSalesQuantity
        ) {
          return false;
        }
        return quantity > (availableQuantity ?? 0);
      },
    );
    if (insufficientProduct) {
      const product = productsById[insufficientProduct[0]];
      const affectedRows = items.filter(
        (item) => item.productId === insufficientProduct[0],
      );
      setRowErrors(
        affectedRows.reduce<
          Record<string, { productId?: string; quantity?: string }>
        >((result, item) => {
          result[item.rowId] = {
            quantity: "موجودی قابل فروش کافی نیست",
          };
          return result;
        }, {}),
      );
      setError(
        `موجودی قابل فروش برای «${product?.name ?? "کالا"}» کافی نیست.`,
      );
      return;
    }

    if (selectedCustomerId && addresses.length > 0 && !selectedAddressId) {
      setFieldErrors({ selectedAddressId: "لطفاً آدرس تحویل را انتخاب کنید." });
      return;
    }

    try {
      await onSubmit({
        customerName: selectedCustomerId ? undefined : customerName.trim(),
        customerObjectId: selectedCustomerId || undefined,
        customerAddressObjectId: selectedAddressId || undefined,
        ...(initialOrder?.orderType === "naja"
          ? {
              recipientFirstName: recipientFirstName.trim(),
              recipientLastName: recipientLastName.trim(),
              recipientNationalId: normalizeDigits(
                recipientNationalId.trim(),
              ),
              najaOrderNumber: normalizeDigits(najaOrderNumber.trim()),
              najaPurchaseDate: najaPurchaseDate || null,
            }
          : {}),
        saleTypeObjectId: selectedCustomer?.saleType?.objectId || undefined,
        sepidarSaleTypeId:
          selectedCustomer?.saleType?.sepidarSaleTypeId ?? undefined,
        notes: notes.trim(),
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
            <span>{isNajaOrder ? "مرکز ناجا" : "مشتری"}</span>
            <SearchableSelect
              value={selectedCustomerId || undefined}
              onValueChange={(value) => {
                setSelectedCustomerId(value);
                if (sepidarProductsOnly) {
                  setProducts([]);
                  setProductsError("");
                  setSelectedAssignment(null);
                  setAssignmentError("");
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
              placeholder={isNajaOrder ? "انتخاب مرکز ناجا" : "انتخاب مشتری"}
              searchPlaceholder="جستجو بر اساس نام"
              emptyMessage={
                isNajaOrder
                  ? "مرکز ناجا پیدا نشد."
                  : assignedCustomersOnly
                  ? "هنوز مشتری‌ای به شما اختصاص داده نشده است."
                  : "مشتری پیدا نشد"
              }
              disabled={
                lockCustomer ||
                isLoadingCustomers ||
                Boolean(customersError)
              }
              invalid={Boolean(fieldErrors.selectedCustomerId)}
            />
            <FieldError message={fieldErrors.selectedCustomerId} />
            {assignmentError ? (
              <FieldError
                message={
                  isNajaOrder
                    ? "برای این مرکز تنظیمات فروش تعریف نشده است."
                    : "برای این مشتری تنظیمات فروش تعریف نشده است."
                }
              />
            ) : null}
            {customersError ? (
              <FieldError message={customersError} />
            ) : assignedCustomersOnly &&
              !isLoadingCustomers &&
              customers.length === 0 ? (
              <p className="text-xs font-medium text-[#8A5A00]">
                {isNajaOrder
                  ? "هنوز مرکز ناجایی به شما اختصاص داده نشده است."
                  : "هنوز مشتری‌ای به شما اختصاص داده نشده است."}
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
                {isNajaOrder ? "مرکز ناجا" : "مشتری انتخاب‌شده"}
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <span>
                {isNajaOrder ? "نام مرکز: " : "نام مشتری: "}
                {selectedCustomer.fullName || "-"}
              </span>
              <span>
                {isNajaOrder ? "کد مرکز در سپیدار: " : "کد مشتری: "}
                {selectedCustomer.sepidarCustomerCode ||
                  selectedCustomer.id ||
                  "-"}
              </span>
              {isNajaOrder ? (
                <span className="sm:col-span-2">
                  آدرس مرکز:{" "}
                  {selectedCustomer.address ||
                    selectedCustomer.defaultAddress?.fullAddress ||
                    "-"}
                </span>
              ) : (
                <span>
                  {assignedCustomersOnly ? "شماره تماس: " : "موبایل: "}
                  {selectedCustomer.phone
                    ? formatFaDigits(selectedCustomer.phone)
                    : "-"}
                </span>
              )}
              {assignedCustomersOnly ? (
                <span>
                  نوع فروش: {selectedCustomer.saleType?.title || "-"}
                </span>
              ) : null}
            </div>
            {assignedCustomersOnly ? (
              getAllowedStockTitles(selectedCustomer).length ? (
                <div className="mt-3 rounded-xl border border-[#DDEAE0] bg-[#F3FAF4] p-3 text-xs leading-6 text-[#2F6B3A]">
                  انبارهای مجاز:{" "}
                  {getAllowedStockTitles(selectedCustomer).join("، ")}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-[#F3D9A4] bg-[#FFF8E6] p-3 text-xs leading-6 text-[#8A5A00]">
                  {isNajaOrder
                    ? "برای این مرکز تنظیمات فروش تعریف نشده است."
                    : "برای این مشتری تنظیمات فروش تعریف نشده است."}
                </div>
              )
            ) : null}
            {selectedAddress && !isNajaOrder ? (
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
            ) : !isNajaOrder && addresses.length === 0 && !isLoadingAddresses ? (
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

        {initialOrder ? (
          <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm leading-7 text-[#334155]">
            <p className="mb-2 font-semibold text-[#102034]">
              اطلاعات فعلی سفارش
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <span>نوع فروش: {currentSaleTypeTitle || "-"}</span>
              <span>انبار خروج: {initialOrder.stockTitle || "-"}</span>
              <span>وضعیت سفارش: {initialOrder.orderStatusLabel || "-"}</span>
              <span>
                وضعیت انبار: {initialOrder.warehouseStatusLabel || "-"}
              </span>
            </div>
          </div>
        ) : null}

        {isNajaOrder ? (
          <div className="mt-5 rounded-xl border border-[#E7EDF3] bg-[#FBFCFD] p-4">
            <div>
              <h3 className="text-base font-semibold text-[#102034]">
                مصرف‌کننده نهایی
              </h3>
              <p className="mt-1 text-sm leading-7 text-[#6B7280]">
                این شخص خریدار نهایی از مرکز ناجا است و با مرکز انتخاب‌شده تفاوت دارد.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>نام</span>
                <Input
                  value={recipientFirstName}
                  onChange={(event) => {
                    setRecipientFirstName(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      recipientFirstName: "",
                    }));
                  }}
                  aria-invalid={Boolean(fieldErrors.recipientFirstName)}
                />
                <FieldError message={fieldErrors.recipientFirstName} />
              </label>

              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>نام خانوادگی</span>
                <Input
                  value={recipientLastName}
                  onChange={(event) => {
                    setRecipientLastName(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      recipientLastName: "",
                    }));
                  }}
                  aria-invalid={Boolean(fieldErrors.recipientLastName)}
                />
                <FieldError message={fieldErrors.recipientLastName} />
              </label>

              <label className="grid gap-2 text-sm font-medium text-[#334155]">
                <span>کد ملی</span>
                <Input
                  inputMode="numeric"
                  value={recipientNationalId}
                  onChange={(event) => {
                    setRecipientNationalId(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      recipientNationalId: "",
                    }));
                  }}
                  aria-invalid={Boolean(fieldErrors.recipientNationalId)}
                />
                <FieldError message={fieldErrors.recipientNationalId} />
              </label>

              <div className="mt-2 border-t border-[#E5E7EB] pt-4 md:col-span-2">
                <h3 className="text-base font-semibold text-[#102034]">
                  اطلاعات سفارش
                </h3>
              </div>

              <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
                <span>شماره سفارش ناجا</span>
                <Input
                  inputMode="numeric"
                  value={najaOrderNumber}
                  onChange={(event) => {
                    setNajaOrderNumber(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      najaOrderNumber: "",
                    }));
                  }}
                  aria-invalid={Boolean(fieldErrors.najaOrderNumber)}
                />
                <FieldError message={fieldErrors.najaOrderNumber} />
              </label>

              <div className="md:col-span-2">
                <JalaliDateInput
                  label="تاریخ سفارش"
                  value={najaPurchaseDate}
                  onChange={setNajaPurchaseDate}
                  placeholder="انتخاب تاریخ سفارش"
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white p-3 text-xs leading-6 text-[#64748B]">
              <p>آدرس مرکز ناجا: {initialOrder?.customerAddress || "-"}</p>
            </div>
          </div>
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
        !hasAssignmentInventory(selectedCustomer) ? (
          <p className="mt-5 rounded-xl border border-[#F3D9A4] bg-[#FFF8E6] p-3 text-sm text-[#8A5A00]">
            برای این مشتری تنظیمات فروش تعریف نشده است.
          </p>
        ) : null}
        {!isLoadingProducts &&
        !productsError &&
        sepidarProductsOnly &&
        selectedCustomer?.saleType?.sepidarSaleTypeId &&
        products.length === 0 ? (
          <p className="mt-5 rounded-xl border border-[#F3D9A4] bg-[#FFF8E6] p-3 text-sm text-[#8A5A00]">
            در انبارهای مجاز این کارشناس کالایی با موجودی قابل فروش پیدا نشد.
          </p>
        ) : null}

        <div className="mt-5 space-y-3">
          {items.map((item, index) => {
            const product = productsById[item.productId];
            const productCode = product
              ? product.sepidarCode || product.sku || product.objectId
              : "";
            const helperText = product
              ? [
                  productCode ? `کد کالا: ${formatFaDigits(productCode)}` : "",
                  product.barcode
                    ? `بارکد: ${formatFaDigits(product.barcode)}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" • ")
              : `آیتم ${formatNumber(index + 1)}`;
            const editableAvailableQuantity = product
              ? getEditableAvailableQuantity({
                  product,
                  mode,
                  oldQuantityByProductId,
                })
              : 0;

            return (
              <div
                key={item.rowId}
                className="rounded-2xl border border-[#E7EDF3] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <div className="grid gap-2">
                  <div className="relative min-w-0 overflow-hidden rounded-[14px]">
                    <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                    <SearchableSelect
                      value={item.productId || undefined}
                      onValueChange={(value) =>
                        updateRow(item.rowId, { productId: value })
                      }
                      options={products
                        .filter((option) => {
                          const availableQuantity =
                            getEditableAvailableQuantity({
                              product: option,
                              mode,
                              oldQuantityByProductId,
                            });
                          return (
                            availableQuantity > 0 ||
                            option.objectId === item.productId
                          );
                        })
                        .map((option) => {
                          if (sepidarProductsOnly) {
                            logOrderDropdownProductSource(option);
                          }
                          return {
                            value: option.objectId,
                            label: productIdentityLabel(option),
                          };
                        })}
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
                          ? "کالایی با موجودی قابل فروش پیدا نشد."
                          : "کالایی پیدا نشد"
                      }
                      triggerClassName="h-11 pr-10 text-sm"
                      disabled={
                        sepidarProductsOnly &&
                        (!selectedCustomerId ||
                          !hasAssignmentInventory(selectedCustomer) ||
                          isLoadingAssignment ||
                          isLoadingProducts ||
                          Boolean(productsError))
                      }
                      invalid={Boolean(rowErrors[item.rowId]?.productId)}
                    />
                  </div>
                  <p className="text-[11px] leading-5 text-[#64748B]">
                    {helperText}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ReadonlyValueInput
                      label="قیمت واحد"
                      value={product ? formatCurrency(product.unitPrice) : "-"}
                    />
                    <ReadonlyValueInput
                      label={
                        mode === "edit"
                          ? "موجودی قابل ویرایش"
                          : "موجودی قابل فروش"
                      }
                      value={
                        product
                          ? `${formatNumber(editableAvailableQuantity)} ${
                              product.unit || ""
                            }`.trim()
                          : "-"
                      }
                    />
                  </div>
                  <FieldError
                    message={rowErrors[item.rowId]?.productId}
                    className="mt-0 leading-5"
                  />
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[96px_minmax(150px,1fr)_40px] sm:items-start">
                  <div className="w-24">
                    <Input
                      inputMode="numeric"
                      min={1}
                      max={
                        product
                          ? sepidarProductsOnly
                            ? product.hasAvailableSalesQuantity
                              ? getEditableAvailableQuantity({
                                  product,
                                  mode,
                                  oldQuantityByProductId,
                                })
                              : undefined
                            : getEditableAvailableQuantity({
                                product,
                                mode,
                                oldQuantityByProductId,
                              })
                          : undefined
                      }
                      value={item.quantity}
                      onChange={(event) =>
                        updateRow(item.rowId, {
                          quantity: toNumber(event.target.value),
                        })
                      }
                      className="h-10 w-24 px-2 text-center text-sm font-semibold"
                      aria-invalid={Boolean(rowErrors[item.rowId]?.quantity)}
                    />
                    <FieldError
                      message={rowErrors[item.rowId]?.quantity}
                      className="mt-1 leading-5"
                    />
                  </div>

                  <ReadonlyAmountPill
                    label="مبلغ ردیف"
                    value={
                      product
                        ? formatCurrency(
                            getOrderLineTotal(
                              item.quantity,
                              product.unitPrice,
                            ),
                          )
                        : "-"
                    }
                  />

                  <Button
                    type="button"
                    onClick={() => removeRow(item.rowId)}
                    variant="outline"
                    size="icon"
                    aria-label="حذف آیتم"
                    className="size-10 self-start justify-self-start rounded-xl sm:justify-self-center"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
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

        <label className="mt-5 grid gap-2 text-sm font-medium text-[#334155]">
          <span>یادداشت</span>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="توضیحات داخلی سفارش"
            rows={3}
          />
        </label>

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
              Boolean(assignmentError) ||
              (assignedCustomersOnly &&
                selectedCustomerId !== "" &&
                !hasAssignmentInventory(selectedCustomer)) ||
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
        saleTypeTitle={currentSaleTypeTitle}
        stockTitles={currentStockTitles}
      />
    </section>
  );
}

function hasAssignmentInventory(customer: Customer | null | undefined): boolean {
  return Boolean(
    customer?.saleType?.sepidarSaleTypeId &&
      (customer.allowedStockObjectIds.length > 0 ||
        customer.allowedSepidarStockIds.length > 0 ||
        customer.allowedStocks.length > 0 ||
        customer.allowedStockTitles.length > 0),
  );
}

function getAllowedStockTitles(customer: Customer): string[] {
  if (customer.allowedStocks.length) {
    return customer.allowedStocks.map((stock) =>
      [stock.code ? formatFaDigits(stock.code) : null, stock.title]
        .filter(Boolean)
        .join(" - "),
    );
  }
  return customer.allowedStockTitles;
}

function createEmptyRow(index: number): DraftItem {
  return { rowId: `empty-${index}`, productId: "", quantity: 1 };
}

function getOldOrderQuantities(
  order: Order | null | undefined,
  products: Product[],
): Map<string, number> {
  const result = new Map<string, number>();
  if (!order) return result;

  for (const item of order.items) {
    const productId = resolveProductObjectId(item, products);
    if (!productId) continue;
    result.set(productId, (result.get(productId) ?? 0) + item.quantity);
  }

  return result;
}

function getEditableAvailableQuantity({
  product,
  mode,
  oldQuantityByProductId,
}: {
  product: Product;
  mode: "create" | "edit";
  oldQuantityByProductId: Map<string, number>;
}): number {
  const backendAvailableSalesQuantity = product.availableSalesQuantity;
  const oldOrderQuantity =
    mode === "edit" ? oldQuantityByProductId.get(product.objectId) ?? 0 : 0;
  const editableAvailable = backendAvailableSalesQuantity + oldOrderQuantity;

  if (process.env.NODE_ENV === "development") {
    console.debug("[ORDER_EDIT_PRODUCT_AVAILABILITY]", {
      productObjectId: product.objectId,
      source: product.inventorySource || "order_options",
      backendAvailableSalesQuantity,
      oldOrderQuantity,
      editableAvailable,
    });
  }

  return editableAvailable;
}

function mergeProducts(products: Product[], order?: Order | null): Product[] {
  if (!order) return products;
  const productMap = new Map(products.map((product) => [product.objectId, product]));
  order.items.forEach((item) => {
    if (!item.productId) return;
    const realProductExists =
      productMap.has(item.productId) ||
      Array.from(productMap.values()).some(
        (product) =>
          product.sku === item.productSku ||
          product.sepidarCode === item.productSku ||
          (item.sepidarItemId !== null &&
            product.sepidarItemId === item.sepidarItemId),
      );
    if (realProductExists) return;
    productMap.set(item.productId, createProductFromOrderItem(item));
  });
  return Array.from(productMap.values());
}

function createProductFromOrderItem(item: OrderItem): Product {
  return {
    objectId: item.productId,
    id: item.productSku,
    sku: item.productSku,
    barcode: null,
    sepidarItemId: item.sepidarItemId,
    sepidarCode: item.productSku,
    name: item.productName,
    brand: item.brand,
    brandName: item.brandName,
    model: null,
    category: "",
    unit: "عدد",
    unitPrice: item.unitPrice,
    priceNoteItemId: null,
    description: null,
    isSyncedFromSepidar: true,
    isActive: true,
    isSellable: true,
    status: "active",
    statusLabel: "فعال",
    availableSalesQuantity: 0,
    hasAvailableSalesQuantity: false,
    inventorySource: "order_snapshot",
    availableStocks: [],
    ...createDeprecatedProductInventoryFields(),
    createdAt: "",
    updatedAt: "",
  };
}

function productIdentityLabel(product: Product): string {
  return [
    product.sepidarCode || product.sku || product.objectId,
    product.name,
  ]
    .filter(Boolean)
    .join(" - ");
}

function ReadonlyValueInput({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-medium text-[#64748B]">
      <span>{label}</span>
      <Input
        value={value}
        readOnly
        disabled
        className="h-10 bg-[#F7F9FB] text-sm font-semibold text-[#102034] disabled:opacity-100"
      />
    </label>
  );
}

function ReadonlyAmountPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex h-10 min-w-0 items-center justify-between gap-2 rounded-xl border border-[#E7EDF3] bg-[#FBFCFD] px-3">
      <span className="shrink-0 text-[10px] font-medium text-[#6B7280]">
        {label}
      </span>
      <span className="min-w-0 truncate text-[11px] font-semibold text-[#102034]">
        {value}
      </span>
    </div>
  );
}

function mergeCustomers(customers: Customer[], order?: Order | null): Customer[] {
  if (!order?.customerObjectId) return customers;
  if (customers.some((customer) => customer.objectId === order.customerObjectId)) {
    return customers;
  }
  const fallbackCustomer = order.customer ?? createCustomerFromOrder(order);
  return fallbackCustomer ? [fallbackCustomer, ...customers] : customers;
}

function createCustomerFromOrder(order: Order): Customer | null {
  if (!order.customerObjectId) return null;
  return {
    objectId: order.customerObjectId,
    id: order.sepidarCustomerCode ?? order.customerObjectId,
    sepidarCustomerId:
      order.sepidarCustomerId === null ? null : String(order.sepidarCustomerId),
    sepidarCustomerCode: order.sepidarCustomerCode,
    saleType:
      order.saleType ??
      (order.saleTypeTitle || order.sepidarSaleTypeId
        ? {
            objectId: order.saleTypeObjectId,
            sepidarSaleTypeId: order.sepidarSaleTypeId,
            title: order.saleTypeTitle,
          }
        : null),
    allowedStockObjectIds: order.stockObjectId ? [order.stockObjectId] : [],
    allowedSepidarStockIds:
      order.sepidarStockId === null ? [] : [order.sepidarStockId],
    allowedStocks: [],
    allowedStockTitles: order.selectedStockTitles.length
      ? order.selectedStockTitles
      : order.stockTitle
        ? [order.stockTitle]
        : [],
    isSyncedFromSepidar: true,
    fullName: order.customerName ?? "",
    phone: order.customerPhone ?? order.customerMobile ?? "",
    mobile: order.customerMobile,
    address: order.customerAddress,
    postalCode: null,
    nationalId: order.customerNationalId,
    assignedExpertName: order.createdByName ?? null,
    status: "active",
    statusLabel: "فعال",
    defaultAddress: null,
    addresses: [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
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
