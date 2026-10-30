import { formatCurrency } from "@/lib/expert/utils";
import type { Order } from "@/lib/models/order.model";
import {
  getOrderDisplayDiscountAmount,
  getSalesRequestDiscountNote,
} from "@/lib/utils/order-financial-display";
import { calculateSalesRequestFinancials } from "@/lib/utils/sales-request-financials";

/** A compact, read-only financial view shared by order lists. */
export function OrderFinancialAmounts({ order }: { order: Order }) {
  const totalAmount = order.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0,
  );
  const discountAmount = Number(order.salesRequestDiscountTotal || 0);
  const displayDiscountAmount = getOrderDisplayDiscountAmount({
    totalAmount,
    storedDiscountAmount: discountAmount,
    notes: order.notes,
  });
  const financials = calculateSalesRequestFinancials(
    totalAmount,
    totalAmount > 0 ? (displayDiscountAmount / totalAmount) * 100 : 0,
  );
  const discountNote = getSalesRequestDiscountNote(order.notes);

  return (
    <dl className="space-y-1 whitespace-nowrap text-xs leading-5">
      <Amount label="مبلغ کل" value={formatCurrency(totalAmount)} />
      <Amount
        label="تخفیف سفارش"
        value={displayDiscountAmount > 0 ? formatCurrency(displayDiscountAmount) : discountNote || "-"}
      />
      <Amount label="مبلغ با مالیات" value={formatCurrency(financials.total)} />
    </dl>
  );
}

function Amount({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="font-medium text-[#102034]">{value}</dd>
    </div>
  );
}
