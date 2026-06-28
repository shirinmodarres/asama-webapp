import { InventoryUnitsView } from "@/components/warehouse/inventory-units-view";

export default function ManagerWarehouseInventoryUnitsPage() {
  return (
    <InventoryUnitsView
      role="manager"
      title="ردیابی موجودی"
      subtitle="بررسی موجودی انبارها همراه با کدهای رهگیری و سریال‌ها"
    />
  );
}
