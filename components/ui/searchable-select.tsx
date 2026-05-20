"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو...",
  emptyMessage = "موردی یافت نشد",
  disabled = false,
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideTrigger = rootRef.current?.contains(target);
      const clickedInsideMenu = menuRef.current?.contains(target);

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const gap = 6;
      const top = rect.bottom + gap;

      setMenuStyle({
        position: "fixed",
        top,
        left: rect.left,
        width: rect.width,
        zIndex: 120,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => {
          setOpen((current) => !current);
          setQuery("");
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-[14px] border border-[#D7DEE6] bg-white px-3.5 text-xs text-[#102034] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all outline-none hover:border-[#C4CFDB] focus:border-[#1F3A5F] focus:ring-4 focus:ring-[#1F3A5F]/8 disabled:cursor-not-allowed disabled:opacity-50",
          !selectedOption && "text-[#94A3B8]",
          triggerClassName,
        )}
      >
        <span className="truncate text-right">
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#6B7280] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="max-h-[340px] overflow-hidden rounded-2xl border border-[#D7DEE6] bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6B7280]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="pr-10 text-xs"
                  autoFocus
                />
              </div>

              <div className="mt-2 max-h-64 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  <div className="space-y-1">
                    {filteredOptions.map((option) => {
                      const isSelected = option.value === value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onValueChange(option.value);
                            setOpen(false);
                            setQuery("");
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-right text-xs transition-colors",
                            isSelected
                              ? "bg-[#F3F7FB] text-[#1F3A5F]"
                              : "text-[#334155] hover:bg-[#EFF4F8]",
                          )}
                        >
                          <span className="truncate">{option.label}</span>
                          {isSelected ? (
                            <Check className="size-4 shrink-0 text-[#1F3A5F]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-xs text-[#6B7280]">
                    {emptyMessage}
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
