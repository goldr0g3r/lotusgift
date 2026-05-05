"use client";

import { ChevronDown } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type AccordionContextType = {
  active: string | null;
  setActive: (v: string | null) => void;
  multiple: boolean;
  values: string[];
  toggle: (v: string) => void;
};
const AccordionContext = createContext<AccordionContextType | null>(null);
const useAccordion = () => {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be used inside <Accordion>");
  return ctx;
};

export function Accordion({
  multiple = false,
  defaultValue,
  className,
  children,
}: {
  multiple?: boolean;
  defaultValue?: string | string[];
  className?: string;
  children: ReactNode;
}) {
  const [active, setActive] = useState<string | null>(
    !multiple && typeof defaultValue === "string" ? defaultValue : null,
  );
  const [values, setValues] = useState<string[]>(
    multiple && Array.isArray(defaultValue) ? defaultValue : [],
  );
  const toggle = (v: string) => {
    if (multiple) {
      setValues((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));
    } else {
      setActive((cur) => (cur === v ? null : v));
    }
  };
  return (
    <AccordionContext.Provider value={{ active, setActive, multiple, values, toggle }}>
      <div className={cn("divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  trigger,
  children,
  className,
}: {
  value: string;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { active, multiple, values, toggle } = useAccordion();
  const isOpen = multiple ? values.includes(value) : active === value;
  return (
    <div className={cn("group", className)}>
      <button
        type="button"
        onClick={() => toggle(value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-stone-800 hover:bg-stone-50"
        aria-expanded={isOpen}
      >
        <span>{trigger}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-stone-500 transition-transform",
            isOpen && "rotate-180 text-lotus-emerald-700",
          )}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 text-sm text-stone-600 animate-slide-down">{children}</div>
      )}
    </div>
  );
}

export type AccordionDivProps = HTMLAttributes<HTMLDivElement>;
