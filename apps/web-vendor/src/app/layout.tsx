import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LotusGift Vendor Portal",
  description:
    "Vendor portal for the LotusGift corporate-gifting marketplace. Fonts + design system arrive in PR-6.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
