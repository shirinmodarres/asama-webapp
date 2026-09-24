"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/api-error";
import {
  getPanelRouteForRole,
  ROLE_OPTIONS,
  type BackendRoleKey,
} from "@/lib/domain/roles";
import type { AuthUser } from "@/lib/models/auth.model";
import { switchActiveRole } from "@/lib/services/auth.service";

interface RoleSwitcherProps {
  user: AuthUser;
}

const switchableRoles = ROLE_OPTIONS.filter((option) => option.value !== "god");

export function RoleSwitcher({ user }: RoleSwitcherProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleChange = async (value: string) => {
    const role = value as BackendRoleKey;
    if (role === user.activeRole || isSwitching) return;
    setIsSwitching(true);
    try {
      const response = await switchActiveRole(role);
      toast.success(`نقش فعال به «${response.user.activeRoleLabel}» تغییر کرد.`);
      router.replace(getPanelRouteForRole(response.user.activeRole));
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="min-w-0 flex-1 sm:min-w-[210px] sm:flex-none">
      <Select
        value={user.activeRole}
        onValueChange={handleRoleChange}
        disabled={isSwitching}
      >
        <SelectTrigger className="h-12 border-[#D6E2D9] bg-[#F8FBF9] pr-3 pl-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#F3FAF4] text-[#6CAE75]">
              <ArrowRightLeft className={isSwitching ? "size-4 animate-pulse" : "size-4"} />
            </span>
            <div className="min-w-0 text-right">
              <p className="text-[11px] font-semibold text-[#6B7280]">ورود در نقش</p>
              <SelectValue placeholder={user.activeRoleLabel} />
            </div>
          </div>
        </SelectTrigger>
        <SelectContent>
          {switchableRoles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
