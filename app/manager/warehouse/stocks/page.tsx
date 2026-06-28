import { WarehouseStocksView } from "@/components/warehouse/warehouse-stocks-view";

export default function ManagerWarehouseStocksPage() {
  return (
    <WarehouseStocksView
      role="manager"
      basePath="/manager/warehouse/stocks"
    />
  );
}
