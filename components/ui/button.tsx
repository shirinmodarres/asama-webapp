import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#1F3A5F]/25 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[#1F3A5F] bg-[#1F3A5F] !text-white shadow-[0_16px_30px_rgba(31,58,95,0.16)] hover:bg-[#28496F] hover:shadow-[0_18px_34px_rgba(31,58,95,0.2)] disabled:!text-[#94A3B8] [&_*]:!text-inherit",
        secondary:
          "border border-[#D7E2DF] bg-[#F6FAF7] text-[#315D3D] shadow-[0_10px_24px_rgba(108,174,117,0.12)] hover:bg-[#EDF5EF]",
        outline:
          "border border-[#D9E0E8] bg-white text-[#1F3A5F] shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:border-[#B9C5D3] hover:bg-[#F8FBFD]",
        ghost:
          "border border-transparent bg-transparent text-[#516176] hover:bg-[#EFF4F8] hover:text-[#1F3A5F]",
        destructive:
          "border border-[#E9C8C8] bg-[#8F2C2C] !text-white shadow-[0_14px_28px_rgba(143,44,44,0.18)] hover:bg-[#7B2525] disabled:!text-[#94A3B8] [&_*]:!text-inherit",
        success:
          "border border-[#6CAE75] bg-[#6CAE75] !text-white shadow-[0_14px_28px_rgba(108,174,117,0.18)] hover:bg-[#609B69] disabled:!text-[#94A3B8] [&_*]:!text-inherit",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-[12px] px-3.5 text-xs",
        lg: "h-12 px-5 text-sm",
        icon: "h-11 w-11",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth, className }),
        )}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
