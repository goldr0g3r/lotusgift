"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "pink" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", asChild = false, className, type, children, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={clsx(
        styles.btn,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        className,
      )}
      type={asChild ? undefined : (type ?? "button")}
      {...rest}
    >
      {children}
    </Comp>
  );
});
