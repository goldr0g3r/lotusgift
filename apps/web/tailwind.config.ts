import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            50: "#E8F5ED",
            100: "#C6E6D0",
            200: "#9DD4B0",
            300: "#6DBF8A",
            400: "#3DAA64",
            500: "#0B7A3E",
            600: "#096832",
            700: "#075626",
            800: "#05441B",
            900: "#033210",
          },
          pink: {
            50: "#FDE8F0",
            100: "#F9C4D8",
            200: "#F59DBE",
            300: "#F075A3",
            400: "#EC4D89",
            500: "#E91E78",
            600: "#C41866",
            700: "#9F1253",
            800: "#7A0D40",
            900: "#55082D",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
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
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-down": "slide-down 0.2s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
        shimmer: "shimmer 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "gradient-shift": "gradient-shift 6s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 0 20px rgba(11, 122, 62, 0.15)",
        "glow-pink": "0 0 20px rgba(233, 30, 120, 0.15)",
        soft: "0 2px 16px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.04)",
        elevated:
          "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
        "elevated-lg":
          "0 16px 48px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
