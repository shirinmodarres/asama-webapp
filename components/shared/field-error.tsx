import { cn } from "@/lib/utils";

interface FieldErrorProps {
  message?: string | null;
  id?: string;
  className?: string;
}

export function FieldError({ message, id, className }: FieldErrorProps) {
  return (
    <p
      id={id}
      aria-live="polite"
      className={cn(
        "mt-1 min-h-5 text-xs font-medium leading-5 text-red-600",
        !message && "invisible",
        className,
      )}
    >
      {message || "-"}
    </p>
  );
}
