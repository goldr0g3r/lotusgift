"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-brand-ink-900 group-[.toaster]:border group-[.toaster]:border-stone-200 group-[.toaster]:shadow-elevated rounded-2xl",
          description: "group-[.toast]:text-stone-500",
          actionButton:
            "group-[.toast]:bg-brand-green-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-stone-100 group-[.toast]:text-stone-600",
        },
      }}
    />
  );
}

export { toast } from "sonner";
