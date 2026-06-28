import { WarehouseStockDetailView } from "@/components/warehouse/warehouse-stock-detail-view";

export default function SupportWarehouseStockDetailPage() {
  return (
    <WarehouseStockDetailView
      role="support"
      listPath="/support/warehouse/stocks"
    />
  );
}
