"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./Card.module.scss";

export type CardPadding = "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  header?: ReactNode;
  footer?: ReactNode;
  padding?: CardPadding;
  /** Render as a different element (e.g. 'article' for semantic posts). */
  as?: "div" | "article" | "section";
  children: ReactNode;
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { header, footer, padding = "md", as = "div", className, children, ...rest },
  ref,
) {
  const Comp = as as "div";
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      className={clsx(styles.card, styles[`padding-${padding}`], className)}
      {...rest}
    >
      {header ? <div className={styles.header}>{header}</div> : null}
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </Comp>
  );
});
