"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Landmark, PackageSearch, Tags } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { FieldError } from "@/components/shared/field-error";
import { JalaliDateInput } from "@/components/shared/jalali-date-input";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { PaymentMethodRow } from "@/components/shared/payment-method-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency } from "@/lib/expert/utils";
import type { Customer } from "@/lib/models/customer.model";
import type { Product } from "@/lib/models/product.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import {
  getAssignedCustomerForExpert,
  listAssignedCustomersForExpert,
} from "@/lib/services/expert-customer.service";
import { listActiveSalesTypes } from "@/lib/services/sales-type.service";
import { createNajaOrder } from "@/lib/services/naja.service";
import {
  listOrderProductsForAssignment,
  listOrderProductsBySaleType,
} from "@/lib/services/product.service";
import type { RoleKey } from "@/lib/types";
import { formatFaDigits, normalizeDigits, toNumber } from "@/lib/utils/number-format";
import {
  formatOrderAvailableQuantity,
  logOrderDropdownProductSource,
} from "@/lib/utils/order-product-availability";
import { POSITIVE_NUMBER_MESSAGE } from "@/lib/utils/form-validation";

interface NajaOrderPageProps {
  role?: RoleKey;
}

type PaymentMethodSnapshot = {
  objectId: string | null;
  title: string | null;
  internalCode: number | null;
  sepidarCode: number | null;
};

type SalesTypeOption = {
  objectId: string;
  title: string;
  internalCode: number | null;
  sepidarCode: number | null;
};

const NAJA_PAYMENT_METHOD_CODES = new Set([22003, 22004]);

export function NajaOrderPage({ role = "naja" }: NajaOrderPageProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesTypes, setSalesTypes] = useState<
    Array<SalesTypeOption>
  >([]);
  const [selectedSalesTypeId, setSelectedSalesTypeId] = useState("");
  const [selectedPriceListId, setSelectedPriceListId] = useState("");
  const [selectedStockObjectId, setSelectedStockObjectId] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerObjectId, setCustomerObjectId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [recipientFirstName, setRecipientFirstName] = useState("");
  const [recipientLastName, setRecipientLastName] = useState("");
  const [recipientNationalId, setRecipientNationalId] = useState("");
  const [recipientMobile, setRecipientMobile] = useState("");
  const [najaOrderNumber, setNajaOrderNumber] = useState("");
  const [najaPurchaseDate, setNajaPurchaseDate] = useState("");
  const [createdByName, setCreatedByName] = useState(
    getStoredCurrentUser()?.fullName ||
      getStoredCurrentUser()?.username ||
      "کارشناس ناجا",
  );
  const [error, setError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submitGuardRef = useRef(false);

  const najaSalesTypes = useMemo(
    () =>
      salesTypes.filter((salesType) =>
        salesType.internalCode !== null &&
        NAJA_PAYMENT_METHOD_CODES.has(salesType.internalCode),
      ),
    [salesTypes],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError("");
      try {
        const customerData = await listAssignedCustomersForExpert(
          getStoredCurrentUser()?.objectId,
        );
        if (!isMounted) return;
        setCustomers(customerData);
        const salesTypeData = await listActiveSalesTypes();
        if (!isMounted) return;
        setSalesTypes(salesTypeData.map((item) => ({
          objectId: item.objectId,
          title: item.title,
          internalCode: item.internalCode,
          sepidarCode: item.sepidarCode,
        })));
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCustomer = selectedAssignment;
  const allowedStockOptions = useMemo(
    () => getAllowedStockOptions(selectedCustomer),
    [selectedCustomer],
  );
  const priceListOptions = useMemo(
    () => getPriceListOptions(selectedCustomer),
    [selectedCustomer],
  );
  const selectedProduct =
    products.find((product) => product.objectId === productId) ?? null;
  const totalAmount = selectedProduct ? selectedProduct.unitPrice * quantity : 0;
  const paymentMethodSnapshot = getCustomerPaymentMethodSnapshot(
    selectedCustomer,
    salesTypes,
    selectedSalesTypeId,
  );
  const paymentMethodTitle = paymentMethodSnapshot?.title || getPaymentMethodTitle(selectedCustomer);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignment() {
      setSelectedAssignment(null);
      setSelectedPriceListId("");
      setAssignmentError("");
      if (!customerObjectId) return;

      setIsLoadingAssignment(true);
      try {
        const assignment = await getAssignedCustomerForExpert(
          customerObjectId,
          getStoredCurrentUser()?.objectId,
        );
        if (!isMounted) return;
        setSelectedAssignment(assignment);
        const assignmentPriceListOptions = getPriceListOptions(assignment);
        setSelectedPriceListId(
          assignmentPriceListOptions.length === 1
            ? assignmentPriceListOptions[0].objectId
            : "",
        );
        const assignedPaymentMethod = getCustomerPaymentMethodSnapshot(
          assignment,
          salesTypes,
        );
        setSelectedSalesTypeId(
          assignedPaymentMethod?.internalCode !== null &&
            assignedPaymentMethod?.internalCode !== undefined &&
            NAJA_PAYMENT_METHOD_CODES.has(assignedPaymentMethod.internalCode)
            ? assignedPaymentMethod.objectId || ""
            : "",
        );
        const allowedStockIds = getAllowedStockOptions(assignment).map(
          (stock) => stock.objectId,
        );
        setSelectedStockObjectId((current) =>
          current && allowedStockIds.includes(current)
            ? current
            : allowedStockIds.length === 1
              ? allowedStockIds[0]
              : "",
        );
        if (process.env.NODE_ENV === "development") {
          console.debug("[NajaOrderForm] assignment inventory source", {
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
  }, [customerObjectId, salesTypes]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setProducts([]);
      setProductId("");
      setError("");
      const saleTypeId = selectedCustomer?.saleType?.sepidarSaleTypeId;
      const priceListIds = selectedCustomer?.priceListIds ?? [];
      const priceListId = selectedCustomer?.priceListId;
      const hasAssignedPriceLists = priceListIds.length > 0 || Boolean(priceListId);
      if (
        !hasAssignmentInventory(selectedCustomer) ||
        !selectedStockObjectId ||
        (hasAssignedPriceLists && !selectedPriceListId) ||
        (!hasAssignedPriceLists && !saleTypeId)
      ) {
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);
      try {
        if (!selectedCustomer) return;
        const context = {
          customerObjectId: selectedCustomer.objectId,
          expertUserId: getStoredCurrentUser()?.objectId,
          stockObjectId: selectedStockObjectId,
          priceListId: selectedPriceListId || undefined,
        };
        const data = hasAssignedPriceLists
          ? await listOrderProductsForAssignment(context)
          : await listOrderProductsBySaleType(saleTypeId ?? 0, context);
        if (isMounted) {
          setProducts(data);
          if (process.env.NODE_ENV === "development") {
            console.debug(
              "[NajaOrderForm] assignment product availability",
              data.map((product) => ({
                productObjectId: product.objectId,
                productName: product.name,
                availableQuantity: product.availableForSale,
                availableStocks: product.availableStocks,
              })),
            );
          }
        }
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [selectedCustomer, selectedPriceListId, selectedStockObjectId]);

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.objectId,
        label: [
          customer.sepidarCustomerCode || customer.id,
          customer.fullName,
          customer.saleType?.title ? `روش پرداخت: ${customer.saleType.title}` : "",
        ]
          .filter(Boolean)
          .join(" - "),
      })),
    [customers],
  );

  const productOptions = useMemo(
    () =>
      products.map((product) => {
        logOrderDropdownProductSource(product);
        return {
          value: product.objectId,
          label: productIdentityLabel(product),
        };
      }),
    [products],
  );

  const handleSubmit = async () => {
    if (submitGuardRef.current || isSubmitting) return;
    setError("");
    setFieldErrors({});
    const nextErrors: Record<string, string> = {};

    if (!customerObjectId) {
      nextErrors.customerObjectId = "لطفاً مرکز ناجا را انتخاب کنید.";
    }
    if (customerObjectId && !hasAssignmentInventory(selectedCustomer)) {
      nextErrors.customerObjectId =
        "برای این مرکز تنظیمات فروش تعریف نشده است.";
    }
    if (priceListOptions.length > 0 && !selectedPriceListId) {
      nextErrors.selectedPriceListId = "لطفاً لیست قیمت را انتخاب کنید.";
    }
    if (!productId) nextErrors.productId = "لطفاً کالا را انتخاب کنید.";
    if (!productId) nextErrors.items = "حداقل یک کالا به سفارش اضافه کنید.";
    if (!selectedStockObjectId) {
      nextErrors.selectedStockObjectId = "لطفاً انبار سفارش را انتخاب کنید.";
    }
    const selectedNajaSalesType = najaSalesTypes.find(
      (salesType) => salesType.objectId === selectedSalesTypeId,
    );
    if (!selectedSalesTypeId) {
      nextErrors.selectedSalesTypeId = "لطفاً روش پرداخت را انتخاب کنید.";
    } else if (!selectedNajaSalesType) {
      nextErrors.selectedSalesTypeId = "روش پرداخت انتخاب‌شده برای ناجا معتبر نیست.";
    }
    if (!recipientFirstName.trim()) {
      nextErrors.recipientFirstName = "نام الزامی است.";
    }
    if (!recipientLastName.trim()) {
      nextErrors.recipientLastName = "نام خانوادگی الزامی است.";
    }
    if (!recipientNationalId.trim()) {
      nextErrors.recipientNationalId = "کد ملی الزامی است.";
    }
    if (!najaOrderNumber.trim()) {
      nextErrors.najaOrderNumber = "شماره سفارش الزامی است.";
    }

    const requestedQuantity = toNumber(quantity);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      nextErrors.quantity = POSITIVE_NUMBER_MESSAGE;
    } else if (
      selectedProduct?.hasAvailableSalesQuantity &&
      requestedQuantity > selectedProduct.availableForSale
    ) {
      nextErrors.quantity = "موجودی قابل فروش کافی نیست";
    }
    if (selectedProduct && selectedProduct.unitPrice <= 0) {
      nextErrors.productId = selectedProduct.priceListConflict
        ? "این کالا در چند روش پرداخت انتخابی وجود دارد."
        : "قیمت کالا برای این روش پرداخت ثبت نشده است.";
    }
    if (!createdByName.trim()) {
      nextErrors.createdByName = "این فیلد الزامی است.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedCustomer || !selectedProduct) return;

    submitGuardRef.current = true;
    setIsSubmitting(true);
    try {
      const order = await createNajaOrder({
        orderType: "naja",
        createdByName: createdByName.trim(),
        customerObjectId,
        salesTypeObjectId: paymentMethodSnapshot?.objectId || undefined,
        salesTypeTitle: paymentMethodSnapshot?.title || undefined,
        salesTypeInternalCode: paymentMethodSnapshot?.internalCode ?? undefined,
        salesTypeSepidarCode: paymentMethodSnapshot?.sepidarCode ?? undefined,
        priceListId: selectedProduct.priceListId || selectedPriceListId || undefined,
        stockObjectId: selectedStockObjectId,
        selectedStockObjectIds: [selectedStockObjectId],
        recipientFirstName: recipientFirstName.trim(),
        recipientLastName: recipientLastName.trim(),
        recipientNationalId: normalizeDigits(recipientNationalId.trim()),
        recipientMobile: normalizeDigits(recipientMobile.trim()) || undefined,
        najaOrderNumber: normalizeDigits(najaOrderNumber.trim()),
        najaPurchaseDate: najaPurchaseDate || undefined,
        items: [
          {
            productObjectId: selectedProduct.productObjectId || productId,
            quantity: requestedQuantity,
            unitPrice: selectedProduct.unitPrice,
            priceNoteItemId: selectedProduct.priceNoteItemId,
            priceListId: selectedProduct.priceListId ?? null,
            priceListItemId: selectedProduct.priceListItemId ?? null,
            pricingSource: selectedProduct.pricingSource ?? null,
          },
        ],
      });
      router.replace(`/naja/orders/${order.objectId}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      submitGuardRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role={role} title="ثبت سفارش ناجا">
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          {isLoading ? (
            <LoadingState
              title="در حال دریافت اطلاعات سفارش ناجا"
              description="فهرست مرکزهای ناجای اختصاص‌یافته از سرور دریافت می‌شود."
            />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h3 className="text-base font-semibold text-[#102034]">
                مرکز ناجا
              </h3>
              <p className="mt-1 text-sm leading-7 text-[#6B7280]">
                مرکز یا سازمان ناجا را از مشتری‌های سپیدار انتخاب کنید.
              </p>
            </div>

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>مرکز ناجا</span>
              <div className="relative">
                <Landmark className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <SearchableSelect
                  value={customerObjectId}
                  onValueChange={(value) => {
                    setCustomerObjectId(value);
                    setSelectedAssignment(null);
                    setSelectedStockObjectId("");
                    setSelectedSalesTypeId("");
                    setSelectedPriceListId("");
                    setProductId("");
                    setAssignmentError("");
                    setFieldErrors((current) => ({
                      ...current,
                      customerObjectId: "",
                      productId: "",
                    }));
                  }}
                  options={customerOptions}
                  placeholder="انتخاب مرکز ناجا از سپیدار"
                  searchPlaceholder="جستجو در مرکزهای اختصاص‌یافته"
                  emptyMessage="مرکز اختصاص‌یافته‌ای پیدا نشد"
                  triggerClassName="pr-10"
                  invalid={Boolean(fieldErrors.customerObjectId)}
                />
                <FieldError message={fieldErrors.customerObjectId} />
                {assignmentError ? (
                  <FieldError message="برای این مرکز تنظیمات فروش تعریف نشده است." />
                ) : null}
              </div>
            </label>

            {customers.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[#DDEAE0] bg-[#FBFCFD] p-4 text-sm leading-7 text-[#6B7280] md:col-span-2">
                هنوز مرکز ناجایی به شما اختصاص داده نشده است.
              </div>
            ) : null}

            {selectedCustomer ? (
              <div className="rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] p-4 text-sm leading-7 text-[#334155] md:col-span-2">
                <p className="font-semibold text-[#102034]">اطلاعات مرکز ناجا</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <span>نام مرکز: {selectedCustomer.fullName || "-"}</span>
                  <span>
                    کد مرکز در سپیدار:{" "}
                    {selectedCustomer.sepidarCustomerCode
                      ? formatFaDigits(selectedCustomer.sepidarCustomerCode)
                      : "-"}
                  </span>
                  <PaymentMethodRow value={paymentMethodTitle} />
                  <span className="sm:col-span-3">
                    آدرس مرکز:{" "}
                    {selectedCustomer.sepidarAddress?.Address ||
                      selectedCustomer.sepidarAddress?.address ||
                      selectedCustomer.defaultAddress?.fullAddress ||
                      "-"}
                  </span>
                </div>
                {getAllowedStockTitles(selectedCustomer).length ? (
                  <div className="mt-3 rounded-xl border border-[#DDEAE0] bg-[#F3FAF4] p-3 text-xs leading-6 text-[#2F6B3A]">
                    انبارهای مجاز:{" "}
                    {getAllowedStockTitles(selectedCustomer).join("، ")}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-[#F3D9A4] bg-[#FFF8E6] p-3 text-xs leading-6 text-[#8A5A00]">
                    برای این مرکز تنظیمات فروش تعریف نشده است.
                  </div>
                )}
              </div>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>روش پرداخت</span>
              <SearchableSelect
                value={selectedSalesTypeId || undefined}
                selectedOption={
                  paymentMethodSnapshot?.objectId
                    ? {
                        value: paymentMethodSnapshot.objectId,
                        label: paymentMethodSnapshot.title || "",
                        searchText: [
                          paymentMethodSnapshot.title,
                          paymentMethodSnapshot.internalCode,
                          paymentMethodSnapshot.sepidarCode,
                        ]
                          .filter(Boolean)
                          .join(" "),
                      }
                    : null
                }
                onValueChange={(value) => {
                  setSelectedSalesTypeId(value);
                  setFieldErrors((current) => ({
                    ...current,
                    selectedSalesTypeId: "",
                  }));
                }}
                options={najaSalesTypes.map((salesType) => ({
                  value: salesType.objectId,
                  label: salesType.title,
                  searchText: [salesType.title, salesType.internalCode, salesType.sepidarCode]
                    .filter(Boolean)
                    .join(" "),
                }))}
                placeholder="انتخاب روش پرداخت"
                searchPlaceholder="جستجو در روش پرداخت"
                emptyMessage="روش پرداختی پیدا نشد"
                disabled={isLoading || isLoadingAssignment}
                invalid={Boolean(fieldErrors.selectedSalesTypeId)}
              />
              <FieldError message={fieldErrors.selectedSalesTypeId} />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>لیست قیمت</span>
              <div className="relative">
                <Tags className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <SearchableSelect
                  value={selectedPriceListId || undefined}
                  onValueChange={(value) => {
                    setSelectedPriceListId(value);
                    setProductId("");
                    setFieldErrors((current) => ({
                      ...current,
                      selectedPriceListId: "",
                      productId: "",
                    }));
                  }}
                  options={priceListOptions.map((priceList) => ({
                    value: priceList.objectId,
                    label: priceList.label,
                    searchText: priceList.searchText,
                  }))}
                  placeholder={
                    selectedCustomer
                      ? "انتخاب لیست قیمت"
                      : "ابتدا مرکز ناجا را انتخاب کنید."
                  }
                  searchPlaceholder="جستجو در لیست‌های قیمت"
                  emptyMessage="لیست قیمت فعالی برای این مرکز پیدا نشد"
                  disabled={!selectedCustomer || isLoadingAssignment}
                  triggerClassName="pr-10"
                  invalid={Boolean(fieldErrors.selectedPriceListId)}
                />
                <FieldError message={fieldErrors.selectedPriceListId} />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>انبار سفارش</span>
              <SearchableSelect
                value={selectedStockObjectId || undefined}
                onValueChange={(value) => {
                  setSelectedStockObjectId(value);
                  setProductId("");
                  setFieldErrors((current) => ({
                    ...current,
                    selectedStockObjectId: "",
                    productId: "",
                  }));
                }}
                options={allowedStockOptions.map((stock) => ({
                  value: stock.objectId,
                  label: stock.title,
                  description:
                    stock.sepidarStockId !== null
                      ? `شناسه سپیدار: ${formatFaDigits(stock.sepidarStockId)}`
                      : undefined,
                }))}
                placeholder={
                  selectedCustomer
                    ? "انتخاب انبار"
                    : "ابتدا مرکز ناجا را انتخاب کنید."
                }
                searchPlaceholder="جستجو در انبارها"
                emptyMessage="انبار مجازی پیدا نشد"
                disabled={!selectedCustomer || isLoadingAssignment}
                invalid={Boolean(fieldErrors.selectedStockObjectId)}
              />
              <FieldError message={fieldErrors.selectedStockObjectId} />
            </label>

            <div className="rounded-[18px] border border-[#DDEAE0] bg-[#F3FAF4] p-4 text-sm leading-7 text-[#2F6B3A] md:col-span-2">
              موجودی و اعتبارسنجی سفارش فقط بر اساس انبار انتخاب‌شده انجام می‌شود.
            </div>

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>کالا</span>
              <div className="relative overflow-hidden rounded-[14px]">
                <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <SearchableSelect
                  value={productId}
                  onValueChange={(value) => {
                    setProductId(value);
                    setFieldErrors((current) => ({
                      ...current,
                      productId: "",
                    }));
                  }}
                  options={productOptions}
                  placeholder={
                    selectedCustomer &&
                    (priceListOptions.length === 0 || selectedPriceListId)
                      ? "انتخاب کالا"
                      : selectedCustomer
                        ? "ابتدا لیست قیمت را انتخاب کنید."
                        : "ابتدا مرکز ناجا را انتخاب کنید."
                  }
                  searchPlaceholder="جستجو در کالاها"
                  emptyMessage={
                    selectedCustomer?.saleType?.sepidarSaleTypeId ||
                    selectedCustomer?.priceListId ||
                    (selectedCustomer?.priceListIds?.length ?? 0) > 0
                      ? "کالایی با موجودی قابل فروش پیدا نشد."
                      : "ابتدا مرکز ناجا را انتخاب کنید."
                  }
                  disabled={
                    !selectedCustomer ||
                    (priceListOptions.length > 0 && !selectedPriceListId) ||
                    !selectedStockObjectId ||
                    !hasAssignmentInventory(selectedCustomer) ||
                    isLoadingAssignment ||
                    isLoadingProducts
                  }
                  triggerClassName="pr-10"
                  invalid={Boolean(fieldErrors.productId)}
                />
                <FieldError message={fieldErrors.productId} />
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <ReadonlyValueInput
                    label="قیمت واحد"
                    value={
                      selectedProduct
                        ? formatCurrency(selectedProduct.unitPrice)
                        : "-"
                    }
                  />
                  <ReadonlyValueInput
                    label="موجودی قابل فروش"
                    value={
                      selectedProduct
                        ? `${formatOrderAvailableQuantity(
                            selectedProduct,
                            formatFaDigits,
                          )} ${selectedProduct.unit || ""}`.trim()
                        : "-"
                    }
                  />
                  <ReadonlyValueInput
                    label="لیست قیمت"
                    value={
                      selectedProduct?.priceListTitle ||
                      selectedProduct?.priceListId ||
                      "-"
                    }
                  />
                </div>
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>تعداد</span>
              <Input
                inputMode="numeric"
                min={1}
                max={
                  selectedProduct?.hasAvailableSalesQuantity
                    ? selectedProduct.availableForSale
                    : undefined
                }
                value={quantity}
                onChange={(event) => {
                  setQuantity(toNumber(event.target.value));
                  setFieldErrors((current) => ({
                    ...current,
                    quantity: "",
                  }));
                }}
                aria-invalid={Boolean(fieldErrors.quantity)}
              />
              <FieldError message={fieldErrors.quantity} />
            </label>

            <div className="mt-2 border-t border-[#E5E7EB] pt-4 md:col-span-2">
              <h3 className="text-base font-semibold text-[#102034]">
                مصرف‌کننده نهایی
              </h3>
              <p className="mt-1 text-sm leading-7 text-[#6B7280]">
                این شخص خریدار نهایی از مرکز ناجا است و با مرکز انتخاب‌شده تفاوت دارد.
              </p>
            </div>

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

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>موبایل</span>
              <Input
                inputMode="tel"
                value={recipientMobile}
                onChange={(event) => setRecipientMobile(event.target.value)}
                placeholder="اختیاری"
              />
            </label>

            <div className="mt-2 border-t border-[#E5E7EB] pt-4 md:col-span-2">
              <h3 className="text-base font-semibold text-[#102034]">
                اطلاعات سفارش
              </h3>
            </div>

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>شماره سفارش</span>
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

            <JalaliDateInput
              label="تاریخ سفارش"
              value={najaPurchaseDate}
              onChange={setNajaPurchaseDate}
              placeholder="انتخاب تاریخ سفارش"
            />

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>نام ثبت‌کننده / کارشناس ناجا</span>
              <Input
                value={createdByName}
                onChange={(event) => {
                  setCreatedByName(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    createdByName: "",
                  }));
                }}
                aria-invalid={Boolean(fieldErrors.createdByName)}
              />
              <FieldError message={fieldErrors.createdByName} />
            </label>
          </div>

          {selectedProduct ? (
            <div className="mt-5 rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] px-4 py-3 text-sm leading-7 text-[#6B7280]">
              کد کالا:{" "}
              {formatFaDigits(selectedProduct.sepidarCode || selectedProduct.sku)}
              {selectedProduct.barcode
                ? ` • بارکد: ${formatFaDigits(selectedProduct.barcode)}`
                : ""}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4">
              <InlineErrorMessage message={error} />
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="success"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isLoading ||
                isLoadingAssignment ||
                isLoadingProducts ||
                Boolean(assignmentError) ||
                !selectedStockObjectId ||
                !selectedSalesTypeId ||
                !hasAssignmentInventory(selectedCustomer) ||
                customers.length === 0
              }
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت سفارش ناجا"}
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </Card>

        <OrderSummaryCard
          customerName={selectedCustomer?.fullName || "ثبت نشده"}
          itemCount={selectedProduct ? 1 : 0}
          totalQuantity={selectedProduct ? quantity : 0}
          totalAmount={totalAmount}
          status="pending_financial_approval"
          warehouseStatus="reserved"
          saleTypeTitle={paymentMethodTitle}
          stockTitles={
            allowedStockOptions
              .filter((stock) => stock.objectId === selectedStockObjectId)
              .map((stock) => stock.title)
          }
        />
      </section>
    </DashboardLayout>
  );
}

function hasAssignmentInventory(customer: Customer | null | undefined): boolean {
  if (!customer) return false;
  return Boolean(
    (customer.saleType?.sepidarSaleTypeId ||
      customer.priceListId ||
      customer.priceListIds.length > 0) &&
      (customer.allowedStockObjectIds.length > 0 ||
        customer.allowedSepidarStockIds.length > 0 ||
        customer.allowedStocks.length > 0),
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

function getAllowedStockOptions(customer: Customer | null | undefined): Array<{
  objectId: string;
  title: string;
  sepidarStockId: number | null;
}> {
  if (!customer) return [];
  if (customer.allowedStocks.length) {
    return customer.allowedStocks.map((stock) => ({
      objectId: String(stock.objectId),
      title: [stock.code ? formatFaDigits(stock.code) : null, stock.title]
        .filter(Boolean)
        .join(" - "),
      sepidarStockId: stock.sepidarStockId,
    }));
  }
  return customer.allowedStockObjectIds.map((objectId, index) => ({
    objectId: String(objectId),
    title: customer.allowedStockTitles[index] || String(objectId),
    sepidarStockId: customer.allowedSepidarStockIds[index] ?? null,
  }));
}

function getPriceListOptions(customer: Customer | null | undefined): Array<{
  objectId: string;
  label: string;
  searchText: string;
}> {
  if (!customer) return [];

  const snapshotsById = new Map(
    customer.priceLists
      .filter((priceList) => priceList.objectId)
      .map((priceList) => [priceList.objectId, priceList]),
  );
  const ids = customer.priceListIds.length
    ? customer.priceListIds
    : customer.priceListId
      ? [customer.priceListId]
      : [];

  return [...new Set(ids)].map((objectId) => {
    const priceList = snapshotsById.get(objectId);
    const title =
      priceList?.displayName ||
      priceList?.name ||
      priceList?.title ||
      (customer.priceListId === objectId ? customer.priceListTitle : null) ||
      objectId;
    const details = [priceList?.brandName, priceList?.typeTitle || priceList?.typeCode]
      .filter(Boolean)
      .join(" - ");
    const label = details && !title.includes(details) ? `${title} - ${details}` : title;

    return {
      objectId,
      label,
      searchText: [
        title,
        priceList?.brandName,
        priceList?.typeTitle,
        priceList?.typeCode,
        priceList?.internalCode,
        priceList?.code,
      ]
        .filter(Boolean)
        .join(" "),
    };
  });
}

function getPaymentMethodTitle(customer: Customer | null | undefined): string | null {
  if (!customer) return null;
  return (
    customer.priceListTitle ||
    customer.saleType?.title ||
    customer.priceLists?.[0]?.name ||
    customer.priceLists?.[0]?.title ||
    null
  );
}

function getCustomerPaymentMethodSnapshot(
  customer: Customer | null | undefined,
  salesTypes: Array<{ objectId: string; title: string; internalCode: number | null; sepidarCode: number | null }>,
  selectedSalesTypeId?: string,
): PaymentMethodSnapshot | null {
  if (!customer) return null;
  const saleType = customer.saleType;
  const salesTypeObjectId = saleType?.objectId ?? null;
  const salesTypeTitle = saleType?.title ?? null;
  const salesTypeInternalCode = null;
  const salesTypeSepidarCode = saleType?.sepidarSaleTypeId ?? null;

  const selectedSalesType =
    selectedSalesTypeId
      ? salesTypes.find((item) => item.objectId === selectedSalesTypeId) || null
      : null;

  const matchedSalesType =
    selectedSalesType ||
    salesTypes.find((item) => item.objectId === salesTypeObjectId) ||
    salesTypes.find((item) => salesTypeInternalCode !== null && item.internalCode === salesTypeInternalCode) ||
    salesTypes.find((item) => salesTypeSepidarCode !== null && item.sepidarCode === salesTypeSepidarCode) ||
    salesTypes.find((item) => item.title === salesTypeTitle) ||
    null;

  const objectId = matchedSalesType?.objectId || salesTypeObjectId || null;
  const title = matchedSalesType?.title || salesTypeTitle || null;
  const internalCode = matchedSalesType?.internalCode ?? salesTypeInternalCode ?? null;
  const sepidarCode = matchedSalesType?.sepidarCode ?? salesTypeSepidarCode ?? null;
  if (!objectId && !title && internalCode === null && sepidarCode === null) {
    return null;
  }
  return { objectId, title, internalCode, sepidarCode };
}

function productIdentityLabel(product: Product): string {
  return [
    product.sepidarCode || product.sku || product.productObjectId || product.name,
    product.name,
    product.brandName || product.brand,
    product.unitPrice ? formatCurrency(product.unitPrice) : "",
    product.priceListConflict ? "تداخل روش پرداخت" : "",
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
