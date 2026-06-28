"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { FieldError } from "@/components/shared/field-error";
import { Input } from "@/components/ui/input";
import { isoToJalaliDisplay, jalaliDisplayToIso } from "@/lib/utils/jalali-date";

interface JalaliDateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export function JalaliDateInput({
  value,
  onChange,
  label = "تاریخ",
  error,
}: JalaliDateInputProps) {
  const [displayValue, setDisplayValue] = useState(isoToJalaliDisplay(value));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDisplayValue(isoToJalaliDisplay(value));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [value]);

  return (
    <label className="grid gap-2 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
        <Input
          value={displayValue}
          onChange={(event) => {
            const nextDisplay = event.target.value;
            setDisplayValue(nextDisplay);
            const iso = jalaliDisplayToIso(nextDisplay);
            if (iso) onChange(iso);
            if (!nextDisplay.trim()) onChange("");
          }}
          placeholder="۱۴۰۳/۰۲/۰۱"
          inputMode="numeric"
          className="pr-10"
          aria-invalid={Boolean(error)}
        />
      </div>
      <FieldError message={error} />
    </label>
  );
}
