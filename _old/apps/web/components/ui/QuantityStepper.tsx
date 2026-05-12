"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type QuantityStepperProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99999,
  step = 1,
  className,
}: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white ring-1 ring-stone-200 px-1 py-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 disabled:opacity-40"
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="w-14 bg-transparent text-center text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        min={min}
        max={max}
      />
      <button
        type="button"
        onClick={inc}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 disabled:opacity-40"
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
