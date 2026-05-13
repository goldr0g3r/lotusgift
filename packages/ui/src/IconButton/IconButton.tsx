"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./IconButton.module.scss";

export type IconButtonVariant = "dark" | "light";
export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonBadgeTone = "pink" | "green";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  badgeCount?: number;
  badgeTone?: IconButtonBadgeTone;
  /** Required: icon-only buttons must announce themselves to screen readers. */
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    variant = "dark",
    size = "md",
    badgeCount,
    badgeTone = "pink",
    className,
    type,
    ...rest
  },
  ref,
) {
  const showBadge = typeof badgeCount === "number" && badgeCount > 0;
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={clsx(
        styles.iconBtn,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        className,
      )}
      {...rest}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      {showBadge ? (
        <span className={clsx(styles.badge, styles[`badge-${badgeTone}`])} aria-hidden="true">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </button>
  );
});
