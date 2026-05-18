import { formatNumber } from "@/lib/expert/utils";
import type { ExitSlipItemGroup } from "@/lib/models/warehouse.model";
import { formatFaDigits } from "@/lib/utils/number-format";

interface ExitSlipProductGroupsProps {
  items: ExitSlipItemGroup[];
}

export function ExitSlipProductGroups({ items }: ExitSlipProductGroupsProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <section
          key={item.productObjectId || item.productSku || item.productName}
          className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="کالا" value={item.productName || "-"} />
            <Info
              label="کد کالا"
              value={item.productSku ? formatFaDigits(item.productSku) : "-"}
            />
            <Info label="تعداد" value={formatNumber(item.quantity)} />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="min-w-full border-collapse text-right text-sm">
              <thead>
                <tr className="bg-[#F8FBFD] text-[#1F3A5F]">
                  {["ردیف", "شناسه محصول", "سریال", "کد رهگیری"].map(
                    (header) => (
                      <th key={header} className="px-3 py-2 font-semibold">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {item.units.map((unit, index) => (
                  <tr
                    key={unit.unitObjectId || `${item.productSku}-${index}`}
                    className="border-t border-[#E5E7EB]"
                  >
                    <td className="px-3 py-2">{formatNumber(index + 1)}</td>
                    <td className="px-3 py-2">
                      {unit.productIdentifier
                        ? formatFaDigits(unit.productIdentifier)
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {unit.serialNumber ? formatFaDigits(unit.serialNumber) : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {unit.trackingCode ? formatFaDigits(unit.trackingCode) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#1F3A5F]">{value}</dd>
    </div>
  );
}
