interface InlineErrorMessageProps {
  message: string;
}

export function InlineErrorMessage({ message }: InlineErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="whitespace-pre-line rounded-xl border border-[#F4C7C7] bg-[#FFF7F7] px-4 py-3 text-sm leading-7 text-[#8F2C2C]">
      {message}
    </div>
  );
}
