"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ListFilter, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PanelRoleKey } from "@/lib/domain/roles";
import { formatNumber } from "@/lib/expert/utils";
import type { Product } from "@/lib/models/product.model";
import type { SepidarStock } from "@/lib/models/stock.model";
import type { WarehouseInventoryUnitRow } from "@/lib/models/warehouse.model";
import { listProducts } from "@/lib/services/product.service";
import { listStocks } from "@/lib/services/stock.service";
import { listWarehouseInventoryUnits } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

interface InventoryUnitsViewProps {
  role: Extract<PanelRoleKey, "support" | "manager" | "warehouse">;
  title: string;
  subtitle: string;
}

export function InventoryUnitsView({ role, title, subtitle }: InventoryUnitsViewProps) {
  const [rows, setRows] = useState<WarehouseInventoryUnitRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<SepidarStock[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [stockObjectId, setStockObjectId] = useState("all");
  const [productObjectId, setProductObjectId] = useState("all");
  const [trackingCode, setTrackingCode] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState("all");

  const loadRows = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [inventoryData, productData, stockData] = await Promise.all([
        listWarehouseInventoryUnits({
          stockObjectId: stockObjectId === "all" ? undefined : stockObjectId,
          productObjectId: productObjectId === "all" ? undefined : productObjectId,
          trackingCode: trackingCode.trim() || undefined,
          serialNumber: serialNumber.trim() || undefined,
          status: status === "all" ? undefined : status,
        }),
        listProducts(role === "support" ? "support" : "warehouse"),
        listStocks(),
      ]);
      setRows(inventoryData);
      setProducts(productData.filter((product) => product.isSyncedFromSepidar));
      setStocks(stockData);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadRows(), 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productOptions = useMemo(
    () => [
      { value: "all", label: "همه کالاها" },
      ...products.map((product) => ({
        value: product.objectId,
        label: `${formatFaDigits(product.sepidarCode || product.sku || "")} - ${product.name}`,
      })),
    ],
    [products],
  );

  const stockOptions = useMemo(
    () => [
      { value: "all", label: "همه انبارها" },
      ...stocks.map((stock) => ({
        value: stock.objectId,
        label: `${stock.code ? formatFaDigits(stock.code) + " - " : ""}${stock.title}`,
      })),
    ],
    [stocks],
  );

  const columns: DataTableColumn<WarehouseInventoryUnitRow>[] = [
    {
      key: "product",
      header: "کالا",
      render: (row) => (
        <div>
          <p className="font-semibold text-[#102034]">{row.productName || "-"}</p>
          <p className="mt-1 text-xs text-[#64748B]">{formatFaDigits(row.productSku || "-")}</p>
        </div>
      ),
    },
    { key: "stock", header: "انبار", render: (row) => row.stockTitle || "-" },
    { key: "real", header: "موجودی واقعی", render: (row) => formatNumber(row.realQuantity) },
    { key: "sales", header: "موجودی فروش", render: (row) => formatNumber(row.salesQuantity) },
    { key: "reserved", header: "رزرو شده", render: (row) => formatNumber(row.reservedQuantity) },
    {
      key: "units",
      header: "کدهای رهگیری",
      render: (row) => formatNumber(row.units.length),
    },
    {
      key: "actions",
      header: "جزئیات",
      render: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setExpanded((current) => ({
              ...current,
              [rowKey(row)]: !current[rowKey(row)],
            }))
          }
        >
          {expanded[rowKey(row)] ? <ChevronDown className="size-4" /> : <ChevronLeft className="size-4" />}
          نمایش کدها
        </Button>
      ),
    },
  ];

  const hasFilters =
    stockObjectId !== "all" ||
    productObjectId !== "all" ||
    status !== "all" ||
    Boolean(trackingCode || serialNumber);

  return (
    <DashboardLayout role={role} title={title}>
      <SectionHeader title="ردیابی موجودی انبار" description={subtitle} />

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>انبار</span>
            <SearchableSelect value={stockObjectId} onValueChange={setStockObjectId} options={stockOptions} placeholder="همه انبارها" searchPlaceholder="جستجو در انبارها" emptyMessage="انباری پیدا نشد" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>کالا</span>
            <SearchableSelect value={productObjectId} onValueChange={setProductObjectId} options={productOptions} placeholder="همه کالاها" searchPlaceholder="جستجو در کالاها" emptyMessage="کالایی پیدا نشد" normalizeSearch />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>کد رهگیری</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <Input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} className="pr-10" />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>سریال</span>
            <Input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#334155]">
            <span>وضعیت</span>
            <div className="relative">
              <ListFilter className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-[#6CAE75]" />
              <SearchableSelect
                value={status}
                onValueChange={setStatus}
                options={[
                  { value: "all", label: "همه وضعیت‌ها" },
                  { value: "in_stock", label: "موجود در انبار" },
                  { value: "dispatched", label: "خارج شده" },
                  { value: "delivered", label: "تحویل شده" },
                  { value: "returned", label: "برگشتی" },
                ]}
                placeholder="همه وضعیت‌ها"
                searchPlaceholder="جستجو در وضعیت‌ها"
                emptyMessage="وضعیتی پیدا نشد"
                triggerClassName="pr-10"
              />
            </div>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void loadRows()}>اعمال فیلتر</Button>
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStockObjectId("all");
                setProductObjectId("all");
                setTrackingCode("");
                setSerialNumber("");
                setStatus("all");
                window.setTimeout(() => void loadRows(), 0);
              }}
            >
              حذف فیلترها
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <LoadingState title="در حال دریافت کدهای رهگیری موجودی" />
      ) : error ? (
        <PageErrorMessage title="دریافت موجودی قابل ردیابی انجام نشد" message={error} />
      ) : rows.length ? (
        <div className="space-y-3">
          <DataTable columns={columns} rows={rows} rowKey={rowKey} />
          {rows.map((row) =>
            expanded[rowKey(row)] ? (
              <div key={`${rowKey(row)}-units`} className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
                <div className="border-b border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#102034]">
                  {row.productName} / {row.stockTitle}
                </div>
                <table className="min-w-full text-right text-sm">
                  <thead className="bg-[#F8FAFC] text-[#64748B]">
                    <tr>
                      <th className="px-3 py-2">کد رهگیری</th>
                      <th className="px-3 py-2">سریال</th>
                      <th className="px-3 py-2">شناسه کالا</th>
                      <th className="px-3 py-2">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.units.length ? row.units.map((unit) => (
                      <tr key={unit.objectId} className="border-t border-[#E5E7EB]">
                        <td className="px-3 py-2">{unit.trackingCode ? formatFaDigits(unit.trackingCode) : "-"}</td>
                        <td className="px-3 py-2">{unit.serialNumber ? formatFaDigits(unit.serialNumber) : "-"}</td>
                        <td className="px-3 py-2">{unit.productIdentifier ? formatFaDigits(unit.productIdentifier) : "-"}</td>
                        <td className="px-3 py-2"><Badge variant="neutral">{unit.statusLabel || unit.status}</Badge></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-[#64748B]">کدی برای این ردیف ثبت نشده است.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <EmptyState title="موجودی قابل ردیابی یافت نشد" description="با تغییر فیلترها دوباره جستجو کنید." />
      )}
    </DashboardLayout>
  );
}

function rowKey(row: WarehouseInventoryUnitRow) {
  return `${row.productObjectId || row.id}-${row.stockObjectId || "stock"}`;
}
