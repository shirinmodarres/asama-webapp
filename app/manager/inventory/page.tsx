import { StockInventoryView } from "@/components/warehouse/stock-inventory-view";

export default function ManagerInventoryPage() {
  return (
    <StockInventoryView
      role="manager"
      title="موجودی"
      sectionTitle="موجودی انبارهای سپیدار"
      description="مقایسه موجودی واقعی، فروش، رزروشده و قابل فروش انبارها"
    />
  );
}
