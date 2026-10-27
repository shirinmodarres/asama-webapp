"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageErrorMessage } from "@/components/shared/page-error-message";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/api-error";
import type { PanelRoleKey } from "@/lib/domain/roles";
import { formatDateTime, formatNumber } from "@/lib/expert/utils";
import type { WarehouseStockBrand, WarehouseStockKpis, WarehouseStockProductSummary, WarehouseStockProductUnitsPage, WarehouseStockUnitDetail } from "@/lib/models/warehouse.model";
import { getWarehouseStockUnitDetail, listWarehouseStockBrandProducts, listWarehouseStockBrands, listWarehouseStockProductUnits, listWarehouseStockUnitsByTrackingCode } from "@/lib/services/warehouse.service";
import { formatFaDigits } from "@/lib/utils/number-format";

interface WarehouseStockDetailViewProps {
  role: Extract<PanelRoleKey, "support" | "manager" | "warehouse">;
  listPath: string;
}

const UNBRANDED_KEY = "__unbranded";
const UNIT_PAGE_SIZE = 25;

export function WarehouseStockDetailView({ role, listPath }: WarehouseStockDetailViewProps) {
  const params = useParams<{ stockObjectId?: string }>();
  const stockObjectId = params.stockObjectId || "";
  const [detail, setDetail] = useState<WarehouseStockUnitDetail | null>(null);
  const [brands, setBrands] = useState<WarehouseStockBrand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [products, setProducts] = useState<WarehouseStockProductSummary[]>([]);
  const [brandKpis, setBrandKpis] = useState<WarehouseStockKpis | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [unitPages, setUnitPages] = useState<Record<string, WarehouseStockProductUnitsPage>>({});
  const [loadingUnits, setLoadingUnits] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState("");
  const [productsError, setProductsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingUnitsPage, setTrackingUnitsPage] = useState<WarehouseStockProductUnitsPage | null>(null);
  const [isSearchingTrackingCode, setIsSearchingTrackingCode] = useState(false);

  useEffect(() => {
    if (!stockObjectId) return;
    let mounted = true;
    const load = async () => {
      await Promise.resolve();
      if (!mounted) return;
      setIsLoading(true);
      setError("");
      try {
        const [nextDetail, nextBrands] = await Promise.all([
          getWarehouseStockUnitDetail(stockObjectId),
          listWarehouseStockBrands(stockObjectId),
        ]);
        if (!mounted) return;
        setDetail(nextDetail);
        setBrands(nextBrands);
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [stockObjectId]);

  useEffect(() => {
    if (!selectedBrandId || !stockObjectId) {
      return;
    }
    let mounted = true;
    const load = async () => {
      await Promise.resolve();
      if (!mounted) return;
      setIsLoadingProducts(true);
      setProductsError("");
      setExpandedProductId(null);
      setUnitPages({});
      try {
        const result = await listWarehouseStockBrandProducts(stockObjectId, selectedBrandId);
        if (!mounted) return;
        setProducts(result.products);
        setBrandKpis(result.kpis);
      } catch (loadError) {
        if (mounted) setProductsError(getErrorMessage(loadError));
      } finally {
        if (mounted) setIsLoadingProducts(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [selectedBrandId, stockObjectId]);

  const visibleProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => [product.productName, product.productCode].some((value) => value.toLowerCase().includes(term)));
  }, [products, searchTerm]);

  async function loadUnits(productObjectId: string, page: number) {
    setLoadingUnits((current) => ({ ...current, [productObjectId]: true }));
    try {
      const result = await listWarehouseStockProductUnits(stockObjectId, productObjectId, page, UNIT_PAGE_SIZE);
      setUnitPages((current) => ({ ...current, [productObjectId]: result }));
    } catch (loadError) {
      setProductsError(getErrorMessage(loadError));
    } finally {
      setLoadingUnits((current) => ({ ...current, [productObjectId]: false }));
    }
  }

  async function toggleProduct(product: WarehouseStockProductSummary) {
    if (expandedProductId === product.productObjectId) {
      setExpandedProductId(null);
      return;
    }
    setExpandedProductId(product.productObjectId);
    if (!unitPages[product.productObjectId]) await loadUnits(product.productObjectId, 1);
  }

  async function searchByTrackingCode(page = 1) {
    const value = trackingCode.trim();
    if (!value) {
      setTrackingUnitsPage(null);
      return;
    }
    setIsSearchingTrackingCode(true);
    setProductsError("");
    try {
      setTrackingUnitsPage(await listWarehouseStockUnitsByTrackingCode(stockObjectId, value, page, UNIT_PAGE_SIZE));
    } catch (loadError) {
      setProductsError(getErrorMessage(loadError));
    } finally {
      setIsSearchingTrackingCode(false);
    }
  }

  if (isLoading) return <DashboardLayout role={role} title="جزئیات انبار"><LoadingState title="در حال دریافت انبار" /></DashboardLayout>;
  if (error || !detail) return <DashboardLayout role={role} title="جزئیات انبار"><PageErrorMessage title="دریافت انبار انجام نشد" message={error || "انبار پیدا نشد."} /></DashboardLayout>;

  return (
    <DashboardLayout role={role} title="جزئیات انبار">
      <div className="space-y-5">
        <SectionHeader title={detail.stock.title || "انبار"} description={`کد انبار: ${detail.stock.code ? formatFaDigits(detail.stock.code) : "-"}`} actions={<Button asChild variant="outline"><Link href={listPath}>بازگشت به انبارها</Link></Button>} />
        <KpiGrid title="خلاصه موجودی انبار" kpis={detail.kpis} />
        <Card className="p-4">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); void searchByTrackingCode(); }}>
            <label className="grid flex-1 gap-2 text-sm font-medium text-[#334155]">
              <span>جستجوی کد رهگیری در این انبار</span>
              <Input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="کد رهگیری را وارد کنید" />
            </label>
            <Button type="submit" disabled={isSearchingTrackingCode || !trackingCode.trim()}><Search className="size-4" />جستجو</Button>
          </form>
          {trackingUnitsPage || isSearchingTrackingCode ? <div className="mt-4 rounded-xl border border-[#EEF2F6]"><UnitTable unitsPage={trackingUnitsPage || undefined} isLoading={isSearchingTrackingCode} onPageChange={(page) => void searchByTrackingCode(page)} /></div> : null}
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#102034]">برندهای موجود</h2><p className="mt-1 text-sm text-[#64748B]">ابتدا برند را انتخاب کنید تا محصولات همان برند نمایش داده شود.</p></div><Badge variant="neutral">{formatNumber(brands.length)} برند</Badge></div>
          {brands.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{brands.map((brand) => { const key = brand.brandObjectId || UNBRANDED_KEY; const selected = selectedBrandId === key; return <button key={key} type="button" onClick={() => setSelectedBrandId(key)} className={`rounded-xl border p-4 text-right transition ${selected ? "border-[#21446E] bg-[#F2F7FC] shadow-sm" : "border-[#E5E7EB] bg-white hover:border-[#9DB5CE]"}`}><div className="flex items-center justify-between gap-3"><span className="font-semibold text-[#102034]">{brand.brandName}</span><Badge variant={selected ? "brand" : "neutral"}>{formatNumber(brand.productCount)} کالا</Badge></div><p className="mt-3 text-sm text-[#64748B]">موجودی واقعی: {formatNumber(brand.realQuantity)}</p></button>; })}</div> : <EmptyState title="برندی در این انبار یافت نشد" description="برای این انبار موجودی محصولی ثبت نشده است." />}
        </Card>
        {selectedBrandId ? <section className="space-y-4">{brandKpis ? <KpiGrid title="خلاصه موجودی برند" kpis={brandKpis} /> : null}<Card className="p-4"><div className="relative"><Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#6CAE75]" /><Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="جستجوی نام یا کد کالا" className="pr-10" /></div></Card>{isLoadingProducts ? <LoadingState title="در حال دریافت محصولات برند" /> : productsError ? <PageErrorMessage title="دریافت محصولات انجام نشد" message={productsError} /> : visibleProducts.length ? <div className="space-y-3">{visibleProducts.map((product) => <ProductSummaryCard key={product.productObjectId} product={product} unitsPage={unitPages[product.productObjectId]} isOpen={expandedProductId === product.productObjectId} isLoadingUnits={Boolean(loadingUnits[product.productObjectId])} onToggle={() => void toggleProduct(product)} onPageChange={(page) => void loadUnits(product.productObjectId, page)} />)}</div> : <EmptyState title="محصولی برای این برند یافت نشد" description="محصولی با این عبارت یا برند در انبار پیدا نشد." />}</section> : null}
      </div>
    </DashboardLayout>
  );
}

function KpiGrid({ title, kpis }: { title: string; kpis: WarehouseStockKpis }) {
  const items = [["موجودی واقعی", kpis.realQuantity], ["رزرو شده", kpis.reservedQuantity], ["قابل فروش", kpis.availableForSale], ["خارج شده از انبار", kpis.exitedQuantity]] as const;
  return <Card className="p-5"><h2 className="mb-4 text-lg font-bold text-[#102034]">{title}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map(([label, value]) => <div key={label} className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFE] p-4"><p className="text-sm text-[#64748B]">{label}</p><p className="mt-2 text-2xl font-bold text-[#102034]">{formatNumber(value)}</p></div>)}</div></Card>;
}

function ProductSummaryCard({ product, unitsPage, isOpen, isLoadingUnits, onToggle, onPageChange }: { product: WarehouseStockProductSummary; unitsPage?: WarehouseStockProductUnitsPage; isOpen: boolean; isLoadingUnits: boolean; onToggle: () => void; onPageChange: (page: number) => void }) {
  return (
    <Card className={`overflow-hidden border-[#DDE6F0] shadow-sm transition-shadow hover:shadow-md ${isOpen ? "border-[#9DB8D5]" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full flex-col gap-4 p-4 text-right transition-colors hover:bg-[#F8FBFD] sm:p-5 lg:flex-row lg:items-center"
      >
        <div className="min-w-0 flex-1 lg:pl-3">
          <p className="truncate text-base font-bold text-[#102034] sm:text-lg">{product.productName || "-"}</p>
          <p className="mt-1 text-sm text-[#64748B]">کد کالا: {formatFaDigits(product.productCode || "-")}</p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[560px]">
          <Metric label="واقعی" value={product.realQuantity} />
          <Metric label="رزرو" value={product.reservedQuantity} />
          <Metric label="قابل فروش" value={product.availableForSale} />
          <Metric label="خارج شده" value={product.exitedQuantity} />
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center self-start rounded-full border border-[#DDE6F0] bg-white text-[#24466B] lg:self-auto" aria-hidden="true">
          {isOpen ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
        </span>
      </button>
      {isOpen ? <UnitTable unitsPage={unitsPage} isLoading={isLoadingUnits} onPageChange={onPageChange} /> : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex min-h-[68px] min-w-0 flex-col justify-center rounded-xl border border-[#E7EDF4] bg-[#F7F9FC] px-3 py-2.5 text-center sm:px-4">
      <span className="truncate text-xs font-medium text-[#718096]">{label}</span>
      <strong className="mt-1 text-lg font-bold leading-tight text-[#102034]">{formatNumber(value)}</strong>
    </span>
  );
}

function UnitTable({ unitsPage, isLoading, onPageChange }: { unitsPage?: WarehouseStockProductUnitsPage; isLoading: boolean; onPageChange: (page: number) => void }) {
  if (isLoading && !unitsPage) return <div className="border-t border-[#EEF2F6] p-5"><LoadingState title="در حال دریافت واحدها" /></div>;
  if (!unitsPage?.units.length) return <div className="border-t border-[#EEF2F6] p-5"><EmptyState title="واحدی ثبت نشده است" description="برای این محصول unit قابل نمایش وجود ندارد." /></div>;
  const { pagination } = unitsPage;
  const hasProductDetails = unitsPage.units.some((unit) => unit.productName || unit.productCode);
  return <div className="border-t border-[#EEF2F6]"><div className="overflow-x-auto"><table className="min-w-full text-right"><thead className="bg-[#F8FBFD] text-xs font-semibold text-[#5B6B7F]"><tr>{[...(hasProductDetails ? ["کالا"] : []), "کد رهگیری", "سریال", "شناسه کالا", "وضعیت", "کد رسید ورود", "تاریخ ثبت"].map((header) => <th key={header} className="whitespace-nowrap px-5 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#EEF2F6] text-sm text-[#334155]">{unitsPage.units.map((unit) => <tr key={unit.objectId} className="hover:bg-[#F8FBFD]">{hasProductDetails ? <td className="px-5 py-3"><p>{unit.productName || "-"}</p><p className="mt-1 text-xs text-[#64748B]">{formatFaDigits(unit.productCode || "-")}</p></td> : null}<td className="whitespace-nowrap px-5 py-3">{formatFaDigits(unit.trackingCode || "-")}</td><td className="whitespace-nowrap px-5 py-3">{formatFaDigits(unit.serialNumber || "-")}</td><td className="whitespace-nowrap px-5 py-3">{formatFaDigits(unit.productIdentifier || "-")}</td><td className="whitespace-nowrap px-5 py-3">{unit.statusLabel || unit.status || "-"}</td><td className="whitespace-nowrap px-5 py-3">{unit.inboundReceiptCode ? formatFaDigits(unit.inboundReceiptCode) : "-"}</td><td className="whitespace-nowrap px-5 py-3">{unit.createdAt ? formatDateTime(unit.createdAt) : "-"}</td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 p-4"><span className="text-sm text-[#64748B]">صفحه {formatNumber(pagination.page)} از {formatNumber(pagination.totalPages)}، {formatNumber(pagination.total)} واحد</span><div className="flex gap-2"><Button type="button" size="icon" variant="outline" disabled={pagination.page <= 1 || isLoading} onClick={() => onPageChange(pagination.page - 1)} aria-label="صفحه قبلی"><ChevronRight className="size-4" /></Button><Button type="button" size="icon" variant="outline" disabled={pagination.page >= pagination.totalPages || isLoading} onClick={() => onPageChange(pagination.page + 1)} aria-label="صفحه بعدی"><ChevronLeft className="size-4" /></Button></div></div></div>;
}
