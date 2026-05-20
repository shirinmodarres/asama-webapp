"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { LoadingState } from "@/components/shared/loading-state";
import { getPanelRouteForRole } from "@/lib/domain/roles";
import { sidebarByRole } from "@/lib/navigation";
import type { AuthUser } from "@/lib/models/auth.model";
import { getStoredCurrentUser, getStoredSessionToken, me } from "@/lib/services/auth.service";
import type { RoleKey } from "@/lib/types";

interface DashboardLayoutProps {
  role: RoleKey;
  title: string;
  children: ReactNode;
}

export function DashboardLayout({ role, title, children }: DashboardLayoutProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function ensureAuth() {
      const sessionToken = getStoredSessionToken();
      if (!sessionToken) {
        router.replace("/");
        return;
      }

      const storedUser = getStoredCurrentUser();
      if (storedUser) {
        if (getPanelRouteForRole(storedUser.role) !== `/${role}`) {
          router.replace(getPanelRouteForRole(storedUser.role));
          return;
        }
        if (isMounted) {
          setCurrentUser(storedUser);
          setIsCheckingAuth(false);
        }
        return;
      }

      try {
        const response = await me();
        if (!isMounted) return;
        if (getPanelRouteForRole(response.user.role) !== `/${role}`) {
          router.replace(getPanelRouteForRole(response.user.role));
          return;
        }
        setCurrentUser(response.user);
      } catch {
        if (isMounted) router.replace("/");
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    }

    ensureAuth();

    return () => {
      isMounted = false;
    };
  }, [role, router]);

  if (isCheckingAuth || !currentUser) {
    return (
      <div className="mx-auto max-w-[1540px] px-4 py-6 xl:px-6">
        <LoadingState
          title="در حال بررسی دسترسی"
          description="اطلاعات کاربر و دسترسی پنل در حال دریافت است."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1540px] flex-col gap-6 px-4 py-5 xl:flex-row xl:px-6 xl:py-6">
        <Sidebar items={sidebarByRole[role]} />

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              type="button"
              aria-label="بستن منو"
              className="absolute inset-0 bg-[#0F172A]/40"
              onClick={() => setIsSidebarOpen(false)}
            />
            <Sidebar
              items={sidebarByRole[role]}
              isMobile
              onNavigate={() => setIsSidebarOpen(false)}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <Header
            title={title}
            role={role}
            user={currentUser}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <div className="mt-6 space-y-6 pb-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
