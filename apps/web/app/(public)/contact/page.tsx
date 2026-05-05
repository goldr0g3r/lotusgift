"use client";

import { useState, type FormEvent } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { contactImage } from "@/lib/images";
import { toast } from "@/components/ui/Toaster";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const contactInfo = [
  { icon: Phone, label: "Phone", value: "+91 98765 43210", href: "tel:+919876543210" },
  { icon: Mail, label: "Email", value: "info@lotusgift.com", href: "mailto:info@lotusgift.com" },
  {
    icon: MapPin,
    label: "Address",
    value: "123 Business Avenue, Mumbai, Maharashtra 400001",
    href: null,
  },
  { icon: Clock, label: "Hours", value: "Mon – Sat: 9 AM – 6 PM IST", href: null },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(data.message || "Something went wrong");
      }
      setSubmitted(true);
      toast.success("Thanks! We'll get back to you within 24 hours.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="relative bg-gradient-to-br from-lotus-emerald-700 via-lotus-emerald-800 to-stone-900 px-6 py-16 sm:px-10 lg:px-14 lg:py-24 text-white">
            <div className="pointer-events-none absolute inset-0 lotus-pattern opacity-25" aria-hidden />
            <div className="relative max-w-lg">
              <span className="eyebrow !bg-white/10 !text-lotus-gold-200 !ring-white/15">
                Talk to us
              </span>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-tight">
                Let&apos;s build something memorable together
              </h1>
              <p className="mt-4 text-stone-100/85">
                Tell us about your campaign — quantities, timelines, branding —
                and we&apos;ll come back with options and visuals within 24 hours.
              </p>
              <ul className="mt-8 grid gap-3">
                {contactInfo.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                      <item.icon className="h-4 w-4 text-lotus-gold-300" />
                    </span>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">
                        {item.label}
                      </div>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm font-medium hover:text-lotus-gold-200"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium">{item.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-lotus-gold-500 px-5 py-3 text-sm font-bold text-stone-900 shadow-elevated hover:bg-lotus-gold-400 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="relative h-[320px] lg:h-auto">
            <ImageWithFallback
              src={contactImage.src}
              alt={contactImage.alt}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <div className="card p-10 text-center max-w-2xl mx-auto">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100">
                <CheckCircle className="h-8 w-8 text-lotus-emerald-700" />
              </div>
              <h2 className="font-display text-2xl font-bold text-stone-900">
                Message sent!
              </h2>
              <p className="mt-2 text-stone-500 max-w-md mx-auto">
                Thanks for reaching out — our team will get back to you within 24 hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    subject: "",
                    message: "",
                  });
                }}
                className="btn-secondary mt-6"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="card p-6 sm:p-10">
              <h2 className="font-display text-2xl font-bold text-stone-900">
                Send us a message
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Required fields marked with <span className="text-lotus-rose-600">*</span>.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">
                    Full name <span className="text-lotus-rose-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-lotus-rose-600">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="message">
                    Message <span className="text-lotus-rose-600">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your campaign — audience, quantities, timeline..."
                  />
                </div>

                {error && (
                  <p className="sm:col-span-2 rounded-lg bg-lotus-rose-50 px-4 py-2 text-sm text-lotus-rose-700 ring-1 ring-lotus-rose-100">
                    {error}
                  </p>
                )}

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary disabled:opacity-60"
                  >
                    {submitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send message
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
