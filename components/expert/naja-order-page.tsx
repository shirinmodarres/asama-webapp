"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Landmark, PackageSearch } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
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
import { createNajaOrder } from "@/lib/services/naja.service";
import { listOrderProductsBySaleType } from "@/lib/services/product.service";
import type { RoleKey } from "@/lib/types";
import { formatFaDigits, normalizeDigits, normalizePhone, toNumber } from "@/lib/utils/number-format";
import {
  formatOrderAvailableQuantity,
  logOrderDropdownProductSource,
} from "@/lib/utils/order-product-availability";
import { POSITIVE_NUMBER_MESSAGE } from "@/lib/utils/form-validation";

interface NajaOrderPageProps {
  role?: RoleKey;
}

export function NajaOrderPage({ role = "naja" }: NajaOrderPageProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
  const [createdByName, setCreatedByName] = useState(
    getStoredCurrentUser()?.fullName ||
      getStoredCurrentUser()?.username ||
      "کارشناس ناجا",
  );
  const [error, setError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
  const selectedProduct =
    products.find((product) => product.objectId === productId) ?? null;
  const totalAmount = selectedProduct ? selectedProduct.unitPrice * quantity : 0;

  useEffect(() => {
    let isMounted = true;

    async function loadAssignment() {
      setSelectedAssignment(null);
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
  }, [customerObjectId]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setProducts([]);
      setProductId("");
      setError("");
      const saleTypeId = selectedCustomer?.saleType?.sepidarSaleTypeId;
      if (!hasAssignmentInventory(selectedCustomer) || !saleTypeId) {
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);
      try {
        const data = await listOrderProductsBySaleType(saleTypeId, {
          customerObjectId: selectedCustomer.objectId,
          expertUserId: getStoredCurrentUser()?.objectId,
        });
        if (isMounted) {
          setProducts(data);
          if (process.env.NODE_ENV === "development") {
            console.debug(
              "[NajaOrderForm] assignment product availability",
              data.map((product) => ({
                productObjectId: product.objectId,
                productName: product.name,
                availableQuantity: product.availableSalesQuantity,
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
  }, [selectedCustomer]);

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.objectId,
        label: [
          customer.sepidarCustomerCode || customer.id,
          customer.fullName,
          customer.saleType?.title ? `نوع فروش: ${customer.saleType.title}` : "",
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
          label: `${product.sepidarCode || product.sku} - ${product.name} - قیمت ${formatCurrency(product.unitPrice)} - موجودی قابل فروش ${formatOrderAvailableQuantity(product, formatFaDigits)} ${product.unit}`,
        };
      }),
    [products],
  );

  const handleSubmit = async () => {
    setError("");
    setFieldErrors({});
    const nextErrors: Record<string, string> = {};

    if (!customerObjectId) {
      nextErrors.customerObjectId = "لطفاً مشتری/مرکز ناجا را انتخاب کنید.";
    }
    if (customerObjectId && !hasAssignmentInventory(selectedCustomer)) {
      nextErrors.customerObjectId =
        "برای این مشتری تنظیمات فروش تعریف نشده است.";
    }
    if (!productId) nextErrors.productId = "لطفاً کالا را انتخاب کنید.";
    if (!productId) nextErrors.items = "حداقل یک کالا به سفارش اضافه کنید.";
    if (!recipientFirstName.trim()) {
      nextErrors.recipientFirstName = "نام الزامی است.";
    }
    if (!recipientLastName.trim()) {
      nextErrors.recipientLastName = "نام خانوادگی الزامی است.";
    }
    if (!recipientNationalId.trim()) {
      nextErrors.recipientNationalId = "کد ملی الزامی است.";
    }
    if (!recipientMobile.trim()) {
      nextErrors.recipientMobile = "شماره موبایل الزامی است.";
    }
    if (!najaOrderNumber.trim()) {
      nextErrors.najaOrderNumber = "شماره سفارش الزامی است.";
    }

    const requestedQuantity = toNumber(quantity);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      nextErrors.quantity = POSITIVE_NUMBER_MESSAGE;
    } else if (
      selectedProduct?.hasAvailableSalesQuantity &&
      requestedQuantity > selectedProduct.availableSalesQuantity
    ) {
      nextErrors.quantity = "موجودی قابل فروش کافی نیست";
    }
    if (selectedProduct && selectedProduct.unitPrice <= 0) {
      nextErrors.productId = "قیمت کالا برای این نوع فروش ثبت نشده است.";
    }
    if (!createdByName.trim()) {
      nextErrors.createdByName = "این فیلد الزامی است.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedCustomer || !selectedProduct) return;

    setIsSubmitting(true);
    try {
      const order = await createNajaOrder({
        orderType: "naja",
        createdByName: createdByName.trim(),
        expertUserId: getStoredCurrentUser()?.objectId || undefined,
        customerObjectId,
        saleTypeObjectId: selectedCustomer.saleType?.objectId || undefined,
        sepidarSaleTypeId: selectedCustomer.saleType?.sepidarSaleTypeId ?? undefined,
        recipientFirstName: recipientFirstName.trim(),
        recipientLastName: recipientLastName.trim(),
        recipientNationalId: normalizeDigits(recipientNationalId.trim()),
        recipientMobile: normalizePhone(recipientMobile.trim()),
        najaOrderNumber: normalizeDigits(najaOrderNumber.trim()),
        items: [
          {
            productObjectId: productId,
            quantity: requestedQuantity,
            unitPrice: selectedProduct.unitPrice,
            priceNoteItemId: selectedProduct.priceNoteItemId,
          },
        ],
      });
      router.refresh();
      router.push(`/naja/orders/${order.objectId}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
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
              description="فهرست مشتری‌های اختصاص‌یافته از سرور دریافت می‌شود."
            />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>مشتری/مرکز ناجا از سپیدار</span>
              <div className="relative">
                <Landmark className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <SearchableSelect
                  value={customerObjectId}
                  onValueChange={(value) => {
                    setCustomerObjectId(value);
                    setSelectedAssignment(null);
                    setAssignmentError("");
                    setFieldErrors((current) => ({
                      ...current,
                      customerObjectId: "",
                      productId: "",
                    }));
                  }}
                  options={customerOptions}
                  placeholder="انتخاب مشتری/مرکز ناجا از سپیدار"
                  searchPlaceholder="جستجو در مشتری‌های اختصاص‌یافته"
                  emptyMessage="مشتری اختصاص‌یافته‌ای پیدا نشد"
                  triggerClassName="pr-10"
                  invalid={Boolean(fieldErrors.customerObjectId)}
                />
                <FieldError message={fieldErrors.customerObjectId} />
                {assignmentError ? (
                  <FieldError message="برای این مشتری تنظیمات فروش تعریف نشده است." />
                ) : null}
              </div>
            </label>

            {customers.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[#DDEAE0] bg-[#FBFCFD] p-4 text-sm leading-7 text-[#6B7280] md:col-span-2">
                هنوز مشتری‌ای به شما اختصاص داده نشده است.
              </div>
            ) : null}

            {selectedCustomer ? (
              <div className="rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] p-4 text-sm leading-7 text-[#334155] md:col-span-2">
                <p className="font-semibold text-[#102034]">اطلاعات مشتری انتخاب‌شده</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <span>نام مرکز/مشتری: {selectedCustomer.fullName || "-"}</span>
                  <span>
                    کد مشتری سپیدار:{" "}
                    {selectedCustomer.sepidarCustomerCode
                      ? formatFaDigits(selectedCustomer.sepidarCustomerCode)
                      : "-"}
                  </span>
                  <span>نوع فروش: {selectedCustomer.saleType?.title || "-"}</span>
                </div>
                {getAllowedStockTitles(selectedCustomer).length ? (
                  <div className="mt-3 rounded-xl border border-[#DDEAE0] bg-[#F3FAF4] p-3 text-xs leading-6 text-[#2F6B3A]">
                    انبارهای مجاز:{" "}
                    {getAllowedStockTitles(selectedCustomer).join("، ")}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-[#F3D9A4] bg-[#FFF8E6] p-3 text-xs leading-6 text-[#8A5A00]">
                    برای این مشتری تنظیمات فروش تعریف نشده است.
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-[18px] border border-[#DDEAE0] bg-[#F3FAF4] p-4 text-sm leading-7 text-[#2F6B3A] md:col-span-2">
              موجودی قابل فروش بر اساس انبارهای مجاز تخصیص این مشتری از سرور
              دریافت می‌شود.
            </div>

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>کالا</span>
              <div className="relative">
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
                    selectedCustomer
                      ? "انتخاب کالا"
                      : "ابتدا مرکز/مشتری را انتخاب کنید."
                  }
                  searchPlaceholder="جستجو در کالاها"
                  emptyMessage={
                    selectedCustomer?.saleType?.sepidarSaleTypeId
                      ? "کالایی با موجودی قابل فروش پیدا نشد."
                      : "ابتدا مرکز/مشتری را انتخاب کنید."
                  }
                  disabled={
                    !selectedCustomer ||
                    !hasAssignmentInventory(selectedCustomer) ||
                    isLoadingAssignment ||
                    isLoadingProducts
                  }
                  triggerClassName="pr-10"
                  invalid={Boolean(fieldErrors.productId)}
                />
                <FieldError message={fieldErrors.productId} />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>تعداد</span>
              <Input
                inputMode="numeric"
                min={1}
                max={
                  selectedProduct?.hasAvailableSalesQuantity
                    ? selectedProduct.availableSalesQuantity
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
              <span>شماره موبایل</span>
              <Input
                inputMode="tel"
                value={recipientMobile}
                onChange={(event) => {
                  setRecipientMobile(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    recipientMobile: "",
                  }));
                }}
                aria-invalid={Boolean(fieldErrors.recipientMobile)}
              />
              <FieldError message={fieldErrors.recipientMobile} />
            </label>

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
              کد کالا: {formatFaDigits(selectedProduct.sepidarCode || selectedProduct.sku)}
              {selectedProduct.barcode
                ? ` • بارکد: ${formatFaDigits(selectedProduct.barcode)}`
                : ""}
              {" • "}
              قیمت واحد: {formatCurrency(selectedProduct.unitPrice)}
              {" • "}
              موجودی قابل فروش:{" "}
              {formatOrderAvailableQuantity(
                selectedProduct,
                formatFaDigits,
              )}{" "}
              {selectedProduct.unit}
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
                !hasAssignmentInventory(selectedCustomer) ||
                customers.length === 0
              }
            >
              ثبت سفارش ناجا
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </Card>

        <OrderSummaryCard
          customerName={selectedCustomer?.fullName || "ثبت نشده"}
          itemCount={selectedProduct ? 1 : 0}
          totalQuantity={selectedProduct ? quantity : 0}
          totalAmount={totalAmount}
          status="pending_approval"
          warehouseStatus="reserved"
          saleTypeTitle={selectedCustomer?.saleType?.title}
          stockTitles={
            selectedCustomer ? getAllowedStockTitles(selectedCustomer) : []
          }
        />
      </section>
    </DashboardLayout>
  );
}

function hasAssignmentInventory(customer: Customer | null | undefined): boolean {
  return Boolean(
    customer?.saleType?.sepidarSaleTypeId &&
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
