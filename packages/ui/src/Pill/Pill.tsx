"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./Pill.module.scss";

export type PillTone = "green" | "pink" | "ink" | "neutral";
export type PillSize = "sm" | "md";

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  size?: PillSize;
  children: ReactNode;
}

export const Pill = forwardRef<HTMLSpanElement, PillProps>(function Pill(
  { tone = "neutral", size = "sm", className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={clsx(styles.pill, styles[`tone-${tone}`], styles[`size-${size}`], className)}
      {...rest}
    >
      {children}
    </span>
  );
});
