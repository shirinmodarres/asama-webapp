"use client";

import { ActivePriceListsView } from "@/app/manager/pricing/price-lists/page";

export default function FinanceActivePriceListsPage() {
  return <ActivePriceListsView role="finance" basePath="/finance/pricing/price-lists" />;
}
