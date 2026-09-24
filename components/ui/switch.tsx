import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) onCheckedChange?.(!checked);
      }}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1F3A5F]/25 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-[#6CAE75] bg-[#6CAE75]"
          : "border-[#CBD5E1] bg-[#E2E8F0]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 block size-5 rounded-full bg-white shadow-sm transition-[left,right]",
          checked ? "right-1" : "left-1",
        )}
      />
    </button>
  ),
);
Switch.displayName = "Switch";

export { Switch };
