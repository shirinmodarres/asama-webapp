"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
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
  invalid?: boolean;
  normalizeSearch?: boolean;
  highlightMatches?: boolean;
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
  invalid = false,
  normalizeSearch = false,
  highlightMatches = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  const closeMenu = ({ restoreFocus = false } = {}) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  };

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearch
      ? normalizeSearchValue(query)
      : query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const searchable = [
        option.label,
        option.description,
        option.searchText,
      ]
        .filter(Boolean)
        .join(" ");
      const normalizedSearchable = normalizeSearch
        ? normalizeSearchValue(searchable)
        : searchable.toLowerCase();

      return normalizedSearchable.includes(normalizedQuery);
    });
  }, [normalizeSearch, options, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideTrigger = rootRef.current?.contains(target);
      const clickedInsideMenu = menuRef.current?.contains(target);

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const updateMenuPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const gap = 6;
    const viewportPadding = 12;
    const maxMenuHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const spaceAbove = rect.top - gap - viewportPadding;
    const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      160,
      Math.min(maxMenuHeight, openAbove ? spaceAbove : spaceBelow),
    );

    setMenuStyle({
      position: "fixed",
      top: openAbove ? undefined : rect.bottom + gap,
      bottom: openAbove ? window.innerHeight - rect.top + gap : undefined,
      left: rect.left,
      width: rect.width,
      maxHeight: availableHeight,
      zIndex: 120,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !menuStyle) return;
    searchInputRef.current?.focus({ preventScroll: true });
  }, [menuStyle, open]);

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => {
          setOpen((current) => {
            const nextOpen = !current;
            if (nextOpen) updateMenuPosition();
            return nextOpen;
          });
          setQuery("");
        }}
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-[14px] border border-[#D7DEE6] bg-white px-3.5 text-xs text-[#102034] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all outline-none hover:border-[#C4CFDB] focus:border-[#1F3A5F] focus:ring-4 focus:ring-[#1F3A5F]/8 disabled:cursor-not-allowed disabled:opacity-50",
          invalid &&
            "border-red-400 focus:border-red-500 focus:ring-red-200",
          !selectedOption && "text-[#94A3B8]",
          triggerClassName,
        )}
        data-invalid={invalid || undefined}
      >
        <span className="min-w-0 flex-1 truncate text-right">
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#6B7280] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="overflow-hidden rounded-2xl border border-[#D7DEE6] bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6B7280]" />
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    const firstOption = filteredOptions[0];
                    if (!firstOption) return;
                    event.preventDefault();
                    onValueChange(firstOption.value);
                    closeMenu({ restoreFocus: true });
                  }}
                  placeholder={searchPlaceholder}
                  className="pr-10 text-xs"
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
                            closeMenu({ restoreFocus: true });
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-right text-xs transition-colors",
                            isSelected
                              ? "bg-[#F3F7FB] text-[#1F3A5F]"
                              : "text-[#334155] hover:bg-[#EFF4F8]",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">
                              {highlightMatches
                                ? renderHighlightedText(
                                    option.label,
                                    query,
                                    normalizeSearch,
                                  )
                                : option.label}
                            </span>
                            {option.description ? (
                              <span className="mt-1 block truncate text-[11px] text-[#64748B]">
                                {highlightMatches
                                  ? renderHighlightedText(
                                      option.description,
                                      query,
                                      normalizeSearch,
                                    )
                                  : option.description}
                              </span>
                            ) : null}
                          </span>
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

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizeSearchValue(value: string): string {
  return value
    .replace(/[۰-۹٠-٩]/g, (digit) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(digit);
      if (persianIndex >= 0) return String(persianIndex);

      const arabicIndex = ARABIC_DIGITS.indexOf(digit);
      return arabicIndex >= 0 ? String(arabicIndex) : digit;
    })
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/[\s\-_–—]+/g, "");
}

function renderHighlightedText(
  text: string,
  query: string,
  shouldNormalize: boolean,
): ReactNode {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return text;

  if (!shouldNormalize) {
    const index = text.toLowerCase().indexOf(trimmedQuery.toLowerCase());
    if (index < 0) return text;
    return renderHighlightedRange(text, index, index + trimmedQuery.length);
  }

  const normalizedQuery = normalizeSearchValue(trimmedQuery);
  if (!normalizedQuery) return text;

  const { normalized, rawIndices } = buildNormalizedIndex(text);
  const normalizedIndex = normalized.indexOf(normalizedQuery);
  if (normalizedIndex < 0) return text;

  const start = rawIndices[normalizedIndex];
  const end =
    rawIndices[normalizedIndex + normalizedQuery.length - 1] + 1;
  return renderHighlightedRange(text, start, end);
}

function buildNormalizedIndex(text: string): {
  normalized: string;
  rawIndices: number[];
} {
  let normalized = "";
  const rawIndices: number[] = [];

  Array.from(text).forEach((char, index) => {
    const normalizedChar = normalizeSearchValue(char);
    if (!normalizedChar) return;
    normalized += normalizedChar;
    rawIndices.push(index);
  });

  return { normalized, rawIndices };
}

function renderHighlightedRange(
  text: string,
  start: number,
  end: number,
): ReactNode {
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-[#FEF3C7] px-0.5 text-inherit">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}
