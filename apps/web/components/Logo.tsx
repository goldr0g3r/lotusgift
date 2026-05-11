import React from "react";
import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "inverted" | "mono-white";
};

const sizeMap = {
  sm: { text: "text-lg", icon: "h-5 w-5" },
  md: { text: "text-2xl", icon: "h-6 w-6" },
  lg: { text: "text-3xl", icon: "h-8 w-8" },
};

export default function Logo({
  className = "",
  size = "md",
  variant = "default",
}: LogoProps) {
  const s = sizeMap[size];
  const textColor =
    variant === "mono-white"
      ? "text-white"
      : variant === "inverted"
        ? "text-white"
        : "text-brand-green-500";
  const lotusFill = variant === "mono-white" ? "#FFFFFF" : "#F01282";
  return (
    <div className={cn("flex items-center", textColor, className)}>
      <span className={cn("font-extrabold tracking-tight leading-none", s.text)}>
        L
      </span>
      <svg
        className={cn("mx-[1px]", s.icon)}
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g transform="translate(40, 40)">
          <circle cx="0" cy="0" r="7" fill={lotusFill} />
          <g>
            {Array.from({ length: 24 }).map((_, i) => (
              <rect
                key={i}
                x="-1.5"
                y="-35"
                width="3"
                height="28"
                rx="1.5"
                fill={lotusFill}
                transform={`rotate(${i * 15})`}
              />
            ))}
          </g>
        </g>
      </svg>
      <span className={cn("font-extrabold tracking-tight leading-none", s.text)}>
        TUSGIFT
      </span>
    </div>
  );
}
