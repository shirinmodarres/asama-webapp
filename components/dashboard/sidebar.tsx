"use client";

import { sidebarIconMap } from "@/components/shared/app-icons";
import { Card } from "@/components/ui/card";
import type { SidebarItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { AsamaLogo } from "../branding/asama-logo";

interface SidebarProps {
  items: SidebarItem[];
  isMobile?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({
  items,
  isMobile = false,
  onClose,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const activeHref = getActiveItemHref(items, pathname);
  const groupedSections = useMemo(() => buildSidebarSections(items), [items]);
  const hasGroupedSections = groupedSections.some((section) => section.group);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >(() => readCollapsedGroups());

  const toggleGroup = (group: string) => {
    setCollapsedGroups((current) => {
      const next = { ...current, [group]: !current[group] };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "asama-sidebar-collapsed-groups",
          JSON.stringify(next),
        );
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        isMobile
          ? "fixed inset-y-0 right-0 z-50 w-[86vw] max-w-[320px] overflow-x-hidden p-4"
          : "hidden overflow-x-hidden xl:block xl:h-full xl:w-[300px] xl:basis-[300px] xl:shrink-0 xl:grow-0",
      )}
    >
      <div className={cn("w-full min-w-0", !isMobile && "xl:h-full")}>
        <Card className="flex h-[calc(100vh-2rem)] w-full min-w-0 flex-col overflow-hidden border-[#D7E0E8] bg-white p-5 xl:h-full">
          {/*  <div className="rounded-[20px] border border-[#DCE4EC] bg-[#102034] p-4 text-white shadow-[0_24px_60px_rgba(16,32,52,0.22)]">
           <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-white/70">
                  نقش فعال
                </p>
                <h2 className="mt-2 text-lg font-bold">{currentRole.title}</h2>
                <p className="mt-1 text-sm leading-7 text-white/72">
                  {currentRole.team}
                </p>
              </div>
              <Badge variant="success">دمو</Badge>
            </div> 

            <div className="mt-4 rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.08)] px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CircleUserRound className="size-4 text-[#A8D1AF]" />
                {currentRole.userName}
              </div>
              <p className="mt-2 text-xs leading-6 text-white/72">
                {currentRole.entrySummary}
              </p>
            </div>
          </div>
*/}
          <div className="flex min-w-0 shrink-0 items-center justify-between gap-3">
            <AsamaLogo compact className="h-12 max-w-[220px] min-w-0 flex-1 px-4" />
            {isMobile ? (
              <button
                type="button"
                aria-label="بستن منو"
                className="rounded-xl border border-[#E5E7EB] p-2 text-[#334155]"
                onClick={onClose}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <div className="mt-5 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* <p className="mb-3 px-1 text-[11px] font-semibold tracking-[0.16em] text-[#6B7280]">
              دسترسی ها
            </p> */}
            <nav className="grid min-w-0 gap-2 overflow-x-hidden">
              {hasGroupedSections
                ? groupedSections.map((section) => {
                    if (!section.group) {
                      return section.items.map((item) => (
                        <SidebarNavLink
                          key={item.href}
                          item={item}
                          isActive={activeHref === item.href}
                          onNavigate={onNavigate}
                        />
                      ));
                    }

                    const groupIsActive = section.items.some(
                      (item) => activeHref === item.href,
                    );
                    const isOpen =
                      groupIsActive || !collapsedGroups[section.group];
                    const GroupIcon = sidebarIconMap[section.icon];

                    return (
                      <div
                        key={section.group}
                        className="min-w-0 overflow-hidden rounded-2xl"
                      >
                        <button
                          type="button"
                          className={cn(
                            "flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 text-right transition-all duration-200",
                            groupIsActive
                              ? "bg-[#F3FAF4] text-[#102034]"
                              : "bg-transparent text-[#334155] hover:bg-white/80",
                          )}
                          aria-expanded={isOpen}
                          onClick={() => toggleGroup(section.group!)}
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-2.5">
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-[10px] border",
                                groupIsActive
                                  ? "border-[#6CAE75] bg-[#6CAE75] text-white"
                                  : "border-[#E2E8F0] bg-[#F8FBFD] text-[#1F3A5F]",
                              )}
                            >
                              <GroupIcon className="size-4" />
                            </span>
                            <span className="truncate text-sm font-bold">
                              {section.group}
                            </span>
                          </span>
                          <ChevronDown
                            className={cn(
                              "size-4 shrink-0 text-[#64748B] transition-transform",
                              isOpen && "rotate-180",
                            )}
                          />
                        </button>
                        {isOpen ? (
                          <div className="mt-1.5 grid min-w-0 gap-1 overflow-hidden pr-2">
                            {section.items.map((item) => (
                              <SidebarNavLink
                                key={item.href}
                                item={item}
                                isActive={activeHref === item.href}
                                onNavigate={onNavigate}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                : items.map((item) => (
                    <SidebarNavLink
                      key={item.href}
                      item={item}
                      isActive={activeHref === item.href}
                      onNavigate={onNavigate}
                    />
                  ))}
            </nav>
          </div>
          {/* <div className="mt-5 rounded-[18px] border border-[#E5EBF1] bg-[#F8FBFD] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1F3A5F]">
              <ActivitySquare className="size-4" />
              وضعیت سامانه
            </div>
            <p className="mt-2 text-xs leading-6 text-[#6B7280]">
              نسخه نمایشی فعال است و تمامی تغییرات فقط در حافظه محلی مرورگر نگه‌داری
              می‌شوند.
            </p>
          </div> */}
        </Card>
      </div>
    </aside>
  );
}

function SidebarNavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: SidebarItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = sidebarIconMap[item.icon];

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group block w-full min-w-0 overflow-hidden rounded-xl  px-3 py-2.5 transition-all duration-200",
        isActive
          ? "border-[#CFE3D3] bg-[#F3FAF4] shadow-[0_10px_24px_rgba(108,174,117,0.12)]"
          : "border-[#E2E8F0] bg-white/60 hover:border-[#DCE4EC] hover:bg-white",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px] border transition-colors",
            isActive
              ? "border-[#6CAE75] bg-[#6CAE75] text-white"
              : "border-[#E2E8F0] bg-[#F8FBFD] text-[#1F3A5F] group-hover:border-[#D1DAE4]",
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate text-sm font-semibold",
              isActive ? "text-[#102034]" : "text-[#334155]",
            )}
          >
            {item.label}
          </div>
          {item.description ? (
            <p className="mt-0.5 truncate text-[11px] leading-5 text-[#6B7280]">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function buildSidebarSections(items: SidebarItem[]) {
  const sections: Array<{
    group: string | null;
    icon: SidebarItem["icon"];
    items: SidebarItem[];
  }> = [];

  items.forEach((item) => {
    const group = item.group || null;
    const current = sections[sections.length - 1];
    if (current && current.group === group) {
      current.items.push(item);
      return;
    }
    sections.push({
      group,
      icon: item.icon,
      items: [item],
    });
  });

  return sections;
}

function readCollapsedGroups(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(
      "asama-sidebar-collapsed-groups",
    );
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function isSidebarItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/") return pathname === "/";
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}

function getActiveItemHref(
  items: SidebarItem[],
  pathname: string,
): string | null {
  const matches = items.filter((item) =>
    isSidebarItemActive(item.href, pathname),
  );

  if (matches.length === 0) {
    return null;
  }

  return matches.sort((a, b) => b.href.length - a.href.length)[0].href;
}
