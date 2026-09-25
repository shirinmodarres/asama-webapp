"use client";

import { use } from "react";
import { GeneratedPriceListDetailView } from "@/app/support/pricing/generated-price-lists/[id]/page";

export default function ManagerPriceListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <GeneratedPriceListDetailView
      id={id}
      role="manager"
      backHref="/manager/pricing/price-lists"
    />
  );
}
