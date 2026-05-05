"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { FALLBACK_IMAGE } from "@/lib/images";

type Props = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  fallback?: string;
  containerClassName?: string;
};

export function ImageWithFallback({
  src,
  alt,
  fallback = FALLBACK_IMAGE.src,
  className,
  containerClassName,
  fill,
  ...props
}: Props) {
  const initial = src && src.length > 0 ? src : fallback;
  const [current, setCurrent] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-stone-100", containerClassName)}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse-soft bg-gradient-to-br from-stone-100 via-stone-50 to-lotus-cream"
        />
      )}
      <Image
        src={current}
        alt={alt}
        fill={fill ?? true}
        sizes={props.sizes ?? "(max-width: 768px) 100vw, 50vw"}
        onError={() => setCurrent(fallback)}
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        {...props}
      />
    </div>
  );
}
