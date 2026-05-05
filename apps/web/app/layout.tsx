import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";
import FacebookPixel from "@/components/tracking/FacebookPixel";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lotus Gift - Premium Promotional Products & Corporate Gifts",
  description:
    "Premium promotional products and corporate gifts for businesses of all sizes. Custom branding, wholesale pricing, and fast delivery across India.",
  keywords: [
    "promotional products",
    "corporate gifts",
    "branded merchandise",
    "wholesale gifts",
    "custom branding",
    "employee welcome kits",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} font-sans antialiased`}
      >
        <FacebookPixel />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
