import Link from "next/link";
import { ArrowUpLeft, Square } from "lucide-react";
import type { SidebarIconName } from "@/lib/types";
import { sidebarIconMap } from "@/components/shared/app-icons";
import { Card } from "@/components/ui/card";

interface ActionLinkCardProps {
  title: string;
  description: string;
  href: string;
  icon: SidebarIconName;
}

export function ActionLinkCard({
  title,
  description,
  href,
  icon,
}: ActionLinkCardProps) {
  const Icon = sidebarIconMap[icon] ?? Square;

  return (
    <Link href={href} className="group block h-full">
      <Card className="flex h-full flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7D2DE] hover:shadow-[0_24px_40px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-11 items-center justify-center rounded-[14px] border border-[#DEE6EF] bg-[#F7FAFC] text-[#1F3A5F]">
            <Icon className="size-5" />
          </span>
          <span className="flex size-9 items-center justify-center rounded-full border border-[#E4EAF1] bg-white text-[#6B7280] transition-colors group-hover:text-[#1F3A5F]">
            <ArrowUpLeft className="size-4" />
          </span>
        </div>
        <div className="mt-8">
          <h3 className="text-base font-semibold text-[#102034]">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-[#6B7280]">{description}</p>
        </div>
      </Card>
    </Link>
  );
}
