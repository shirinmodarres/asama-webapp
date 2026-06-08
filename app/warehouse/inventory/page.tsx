import { StockInventoryView } from "@/components/warehouse/stock-inventory-view";

export default function WarehouseInventoryPage() {
  return (
    <StockInventoryView
      role="warehouse"
      title="موجودی"
      sectionTitle="موجودی انبارهای سپیدار"
      description="مشاهده موجودی واقعی، فروش و رزروشده هر کالا در انبارهای سپیدار"
    />
  );
}
