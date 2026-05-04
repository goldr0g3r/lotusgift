import React from "react";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center text-[#02783C] ${className}`}
    >
      <span className="font-bold font-times text-[#02783C] text-2xl tracking-tight leading-none">L</span>
      <svg
        className="w-6 h-6 mx-[1px]"
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g transform="translate(40, 40)">
          <circle cx="0" cy="0" r="7" fill="#F01282" />
          <g>
            {Array.from({ length: 24 }).map((_, i) => (
              <rect
                key={i}
                x="-1.5"
                y="-35"
                width="3"
                height="28"
                rx="1.5"
                fill="#F01282"
                transform={`rotate(${i * 15})`}
              />
            ))}
          </g>
        </g>
      </svg>
      <span className="font-bold font-times text-[#02783C] text-2xl tracking-tight leading-none">TUSGIFT</span>
    </div>
  );
}
