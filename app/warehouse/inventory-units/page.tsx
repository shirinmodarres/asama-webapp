import { InventoryUnitsView } from "@/components/warehouse/inventory-units-view";

export default function WarehouseInventoryUnitsPage() {
  return (
    <InventoryUnitsView
      role="warehouse"
      title="ردیابی موجودی"
      subtitle="مشاهده موجودی کالاها همراه با کد رهگیری، سریال و شناسه کالا"
    />
  );
}
