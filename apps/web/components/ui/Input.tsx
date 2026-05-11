"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

const baseInput =
  "w-full px-5 py-3 border border-stone-200 rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green-500/20 focus:border-brand-green-500 placeholder:text-stone-400 transition-all duration-200 disabled:bg-stone-50 disabled:text-stone-400";

const squareInput =
  "w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green-500/20 focus:border-brand-green-500 placeholder:text-stone-400 transition-all duration-200 disabled:bg-stone-50 disabled:text-stone-400";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  shape?: "pill" | "square";
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, shape = "square", ...props }, ref) => (
    <input
      ref={ref}
      className={cn(shape === "pill" ? baseInput : squareInput, className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(squareInput, "min-h-[120px] resize-y rounded-2xl", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { shape?: "pill" | "square" }
>(({ className, children, shape = "square", ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      shape === "pill" ? baseInput : squareInput,
      "appearance-none pr-9 bg-[length:16px] bg-[right_14px_center] bg-no-repeat bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22currentColor%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22 /></svg>')]",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-stone-700 mb-1.5",
        className,
      )}
      {...props}
    />
  );
}

export const SearchPill = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; suffix?: ReactNode }
>(({ className, icon, suffix, ...props }, ref) => (
  <div
    className={cn(
      "flex items-center gap-2 rounded-full bg-white ring-1 ring-stone-200 px-2 py-1 shadow-pill focus-within:ring-2 focus-within:ring-brand-green-500/30",
      className,
    )}
  >
    <span className="pl-3 text-stone-400">{icon ?? <Search className="h-4 w-4" />}</span>
    <input
      ref={ref}
      className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-stone-400"
      {...props}
    />
    {suffix}
  </div>
));
SearchPill.displayName = "SearchPill";
