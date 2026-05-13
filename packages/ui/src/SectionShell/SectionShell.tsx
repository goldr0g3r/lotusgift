"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./SectionShell.module.scss";

export type SectionShellElement = "section" | "div" | "main" | "article";
export type SectionShellWidth = "default" | "narrow" | "wide";

export interface SectionShellProps extends HTMLAttributes<HTMLElement> {
  as?: SectionShellElement;
  width?: SectionShellWidth;
  children: ReactNode;
}

export const SectionShell = forwardRef<HTMLElement, SectionShellProps>(function SectionShell(
  { as = "section", width = "default", className, children, ...rest },
  ref,
) {
  const Comp = as as "section";
  return (
    <Comp
      ref={ref as React.Ref<HTMLElement>}
      className={clsx(styles.shell, styles[`width-${width}`], className)}
      {...rest}
    >
      {children}
    </Comp>
  );
});
