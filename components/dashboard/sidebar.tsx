"use client";

import { sidebarIconMap } from "@/components/shared/app-icons";
import { Card } from "@/components/ui/card";
import type { SidebarItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <aside
      className={cn(
        isMobile
          ? "fixed inset-y-0 right-0 z-50 w-[86vw] max-w-[320px] p-4"
          : "hidden w-full xl:block xl:max-w-[300px] xl:shrink-0",
      )}
    >
      <div className={cn(!isMobile && "xl:sticky xl:top-6")}>
        <Card className="flex h-[calc(100vh-2rem)] flex-col overflow-hidden border-[#D7E0E8] bg-[linear-gradient(180deg,rgba(252,253,255,0.98),rgba(246,249,252,0.98))] p-5 xl:h-[calc(100vh-3rem)]">
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
          <div className="flex shrink-0 items-center justify-between gap-3">
            <AsamaLogo compact className="h-12 w-[220px] px-4" />
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
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* <p className="mb-3 px-1 text-[11px] font-semibold tracking-[0.16em] text-[#6B7280]">
              دسترسی ها
            </p> */}
            <nav className="grid gap-2">
              {items.map((item) => {
                const isActive = activeHref === item.href;
                const Icon = sidebarIconMap[item.icon];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group rounded-2xl border px-4 py-3 transition-all duration-200",
                      isActive
                        ? "border-[#D2E6D6] bg-[linear-gradient(180deg,rgba(243,250,244,1),rgba(255,255,255,1))] shadow-[0_16px_32px_rgba(108,174,117,0.12)]"
                        : "border-transparent bg-transparent hover:border-[#DCE4EC] hover:bg-white",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex size-10 items-center justify-center rounded-[12px] border transition-colors",
                          isActive
                            ? "border-[#D2E6D6] bg-[#6CAE75] text-white"
                            : "border-[#E2E8F0] bg-[#F8FBFD] text-[#1F3A5F] group-hover:border-[#D1DAE4]",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "text-sm font-semibold",
                            isActive ? "text-[#102034]" : "text-[#334155]",
                          )}
                        >
                          {item.label}
                        </div>
                        {item.description ? (
                          <p className="mt-1 text-xs leading-6 text-[#6B7280]">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
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
