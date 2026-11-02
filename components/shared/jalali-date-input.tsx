"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
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
  id?: string;
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
const JALALI_YEARS = Array.from({ length: 201 }, (_, index) => 1300 + index);

export function JalaliDateInput({
  id,
  value,
  onChange,
  label = "تاریخ",
  error,
  placeholder = "انتخاب تاریخ سفارش",
  disabled = false,
}: JalaliDateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({
    top: 0,
    right: 0,
  });
  const triggerRef = useRef<HTMLInputElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const [year, month] = jalaliPartsFromIso(value) ?? todayJalaliParts();
    return { year, month };
  });
  const selectedParts = jalaliPartsFromIso(value);
  const displayValue = isoToJalaliDisplay(value);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !event.defaultPrevented &&
        !event
          .composedPath()
          .some(
            (node) =>
              node instanceof HTMLElement &&
              node.dataset?.jalaliDateInputPopover === "true",
          )
      ) {
        if (!target) return;
        const popover = document.querySelector(
          '[data-jalali-date-input-popover="true"]',
        );
        const trigger = document.querySelector(
          '[data-jalali-date-input-trigger="true"]',
        );
        if (
          popover &&
          !popover.contains(target) &&
          trigger &&
          !trigger.contains(target)
        ) {
          setIsOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

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

  const updatePopoverPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const estimatedWidth = Math.min(viewportWidth - 16, 20 * 16);
    const measuredHeight = popoverRef.current?.offsetHeight ?? 0;
    const estimatedHeight = Math.max(measuredHeight, 22 * 16);
    const spacing = 8;
    const viewportMargin = 8;

    const spaceBelow = viewportHeight - rect.bottom - viewportMargin;
    const spaceAbove = rect.top - viewportMargin;
    const openBelow = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;

    const top = openBelow
      ? Math.min(rect.bottom + spacing, viewportHeight - estimatedHeight - viewportMargin)
      : Math.max(rect.top - estimatedHeight - spacing, viewportMargin);

    const right = clamp(
      viewportWidth - rect.right,
      viewportMargin,
      viewportWidth - estimatedWidth - viewportMargin,
    );

    setPopoverPosition({
      top: Math.max(top, viewportMargin),
      right,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePopoverPosition();
    // Reposition once after paint so the measured popover height can refine placement.
    const frame = window.requestAnimationFrame(() => {
      updatePopoverPosition();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, visibleMonth.year, visibleMonth.month]);

  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => updatePopoverPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, visibleMonth.year, visibleMonth.month]);

  const handleSelectDay = (day: number) => {
    onChange(jalaliToIso(visibleMonth.year, visibleMonth.month, day));
    setIsOpen(false);
  };

  const openCalendar = (element: HTMLInputElement) => {
    triggerRef.current = element;
    updatePopoverPosition();
    setIsOpen(true);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const calendarPopover =
    isOpen && !disabled && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              ref={popoverRef}
              data-jalali-date-input-popover="true"
              className="fixed z-[9999] w-[min(92vw,20rem)] rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg max-h-[calc(100vh-1rem)] overflow-y-auto"
              style={{
                top: popoverPosition.top,
                right: popoverPosition.right,
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
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
                <div className="grid grid-cols-2 gap-2">
                  <CalendarDropdown
                    value={String(visibleMonth.month)}
                    options={JALALI_MONTHS.map((month, index) => ({
                      value: String(index + 1),
                      label: month,
                    }))}
                    placeholder="ماه"
                    onValueChange={(value) => {
                      const month = Number(value);
                      if (month >= 1 && month <= 12) {
                        setVisibleMonth((current) => ({ ...current, month }));
                      }
                    }}
                  />
                  <CalendarDropdown
                    value={String(visibleMonth.year)}
                    options={JALALI_YEARS.map((year) => ({
                      value: String(year),
                      label: formatFaDigits(String(year)),
                    }))}
                    placeholder="سال"
                    onValueChange={(value) => {
                      const year = Number(value);
                      if (Number.isInteger(year)) {
                        setVisibleMonth((current) => ({ ...current, year }));
                      }
                    }}
                  />
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
          </>,
          document.body,
        )
      : null;

  return (
    <div className="grid gap-2 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
        <Input
          id={id}
          ref={triggerRef}
          data-jalali-date-input-trigger="true"
          value={displayValue}
          readOnly
          disabled={disabled}
          onFocus={(event) => openCalendar(event.currentTarget)}
          onClick={(event) => openCalendar(event.currentTarget)}
          placeholder={placeholder}
          className="cursor-pointer pr-10 text-sm sm:text-base"
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
        {calendarPopover}
      </div>
      <FieldError message={error} />
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function CalendarDropdown({
  value,
  options,
  placeholder,
  onValueChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  onValueChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-9 w-full min-w-24 items-center justify-between gap-2 rounded-lg border border-[#D7DEE6] bg-white px-2 text-xs text-[#102034]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selectedLabel || placeholder}</span>
        <ChevronDown className="size-3.5 text-[#6B7280]" />
      </button>
      {isOpen ? (
        <div
          role="listbox"
          className="absolute top-full right-0 z-20 mt-1 max-h-52 w-full min-w-28 overflow-y-auto rounded-lg border border-[#D7DEE6] bg-white p-1 shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full rounded-md px-2 py-2 text-right text-xs transition-colors ${
                option.value === value
                  ? "bg-[#F3F7FB] text-[#1F3A5F]"
                  : "text-[#334155] hover:bg-[#EFF4F8]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
