"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { sidebarByRole } from "@/lib/navigation";
import type { AuthUser } from "@/lib/models/auth.model";
import type { RoleKey } from "@/lib/types";
import { logout } from "@/lib/services/auth.service";

interface HeaderProps {
  title: string;
  role: RoleKey;
  user: AuthUser;
  onMenuClick?: () => void;
}

export function Header({ title, role, user, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSection =
    sidebarByRole[role]
      .filter((item) => isActiveRoute(item.href, pathname))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null;
  const locationLabel = buildLocationLabel(
    role,
    currentSection?.label ?? title,
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <header className="sticky top-3 z-20 rounded-[20px] border border-[#DDE5ED] bg-white/95 px-3 py-3 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur sm:px-4 md:top-4 md:rounded-[22px] md:px-6 md:py-4 md:shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="باز کردن منو"
            className="shrink-0 rounded-[14px] xl:hidden"
            onClick={onMenuClick}
          >
            <Menu className="size-4 text-[#1F3A5F]" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-[#102034] sm:text-xl md:text-2xl">
              {title}
            </h1>
            <p className="mt-0.5 hidden truncate text-xs leading-6 text-[#6B7280] sm:block sm:text-sm md:mt-1 md:leading-7">
              {locationLabel}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end md:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[#D8E1EA] bg-[#F8FBFD] px-2.5 py-2 text-right sm:flex-none sm:gap-3 sm:px-3 sm:py-2.5">
            <Avatar>
              <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-right">
              <div className="truncate text-xs font-semibold text-[#102034] sm:text-sm">
                {user.fullName}
              </div>
              <div className="truncate text-[11px] text-[#6B7280] sm:text-xs">
                {user.roleLabel}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="اعلان ها"
            className="relative shrink-0 rounded-[14px]"
          >
            <Bell className="size-4 text-[#1F3A5F]" />
            <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-[#1F3A5F] px-1.5 py-0.5 text-[10px] font-semibold text-white">
              ۳
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="خروج از حساب"
            title="خروج از حساب"
            className="shrink-0 rounded-[14px]"
            onClick={handleLogout}
          >
            <LogOut className="size-4 text-[#8F2C2C]" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function isActiveRoute(itemHref: string, pathname: string): boolean {
  if (itemHref === "/") return pathname === "/";
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}

function buildLocationLabel(role: RoleKey, sectionLabel: string): string {
  return `${PANEL_LOCATION_LABELS[role]} / ${sectionLabel}`;
}

const PANEL_LOCATION_LABELS: Record<RoleKey, string> = {
  expert: "کارشناس",
  manager: "مدیریت",
  warehouse: "انبار",
  finance: "مالی",
  support: "پشتیبان",
  naja: "ناجا",
};
