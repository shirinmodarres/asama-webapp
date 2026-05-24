import { cn } from "@/lib/utils";

interface FieldErrorProps {
  message?: string | null;
  id?: string;
  className?: string;
}

export function FieldError({ message, id, className }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p id={id} className={cn("mt-1 text-xs font-medium text-red-600", className)}>
      {message}
    </p>
  );
}
