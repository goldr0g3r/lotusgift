"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionShellProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: ReactNode;
  heading?: ReactNode;
  subheading?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  contentClassName?: string;
  containerClassName?: string;
};

export function SectionShell({
  className,
  eyebrow,
  heading,
  subheading,
  action,
  align = "left",
  contentClassName,
  containerClassName,
  children,
  ...props
}: SectionShellProps) {
  return (
    <section
      className={cn("px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20", className)}
      {...props}
    >
      <div className={cn("mx-auto max-w-7xl", containerClassName)}>
        {(eyebrow || heading || subheading || action) && (
          <div
            className={cn(
              "mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
              align === "center" && "sm:flex-col sm:items-center text-center",
            )}
          >
            <div className={cn(align === "center" && "mx-auto max-w-2xl")}>
              {eyebrow && <div>{eyebrow}</div>}
              {heading && <h2 className="section-heading mt-3">{heading}</h2>}
              {subheading && (
                <p className="section-subheading mt-3">{subheading}</p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        )}
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
