import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-28 w-full rounded-[14px] border border-[#D7DEE6] bg-white px-3.5 py-3 text-sm text-[#102034] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.03)] transition-all outline-none placeholder:text-[#94A3B8] hover:border-[#C4CFDB] focus:border-[#1F3A5F] focus:ring-4 focus:ring-[#1F3A5F]/8 disabled:cursor-not-allowed disabled:bg-[#F7F9FB]",
        "aria-invalid:border-red-400 aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-200",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
