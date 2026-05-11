"use client";

import { useState } from "react";
import {
  ArrowRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { toast } from "@/components/ui/Toaster";

const departments = [
  {
    name: "Sales & Quotes",
    detail: "For new campaigns, RFPs and tiered pricing.",
    email: "quotes@lotusgift.com",
  },
  {
    name: "Wholesale & Procurement",
    detail: "Volume contracts, GST-compliant invoicing.",
    email: "wholesale@lotusgift.com",
  },
  {
    name: "Design & Customisation",
    detail: "Mockups, branding files, packaging requests.",
    email: "design@lotusgift.com",
  },
  {
    name: "Existing Orders",
    detail: "Tracking, dispatch updates, post-delivery support.",
    email: "support@lotusgift.com",
  },
];

const faqs = [
  {
    q: "What is your typical lead time?",
    a: "10–14 days from artwork approval for most orders. Tighter timelines can be accommodated for in-stock items with simpler branding.",
  },
  {
    q: "Do you ship pan-India?",
    a: "Yes. We dispatch from Coimbatore and split shipments across multiple cities when needed. Most metros receive within 3–5 days.",
  },
  {
    q: "What's the minimum order quantity?",
    a: "MOQs vary by product, typically starting at 25–100 units. Bulk tiers (500+) unlock significant savings.",
  },
  {
    q: "Can you handle custom packaging?",
    a: "Absolutely. We design and produce custom boxes, sleeves, ribbon tags and inserts in-house.",
  },
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 480));
    toast.success("Message sent — we'll get back within 24 hours");
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      subject: "",
      message: "",
    });
    setSubmitting(false);
  };

  return (
    <div>
      <section className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="eyebrow">Get in touch</span>
            <h1 className="mt-4 h1-display">Talk to a real human</h1>
            <p className="mt-4 text-base sm:text-lg text-stone-500">
              Tell us about your campaign, audience and timeline. We respond to every message within 24 hours.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-10 pb-12 sm:pb-16">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <form
              onSubmit={onSubmit}
              className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8 shadow-soft"
            >
              <h2 className="font-display text-xl font-bold text-brand-ink-900">
                Send us a message
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                The more context you share, the better our first response will be.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Subject</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Welcome kits for 250 hires"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Message</Label>
                  <Textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your campaign, timeline and any branding preferences."
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-pink btn-lg mt-6"
              >
                <span className="btn-disc">
                  <Send className="h-4 w-4" />
                </span>
                {submitting ? "Sending…" : "Send message"}
              </button>
            </form>
          </div>

          <aside className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white border border-stone-100 p-6">
              <h3 className="font-display text-lg font-bold text-brand-ink-900">
                Office & support
              </h3>
              <ul className="mt-5 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="shrink-0 h-10 w-10 rounded-full bg-brand-green-50 text-brand-green-600 inline-flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-ink-900">
                      Headquarters
                    </p>
                    <p className="text-stone-500">
                      123 Business Park, Coimbatore, Tamil Nadu 641001
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 h-10 w-10 rounded-full bg-brand-pink-50 text-brand-pink-600 inline-flex items-center justify-center">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-ink-900">Call us</p>
                    <a
                      href="tel:+919876543210"
                      className="text-stone-500 hover:text-brand-ink-800"
                    >
                      +91 98765 43210
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 h-10 w-10 rounded-full bg-brand-green-50 text-brand-green-600 inline-flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-ink-900">Email us</p>
                    <a
                      href="mailto:hello@lotusgift.com"
                      className="text-stone-500 hover:text-brand-ink-800"
                    >
                      hello@lotusgift.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 h-10 w-10 rounded-full bg-brand-pink-50 text-brand-pink-600 inline-flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-ink-900">Hours</p>
                    <p className="text-stone-500">
                      Mon – Sat · 9:30 AM to 7:00 PM IST
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 h-10 w-10 rounded-full bg-brand-green-50 text-brand-green-600 inline-flex items-center justify-center">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-ink-900">WhatsApp</p>
                    <a
                      href="https://wa.me/919876543210"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-500 hover:text-brand-ink-800"
                    >
                      Chat with the team
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl overflow-hidden ring-1 ring-stone-100 relative aspect-[16/10]">
              <iframe
                title="Lotus Gift location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=76.85,10.95,77.05,11.10&layer=mapnik"
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </aside>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-10 pb-16">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <span className="eyebrow-pink">Departments</span>
            <h2 className="mt-3 h2-display">Reach the right team faster</h2>
            <p className="mt-3 text-stone-500 max-w-md">
              Drop us a note at the right inbox so the right specialist picks it up.
            </p>
            <div className="mt-6 space-y-3">
              {departments.map((d) => (
                <a
                  key={d.email}
                  href={`mailto:${d.email}`}
                  className="block rounded-3xl bg-white border border-stone-100 p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-brand-ink-900">
                        {d.name}
                      </p>
                      <p className="text-xs text-stone-500">{d.detail}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-400" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-brand-green-600">
                    {d.email}
                  </p>
                </a>
              ))}
            </div>
          </div>
          <div>
            <span className="eyebrow">FAQ</span>
            <h2 className="mt-3 h2-display">Common questions</h2>
            <p className="mt-3 text-stone-500 max-w-md">
              Quick answers to what most teams ask us before sending a brief.
            </p>
            <div className="mt-6">
              <Accordion>
                {faqs.map((f) => (
                  <AccordionItem key={f.q} value={f.q} trigger={f.q}>
                    <p>{f.a}</p>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <div className="mt-6 rounded-3xl bg-brand-green-50 ring-1 ring-brand-green-100 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-brand-green-800 inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Still have questions?
                </p>
                <p className="text-xs text-brand-green-700/80 mt-0.5">
                  We&apos;re happy to hop on a 15-minute discovery call.
                </p>
              </div>
              <a
                href="tel:+919876543210"
                className="btn-primary btn-sm shrink-0"
              >
                Book a call
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
