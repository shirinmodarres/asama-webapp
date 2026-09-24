"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };
const TOAST_EVENT = "asama:toast";

function showToast(tone: ToastTone, message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastItem>(TOAST_EVENT, {
      detail: { id: Date.now() + Math.random(), message, tone },
    }),
  );
}

export const toast = {
  success: (message: string) => showToast("success", message),
  error: (message: string) => showToast("error", message),
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const item = (event as CustomEvent<ToastItem>).detail;
      setItems((current) => {
        if (current.some(({ message, tone }) => message === item.message && tone === item.tone)) {
          return current;
        }
        return [...current, item];
      });
      window.setTimeout(() => {
        setItems((current) => current.filter(({ id }) => id !== item.id));
      }, 4500);
    };

    const promoteLegacyActionBanners = () => {
      document.querySelectorAll<HTMLElement>(".asama-banner").forEach((banner) => {
        const message = banner.textContent?.trim() || "";
        if (!message) return;
        banner.hidden = true;
        if (banner.dataset.toastMessage === message) return;
        banner.dataset.toastMessage = message;
        showToast("success", message);
      });
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    promoteLegacyActionBanners();
    const observer = new MutationObserver(promoteLegacyActionBanners);
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      window.removeEventListener(TOAST_EVENT, handleToast);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-4 z-[200] flex flex-col items-center gap-2"
      dir="rtl"
      aria-live="polite"
    >
      {items.map((item) => {
        const Icon = item.tone === "success" ? CheckCircle2 : XCircle;
        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-lg",
              item.tone === "success"
                ? "border-[#B9DEC1] text-[#256B38]"
                : "border-[#EBCACA] text-[#9C3B3B]",
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span className="flex-1">{item.message}</span>
            <button
              type="button"
              aria-label="بستن پیام"
              className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
              onClick={() =>
                setItems((current) =>
                  current.filter(({ id }) => id !== item.id),
                )
              }
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
