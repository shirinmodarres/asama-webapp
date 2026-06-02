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
import type { Warehouse } from "@/lib/models/warehouse.model";
import { getStoredCurrentUser } from "@/lib/services/auth.service";
import { listAssignedCustomersForExpert } from "@/lib/services/expert-customer.service";
import { createNajaOrder } from "@/lib/services/naja.service";
import { listOrderProductsBySaleType } from "@/lib/services/product.service";
import { listWarehouses } from "@/lib/services/warehouse.service";
import type { RoleKey } from "@/lib/types";
import { formatFaDigits, toNumber } from "@/lib/utils/number-format";
import { POSITIVE_NUMBER_MESSAGE, SELECT_REQUIRED_MESSAGE } from "@/lib/utils/form-validation";

interface NajaOrderPageProps {
  role?: RoleKey;
}

export function NajaOrderPage({ role = "naja" }: NajaOrderPageProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerObjectId, setCustomerObjectId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [createdByName, setCreatedByName] = useState(
    getStoredCurrentUser()?.fullName ||
      getStoredCurrentUser()?.username ||
      "کارشناس ناجا",
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError("");
      try {
        const [warehouseData, customerData] = await Promise.all([
          listWarehouses(),
          listAssignedCustomersForExpert(getStoredCurrentUser()?.objectId),
        ]);
        if (!isMounted) return;
        const najaWarehouses = warehouseData.filter(
          (warehouse) =>
            warehouse.status !== "inactive" &&
            (warehouse.type === "naja" ||
              warehouse.allowedOrderTypes.includes("naja")),
        );
        setWarehouses(najaWarehouses);
        setCustomers(customerData);
        const defaultWarehouse =
          najaWarehouses.find((warehouse) => warehouse.isDefault) ??
          najaWarehouses[0];
        if (defaultWarehouse) setWarehouseId(defaultWarehouse.objectId);
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

  const selectedCustomer =
    customers.find((customer) => customer.objectId === customerObjectId) ?? null;
  const selectedProduct =
    products.find((product) => product.objectId === productId) ?? null;
  const totalAmount = selectedProduct ? selectedProduct.unitPrice * quantity : 0;

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setProducts([]);
      setProductId("");
      setError("");
      const saleTypeId = selectedCustomer?.saleType?.sepidarSaleTypeId;
      if (!selectedCustomer || !saleTypeId) {
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);
      try {
        const data = await listOrderProductsBySaleType(saleTypeId);
        if (isMounted) setProducts(data);
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
      products.map((product) => ({
        value: product.objectId,
        label: `${product.sepidarCode || product.sku} - ${product.name} - قیمت ${formatCurrency(product.unitPrice)}`,
      })),
    [products],
  );

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        value: warehouse.objectId,
        label: warehouse.name,
      })),
    [warehouses],
  );

  const handleSubmit = async () => {
    setError("");
    setFieldErrors({});
    const nextErrors: Record<string, string> = {};

    if (!customerObjectId) {
      nextErrors.customerObjectId = "لطفاً مشتری/مرکز ناجا را انتخاب کنید.";
    }
    if (selectedCustomer && !selectedCustomer.saleType?.sepidarSaleTypeId) {
      nextErrors.customerObjectId = "برای این مشتری نوع فروش مشخص نشده است.";
    }
    if (!warehouseId) nextErrors.warehouseId = SELECT_REQUIRED_MESSAGE;
    if (!productId) nextErrors.productId = "لطفاً کالا را انتخاب کنید.";

    const requestedQuantity = toNumber(quantity);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      nextErrors.quantity = POSITIVE_NUMBER_MESSAGE;
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
        warehouseId,
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
              description="فهرست مشتری‌های اختصاص‌یافته و انبارهای ناجا از سرور دریافت می‌شود."
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
              </div>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>انبار ناجا</span>
              <SearchableSelect
                value={warehouseId}
                onValueChange={(value) => {
                  setWarehouseId(value);
                  setFieldErrors((current) => ({
                    ...current,
                    warehouseId: "",
                  }));
                }}
                options={warehouseOptions}
                placeholder="انتخاب انبار ناجا"
                searchPlaceholder="جستجو در انبارها"
                emptyMessage="انبار ناجا پیدا نشد"
                invalid={Boolean(fieldErrors.warehouseId)}
              />
              <FieldError message={fieldErrors.warehouseId} />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>کالای ناجا</span>
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
                  searchPlaceholder="جستجو در کالاهای ناجا"
                  emptyMessage={
                    selectedCustomer?.saleType?.sepidarSaleTypeId
                      ? "برای نوع فروش انتخاب‌شده قیمتی ثبت نشده است."
                      : "ابتدا مرکز/مشتری را انتخاب کنید."
                  }
                  disabled={
                    !selectedCustomer ||
                    !selectedCustomer.saleType?.sepidarSaleTypeId ||
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
                isLoadingProducts ||
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
          status="pending"
          warehouseStatus="reserved"
        />
      </section>
    </DashboardLayout>
  );
}
