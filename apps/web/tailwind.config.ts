import type { Config } from "tailwindcss";

const green = {
  50: "#E6F4ED",
  100: "#C2E3CF",
  200: "#8FC8A9",
  300: "#5BAD83",
  400: "#2F955F",
  500: "#02783C",
  600: "#026B36",
  700: "#02592D",
  800: "#014424",
  900: "#01331B",
  950: "#012113",
};

const pink = {
  50: "#FEE8F2",
  100: "#FECDDF",
  200: "#FBA6C7",
  300: "#F87FAF",
  400: "#F45298",
  500: "#F01282",
  600: "#D40D74",
  700: "#A40B5C",
  800: "#75083F",
  900: "#4A052B",
  950: "#2B0319",
};

const ink = {
  50: "#F7F7F8",
  100: "#EDEDF0",
  200: "#D6D6DD",
  300: "#B5B5BF",
  400: "#888896",
  500: "#5E5E6B",
  600: "#444450",
  700: "#2F2F38",
  800: "#1D1D24",
  900: "#0E0E13",
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
        brand: {
          green,
          pink,
          ink,
        },
        // Back-compat aliases so any stragglers still resolve mid-migration.
        lotus: {
          emerald: green,
          gold: pink,
          rose: pink,
          cream: "#FFFBF5",
          ivory: "#FFFBF5",
          ink: ink[700],
        },
      },
      fontFamily: {
        sans: [
          "var(--font-jakarta)",
          "var(--font-geist-sans)",
          "system-ui",
          "sans-serif",
        ],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: [
          "var(--font-jakarta)",
          "var(--font-geist-sans)",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
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
          "50%": { transform: "translateY(-8px)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "100%": { transform: "scale(1.08) translate(-1%, -1%)" },
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
        float: "float 4s ease-in-out infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        "ken-burns": "ken-burns 14s ease-out forwards",
      },
      boxShadow: {
        panel:
          "0 24px 64px -16px rgba(15, 23, 42, 0.12), 0 8px 24px -8px rgba(15, 23, 42, 0.08)",
        pill: "0 4px 14px -4px rgba(15, 23, 42, 0.10), 0 1px 2px rgba(15, 23, 42, 0.04)",
        soft: "0 2px 16px rgba(15, 23, 42, 0.05), 0 1px 4px rgba(15, 23, 42, 0.04)",
        elevated:
          "0 10px 30px -10px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.05)",
        "elevated-lg":
          "0 24px 56px -16px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(15, 23, 42, 0.06)",
        glow: "0 0 32px rgba(2, 120, 60, 0.18)",
        "glow-pink": "0 0 32px rgba(240, 18, 130, 0.22)",
      },
      backgroundImage: {
        noise:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
    },
  },
  plugins: [],
};

export default config;
