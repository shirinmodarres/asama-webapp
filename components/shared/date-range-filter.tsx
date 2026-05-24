"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DateRangeValue {
  from?: string | null;
  to?: string | null;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  label?: string;
  placeholder?: string;
}

export function DateRangeFilter({
  value,
  onChange,
  label = "بازه زمانی",
  placeholder = "انتخاب بازه زمانی",
}: DateRangeFilterProps) {
  const containerRef = useRef<HTMLLabelElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(value.from ?? "");
  const [draftTo, setDraftTo] = useState(value.to ?? "");

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const displayText = formatRangeLabel(value, placeholder);

  return (
    <label
      ref={containerRef}
      className="relative grid w-full gap-2 text-sm font-medium text-[#334155] xl:w-56"
    >
      <span>{label}</span>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-[#D8E1EA] bg-white px-3 text-right text-sm text-[#334155] transition-colors hover:border-[#C8D3DF]"
        onClick={() => {
          if (!isOpen) {
            setDraftFrom(value.from ?? "");
            setDraftTo(value.to ?? "");
          }
          setIsOpen(!isOpen);
        }}
      >
        <span className={value.from || value.to ? "" : "text-[#64748B]"}>
          {displayText}
        </span>
        <CalendarDays className="size-4 shrink-0 text-[#6CAE75]" />
      </button>

      {isOpen ? (
        <div className="absolute top-full right-0 z-[120] mt-2 w-[280px] rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="grid gap-3">
            <label className="grid gap-2 text-xs font-medium text-[#334155]">
              <span>از تاریخ</span>
              <Input
                type="date"
                value={draftFrom}
                onChange={(event) => setDraftFrom(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-xs font-medium text-[#334155]">
              <span>تا تاریخ</span>
              <Input
                type="date"
                value={draftTo}
                onChange={(event) => setDraftTo(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDraftFrom("");
                setDraftTo("");
                onChange({ from: null, to: null });
                setIsOpen(false);
              }}
            >
              پاک کردن
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onChange({
                  from: draftFrom || null,
                  to: draftTo || null,
                });
                setIsOpen(false);
              }}
            >
              اعمال
            </Button>
          </div>
        </div>
      ) : null}
    </label>
  );
}

function formatRangeLabel(
  value: DateRangeValue,
  placeholder: string,
): string {
  const from = value.from ? formatFaDate(value.from) : "";
  const to = value.to ? formatFaDate(value.to) : "";

  if (from && to) return `از ${from} تا ${to}`;
  if (from) return `از ${from}`;
  if (to) return `تا ${to}`;
  return placeholder;
}

function formatFaDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
