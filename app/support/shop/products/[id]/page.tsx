"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/api-error";
import type { WebsiteProduct } from "@/lib/models/shop.model";
import { getWebsiteProduct } from "@/lib/services/shop-admin.service";
import {
  formatFaCurrency,
  formatFaDigits,
  formatFaNumber,
} from "@/lib/utils/number-format";

export default function WebsiteProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<WebsiteProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getWebsiteProduct(params.id);
        if (isMounted) setProduct(data);
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  return (
    <DashboardLayout role="support" title="جزئیات محصول سایت">
      {isLoading ? (
        <LoadingState title="در حال دریافت محصول سایت" />
      ) : error ? (
        <InlineErrorMessage message={error} />
      ) : !product ? (
        <EmptyState
          title="محصول سایت پیدا نشد"
          description="شناسه محصول معتبر نیست یا رکوردی برای آن وجود ندارد."
        />
      ) : (
        <>
          <SectionHeader
            title={product.title}
            description="جزئیات محصول منتشرشده در فروشگاه عمومی"
            actions={
              <>
                <Button asChild variant="outline">
                  <Link href="/support/shop/products">
                    بازگشت به محصولات
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/support/shop/products/${product.objectId}/edit`}>
                    ویرایش محصول
                  </Link>
                </Button>
              </>
            }
          />
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="SKU" value={formatFaDigits(product.sku) || "-"} />
                <Info label="اسلاگ" value={product.slug || "-"} />
                <Info label="دسته‌بندی" value={product.category || "-"} />
                <Info label="برند" value={product.brand || "-"} />
                <Info label="قیمت سایت (ریال)" value={formatFaCurrency(product.price)} />
                <Info
                  label="قیمت ویژه (ریال)"
                  value={
                    product.salePrice === null
                      ? "-"
                      : formatFaCurrency(product.salePrice)
                  }
                />
                <Info
                  label="موجودی سایت"
                  value={formatFaNumber(product.websiteStock)}
                />
                <Info
                  label="رزروشده"
                  value={formatFaNumber(product.reservedStock)}
                />
                <Info
                  label="قابل فروش"
                  value={formatFaNumber(product.availableStock)}
                />
                <Info
                  label="حداکثر تعداد سفارش"
                  value={
                    product.maxOrderQuantity === null
                      ? "-"
                      : formatFaNumber(product.maxOrderQuantity)
                  }
                />
                <Info
                  label="وزن (گرم)"
                  value={
                    product.weight === null ? "-" : formatFaNumber(product.weight)
                  }
                />
                <Info
                  label="طول (سانتی‌متر)"
                  value={
                    product.dimensions.length === null
                      ? "-"
                      : formatFaNumber(product.dimensions.length)
                  }
                />
                <Info
                  label="عرض (سانتی‌متر)"
                  value={
                    product.dimensions.width === null
                      ? "-"
                      : formatFaNumber(product.dimensions.width)
                  }
                />
                <Info
                  label="ارتفاع (سانتی‌متر)"
                  value={
                    product.dimensions.height === null
                      ? "-"
                      : formatFaNumber(product.dimensions.height)
                  }
                />
              </div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-[#334155]">
                <p>
                  <span className="font-semibold">توضیح کوتاه: </span>
                  {product.shortDescription || "-"}
                </p>
                <p>
                  <span className="font-semibold">توضیحات: </span>
                  {product.description || "-"}
                </p>
                {product.keyFeaturesForSite.length ? (
                  <p>
                    <span className="font-semibold">ویژگی‌های کلیدی: </span>
                    {product.keyFeaturesForSite.join("، ")}
                  </p>
                ) : null}
                {product.technicalSpecsNote ? (
                  <p>
                    <span className="font-semibold">یادداشت مشخصات فنی: </span>
                    {product.technicalSpecsNote}
                  </p>
                ) : null}
              </div>
              <div className="mt-6">
                <h3 className="text-base font-semibold text-[#102034]">
                  جدول مشخصات محصول
                </h3>
                {product.specifications.length ? (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-[#E5E7EB]">
                    <table className="min-w-full divide-y divide-[#E5E7EB] text-sm">
                      <thead className="bg-[#F8FAFC] text-[#64748B]">
                        <tr>
                          <th className="px-3 py-2 text-right font-medium">عنوان</th>
                          <th className="px-3 py-2 text-right font-medium">مقدار</th>
                          <th className="px-3 py-2 text-right font-medium">واحد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB] bg-white">
                        {product.specifications.map((item) => (
                          <tr key={`${item.title}-${item.sortOrder}`}>
                            <td className="px-3 py-2 font-medium text-[#102034]">
                              {item.title}
                            </td>
                            <td className="px-3 py-2 text-[#334155]">
                              {formatFaDigits(item.value)}
                            </td>
                            <td className="px-3 py-2 text-[#64748B]">
                              {item.unit || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl border border-dashed border-[#D7DEE6] p-4 text-sm text-[#64748B]">
                    مشخصات فنی برای این محصول ثبت نشده است.
                  </p>
                )}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={product.isActive ? "success" : "neutral"}>
                  {product.isActive ? "فعال" : "غیرفعال"}
                </Badge>
                <Badge variant={product.isFeatured ? "brand" : "neutral"}>
                  {product.isFeatured ? "ویژه" : "عادی"}
                </Badge>
              </div>
              <div className="mt-5 grid gap-3">
                {product.images.length ? (
                  product.images.map((image) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={image}
                      src={image}
                      alt={product.title}
                      className="aspect-video w-full rounded-xl border border-[#E5E7EB] object-cover"
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[#D7DEE6] p-6 text-center text-sm text-[#64748B]">
                    تصویری ثبت نشده است.
                  </div>
                )}
              </div>
            </Card>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#64748B]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#102034]">{value}</dd>
    </div>
  );
}
