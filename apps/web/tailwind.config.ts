import type { Config } from "tailwindcss";

const emerald = {
  50: "#ECFDF5",
  100: "#D1FAE5",
  200: "#A7F3D0",
  300: "#6EE7B7",
  400: "#34D399",
  500: "#10B981",
  600: "#059669",
  700: "#047857",
  800: "#065F46",
  900: "#064E3B",
};

const gold = {
  50: "#FFFBEB",
  100: "#FEF3C7",
  200: "#FDE68A",
  300: "#FCD34D",
  400: "#FBBF24",
  500: "#F59E0B",
  600: "#D97706",
  700: "#B45309",
  800: "#92400E",
  900: "#78350F",
};

const rose = {
  50: "#FFF1F2",
  100: "#FFE4E6",
  200: "#FECDD3",
  300: "#FDA4AF",
  400: "#FB7185",
  500: "#F43F5E",
  600: "#E11D48",
  700: "#BE123C",
  800: "#9F1239",
  900: "#881337",
};

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lotus: {
          emerald,
          gold,
          rose,
          cream: "#FAF7F2",
          ivory: "#FFFBF5",
          ink: "#1F2937",
        },
        // Re-pointed brand aliases so existing class names stay on-brand mid-migration.
        brand: {
          green: emerald,
          pink: rose,
          gold,
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: [
          "var(--font-display)",
          "var(--font-geist-sans)",
          "ui-serif",
          "Georgia",
          "serif",
        ],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "100%": { transform: "scale(1.1) translate(-1%, -1%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-down": "slide-down 0.2s ease-out forwards",
        "slide-up": "slide-up 0.2s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
        shimmer: "shimmer 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "gradient-shift": "gradient-shift 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        "ken-burns": "ken-burns 14s ease-out forwards",
      },
      boxShadow: {
        glow: "0 0 24px rgba(16, 185, 129, 0.18)",
        "glow-gold": "0 0 24px rgba(217, 119, 6, 0.18)",
        "glow-rose": "0 0 24px rgba(225, 29, 72, 0.18)",
        soft: "0 2px 16px rgba(15, 23, 42, 0.04), 0 1px 4px rgba(15, 23, 42, 0.04)",
        elevated:
          "0 8px 32px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)",
        "elevated-lg":
          "0 16px 48px rgba(15, 23, 42, 0.10), 0 4px 16px rgba(15, 23, 42, 0.06)",
        warm: "0 8px 28px rgba(217, 119, 6, 0.12), 0 2px 6px rgba(0,0,0,0.04)",
      },
      backgroundImage: {
        "noise":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      typography: () => ({}),
    },
  },
  plugins: [],
};

export default config;
