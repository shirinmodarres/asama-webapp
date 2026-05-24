import type { ReactNode } from "react";
import { FieldError } from "@/components/shared/field-error";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium text-[#334155]", className)}>
      <span>{label}</span>
      {children}
      <FieldError message={error} />
    </label>
  );
}
