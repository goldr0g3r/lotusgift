"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  showClose?: boolean;
  className?: string;
}

const sizeCls = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  showClose = true,
  className,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof window === "undefined") return null;
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-elevated-lg overflow-hidden animate-scale-in",
          sizeCls[size],
          className,
        )}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
            <div>
              {title && <h2 className="text-lg font-semibold text-stone-900">{title}</h2>}
              {description && (
                <p className="mt-1 text-sm text-stone-500">{description}</p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-5 -mx-5 -mb-4 flex items-center justify-end gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3", className)}>
      {children}
    </div>
  );
}
