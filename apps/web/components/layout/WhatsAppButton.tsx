"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const phoneNumber = "919876543210";
  const message = encodeURIComponent(
    "Hi! I'm interested in your promotional products. Can you help me?",
  );

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-pink-500 text-white shadow-elevated-lg ring-4 ring-white hover:bg-brand-pink-600 hover:scale-105 transition-all group animate-pulse-soft"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute right-full mr-3 bg-white text-brand-ink-800 text-sm font-semibold px-3 py-1.5 rounded-full shadow-pill opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Chat with us
      </span>
    </a>
  );
}
