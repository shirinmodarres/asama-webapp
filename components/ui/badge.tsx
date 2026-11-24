import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        neutral: "border-[#D8E0EA] bg-[#F7F9FB] text-[#536275]",
        brand: "border-[#C9D7E8] bg-[#EEF4FA] text-[#1F3A5F]",
        success: "border-[#CFE3D3] bg-[#F3FAF4] text-[#3E6A46]",
        warning: "border-[#F1D7AA] bg-[#FFF8EB] text-[#9A6C18]",
        destructive: "border-[#EBCACA] bg-[#FFF4F4] text-[#9C3B3B]",
        correction: "border-[#E8C5A5] bg-[#FFF3E8] text-[#96521F]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({
  className,
  variant,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot ? (
        <span className="size-1.5 rounded-full bg-current opacity-80" />
      ) : null}
      {children}
    </div>
  );
}
