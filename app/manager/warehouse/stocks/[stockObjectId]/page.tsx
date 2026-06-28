import { WarehouseStockDetailView } from "@/components/warehouse/warehouse-stock-detail-view";

export default function ManagerWarehouseStockDetailPage() {
  return (
    <WarehouseStockDetailView
      role="manager"
      listPath="/manager/warehouse/stocks"
    />
  );
}
