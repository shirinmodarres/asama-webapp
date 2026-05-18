"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderSummaryCard } from "@/components/shared/order-summary-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatNumber } from "@/lib/expert/utils";
import type { NajaCenter } from "@/lib/models/naja-center.model";
import type { Product } from "@/lib/models/product.model";
import type { Warehouse } from "@/lib/models/warehouse.model";
import type { RoleKey } from "@/lib/types";
import { listNajaCenters } from "@/lib/services/naja-center.service";
import { createNajaOrder } from "@/lib/services/naja.service";
import {
  getWarehouseInventory,
  listWarehouses,
} from "@/lib/services/warehouse.service";
import {
  formatFaDigits,
  normalizeDigits,
  normalizePhone,
  toNumber,
} from "@/lib/utils/number-format";
import { ChevronLeft, Landmark, PackageSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface NajaOrderPageProps {
  role?: RoleKey;
}

export function NajaOrderPage({ role = "naja" }: NajaOrderPageProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [centers, setCenters] = useState<NajaCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [centerObjectId, setCenterObjectId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [najaExpertName, setNajaExpertName] = useState("کارشناس مرادی");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError("");

      try {
        const [warehouseData, centerData] = await Promise.all([
          listWarehouses(),
          listNajaCenters(),
        ]);
        if (!isMounted) return;
        const najaWarehouses = warehouseData.filter(
          (warehouse) =>
            warehouse.status !== "inactive" &&
            (warehouse.type === "naja" ||
              warehouse.allowedOrderTypes.includes("naja")),
        );
        setWarehouses(najaWarehouses);
        setCenters(centerData);
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

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      if (!warehouseId) {
        setProducts([]);
        return;
      }
      setError("");
      try {
        const data = await getWarehouseInventory({
          warehouseId,
          orderType: "naja",
        });
        if (isMounted) setProducts(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [warehouseId]);

  const selectedProduct = products.find((product) => product.objectId === productId);
  const selectedCenter = centers.find((center) => center.objectId === centerObjectId) ?? null;
  const selectedProductStock = selectedProduct
    ? getProductStockForWarehouse(selectedProduct, warehouseId)
    : 0;
  const totalAmount = selectedProduct ? selectedProduct.unitPrice * quantity : 0;

  const productOptions = useMemo(
    () =>
      products
        .filter((product) => getProductStockForWarehouse(product, warehouseId) > 0)
        .map((product) => ({
          value: product.objectId,
          label: `${product.name} - موجودی ناجا ${formatNumber(getProductStockForWarehouse(product, warehouseId))} ${product.unit}`,
        })),
    [products, warehouseId],
  );
  const warehouseOptions = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        value: warehouse.objectId,
        label: warehouse.name,
      })),
    [warehouses],
  );

  const centerOptions = useMemo(
    () =>
      centers
        .filter((center) => center.status === "active")
        .map((center) => ({
          value: center.objectId,
          label: `${center.name} - ${formatFaDigits(center.centerCode)}`,
        })),
    [centers],
  );

  const handleSubmit = async () => {
    setError("");

    if (!centerObjectId) {
      setError("مرکز ناجا را انتخاب کنید.");
      return;
    }
    if (!warehouseId) {
      setError("انبار ناجا را انتخاب کنید.");
      return;
    }

    if (!productId) {
      setError("کالای ناجا را انتخاب کنید.");
      return;
    }

    if (!selectedProduct) {
      setError("کالای ناجا معتبر نیست.");
      return;
    }

    const requestedQuantity = toNumber(quantity);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      setError("تعداد سفارش باید بیشتر از صفر باشد.");
      return;
    }

    if (requestedQuantity > selectedProductStock) {
      setError("موجودی ناجا برای این سفارش کافی نیست.");
      return;
    }

    if (!customerName.trim() || !nationalId.trim() || !phoneNumber.trim()) {
      setError("اطلاعات مشتری را کامل وارد کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createNajaOrder({
        createdByName: najaExpertName.trim(),
        customerName: customerName.trim(),
        customerNationalId: normalizeDigits(nationalId.trim()),
        customerPhone: normalizePhone(phoneNumber),
        centerObjectId,
        warehouseId,
        productObjectId: productId,
        quantity: requestedQuantity,
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
              description="فهرست مراکز و کالاهای ناجا از سرور دریافت می شود."
            />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>انتخاب مرکز ناجا</span>
              <div className="relative">
                <Landmark className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <SearchableSelect
                  value={centerObjectId}
                  onValueChange={setCenterObjectId}
                  options={centerOptions}
                  placeholder="انتخاب مرکز ناجا"
                  searchPlaceholder="جستجو در مراکز ناجا"
                  emptyMessage="مرکز فعالی پیدا نشد"
                  triggerClassName="pr-10"
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>انبار ناجا</span>
              <SearchableSelect
                value={warehouseId}
                onValueChange={(value) => {
                  setWarehouseId(value);
                  setProductId("");
                }}
                options={warehouseOptions}
                placeholder="انتخاب انبار ناجا"
                searchPlaceholder="جستجو در انبارها"
                emptyMessage="انبار ناجا پیدا نشد"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>کالای ناجا</span>
              <div className="relative">
                <PackageSearch className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <SearchableSelect
                  value={productId}
                  onValueChange={setProductId}
                  options={productOptions}
                  placeholder="انتخاب کالا از موجودی ناجا"
                  searchPlaceholder="جستجو در کالاهای ناجا"
                  emptyMessage="کالای دارای موجودی ناجا پیدا نشد"
                  triggerClassName="pr-10"
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>تعداد</span>
              <Input
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(toNumber(event.target.value))}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>نام ثبت کننده / کارشناس ناجا</span>
              <Input
                value={najaExpertName}
                onChange={(event) => setNajaExpertName(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>نام مشتری</span>
              <Input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>کد ملی</span>
              <Input
                value={nationalId}
                onChange={(event) => setNationalId(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155] md:col-span-2">
              <span>شماره موبایل</span>
              <Input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </label>
          </div>

          {selectedProduct || selectedCenter ? (
            <div className="mt-5 rounded-[18px] border border-[#E7EDF3] bg-[#FBFCFD] px-4 py-3 text-sm leading-7 text-[#6B7280]">
              {selectedCenter ? `مرکز انتخاب شده: ${selectedCenter.name} (${formatFaDigits(selectedCenter.centerCode)})` : ""}
              {selectedCenter && selectedProduct ? " • " : ""}
              {selectedProduct
                ? `موجودی ناجا: ${formatNumber(selectedProductStock)} ${selectedProduct.unit} • قیمت واحد: ${formatCurrency(selectedProduct.unitPrice)}`
                : ""}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button type="button" variant="success" onClick={handleSubmit} disabled={isSubmitting || isLoading}>
              ثبت سفارش ناجا
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
          customerName={customerName || "ثبت نشده"}
          itemCount={selectedProduct ? 1 : 0}
          totalQuantity={selectedProduct ? quantity : 0}
          totalAmount={totalAmount}
          status="approved"
          warehouseStatus="awaitingNajaDetails"
        />
      </section>
    </DashboardLayout>
  );
}

function getProductStockForWarehouse(product: Product, warehouseId: string): number {
  const inventory = product.inventories.find(
    (entry) => entry.warehouseId === warehouseId && entry.warehouseType === "naja",
  );
  return inventory?.availableStock ?? product.najaInventoryQty;
}
