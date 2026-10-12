import { Card } from "@/components/ui/card";

export function OrderNoteCard({ notes }: { notes: string | null }) {
  if (!notes) return null;

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-[#1F3A5F]">توضیحات سفارش</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#334155]">
        {notes}
      </p>
    </Card>
  );
}
