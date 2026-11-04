import { Card } from "@/components/ui/card";
import {
  getManualOrderNotes,
  getSalesRequestDiscountNote,
} from "@/lib/utils/order-financial-display";

export function OrderNoteCard({ notes }: { notes: string | null }) {
  if (!notes) return null;
  const discountNote = getSalesRequestDiscountNote(notes);
  const manualNotes = getManualOrderNotes(notes);

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-[#1F3A5F]">توضیحات سفارش</h3>
      {discountNote ? (
        <p className="mt-3 rounded-xl border border-[#E8EEF4] bg-[#FBFCFD] px-3 py-2 text-sm font-semibold text-[#102034]">
          تخفیف سفارش: {discountNote}
        </p>
      ) : null}
      {manualNotes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#334155]">
          {manualNotes}
        </p>
      ) : null}
    </Card>
  );
}
