"use client";

import { Toaster as SonnerToaster, type ToasterProps as SonnerProps } from "sonner";
import styles from "./Toaster.module.scss";

export type ToasterProps = SonnerProps;

/**
 * LotusGift-themed Sonner Toaster.
 *
 * Mount this component once at the root of each app (inside the root layout).
 * Toast invocations elsewhere use the `toast()` function from `sonner`:
 *
 * ```tsx
 * import { toast } from 'sonner';
 * toast.success('Quote submitted');
 * ```
 */
export function Toaster({
  position = "top-right",
  richColors = true,
  closeButton = true,
  visibleToasts = 4,
  ...rest
}: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      richColors={richColors}
      closeButton={closeButton}
      visibleToasts={visibleToasts}
      toastOptions={{
        classNames: {
          toast: styles.toast,
          title: styles.title,
          description: styles.description,
          actionButton: styles.actionButton,
          cancelButton: styles.cancelButton,
        },
      }}
      {...rest}
    />
  );
}
