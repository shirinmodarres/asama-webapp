"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getJalaliMonthLength,
  isoToJalaliDisplay,
  jalaliPartsFromIso,
  jalaliToIso,
  todayJalaliParts,
} from "@/lib/utils/jalali-date";
import { formatFaDigits } from "@/lib/utils/number-format";

interface JalaliDateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export function JalaliDateInput({
  value,
  onChange,
  label = "تاریخ",
  error,
  placeholder = "انتخاب تاریخ سفارش",
  disabled = false,
}: JalaliDateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const [year, month] = jalaliPartsFromIso(value) ?? todayJalaliParts();
    return { year, month };
  });
  const selectedParts = jalaliPartsFromIso(value);
  const displayValue = isoToJalaliDisplay(value);

  const calendarDays = useMemo(() => {
    const firstDayIso = jalaliToIso(visibleMonth.year, visibleMonth.month, 1);
    const firstDay = new Date(`${firstDayIso}T00:00:00Z`).getUTCDay();
    const startOffset = (firstDay + 1) % 7;
    const daysInMonth = getJalaliMonthLength(
      visibleMonth.year,
      visibleMonth.month,
    );
    return [
      ...Array.from({ length: startOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [visibleMonth]);

  const moveMonth = (delta: number) => {
    setVisibleMonth((current) => {
      const monthIndex = current.month - 1 + delta;
      const nextYear = current.year + Math.floor(monthIndex / 12);
      const nextMonth = ((monthIndex % 12) + 12) % 12;
      return { year: nextYear, month: nextMonth + 1 };
    });
  };

  const handleSelectDay = (day: number) => {
    onChange(jalaliToIso(visibleMonth.year, visibleMonth.month, day));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <label className="grid gap-2 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
        <Input
          value={displayValue}
          readOnly
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          className="cursor-pointer pr-10"
          aria-invalid={Boolean(error)}
          aria-expanded={isOpen}
        />
        {value && !disabled ? (
          <button
            type="button"
            aria-label="پاک کردن تاریخ"
            onClick={handleClear}
            className="absolute top-1/2 left-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"
          >
            <X className="size-4" />
          </button>
        ) : null}
        {isOpen && !disabled ? (
          <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveMonth(-1)}
                aria-label="ماه قبل"
              >
                <ChevronRight className="size-4" />
              </Button>
              <div className="text-sm font-semibold text-[#1F3A5F]">
                {JALALI_MONTHS[visibleMonth.month - 1]}{" "}
                {formatFaDigits(String(visibleMonth.year))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveMonth(1)}
                aria-label="ماه بعد"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#64748B]">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday} className="py-1 font-semibold">
                  {weekday}
                </span>
              ))}
              {calendarDays.map((day, index) =>
                day ? (
                  <button
                    key={`${visibleMonth.year}-${visibleMonth.month}-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`flex h-9 items-center justify-center rounded-lg text-sm transition ${
                      selectedParts?.[0] === visibleMonth.year &&
                      selectedParts?.[1] === visibleMonth.month &&
                      selectedParts?.[2] === day
                        ? "bg-[#1F3A5F] text-white"
                        : "text-[#334155] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    {formatFaDigits(String(day))}
                  </button>
                ) : (
                  <span key={`empty-${index}`} />
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
      <FieldError message={error} />
    </label>
  );
}
