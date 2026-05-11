"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  Mail,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatInr } from "@/components/ui/PriceTag";
import {
  useQuoteBag,
  submitQuoteRequest,
  type BagLine,
} from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { mockProducts } from "@/lib/mock-data";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";
import type { Quote } from "@/lib/api-types";

const steps = ["Contact", "Items", "Branding", "Timeline", "Review"] as const;
type StepName = (typeof steps)[number];

export default function RequestQuotePage() {
  const params = useSearchParams();
  const fromBag = params.get("from") === "bag";
  const productSlug = params.get("product");
  const bag = useQuoteBag();
  const { data: session } = useSession();
  const [step, setStep] = useState<number>(0);
  const [submitted, setSubmitted] = useState<Quote | null>(null);
  const [items, setItems] = useState<BagLine[]>([]);

  const [form, setForm] = useState({
    contactName: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    phone: session?.user?.phone ?? "",
    company: session?.user?.company ?? "",
    cityList: "",
    timeline: "2-4 weeks",
    eventDate: "",
    budget: "",
    branding: "",
    notes: "",
  });

  // Seed items from quote bag, or from ?product=<slug>
  useEffect(() => {
    if (items.length > 0) return;
    if (fromBag && bag.items.length > 0) {
      setItems(bag.items);
      return;
    }
    if (productSlug) {
      const p = mockProducts.find((x) => x.slug === productSlug);
      if (p)
        setItems([
          {
            productId: p.id,
            slug: p.slug,
            name: p.name,
            imageUrl: p.imageUrl,
            unitPrice: p.wholesalePrice ?? p.priceFrom,
            qty: p.minOrderQty,
            minOrderQty: p.minOrderQty,
            category: p.category.name,
          },
        ]);
    }
  }, [fromBag, productSlug, bag.items, items.length]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.qty * it.unitPrice, 0),
    [items],
  );

  const updateItem = (productId: string, qty: number) =>
    setItems((arr) =>
      arr.map((it) => (it.productId === productId ? { ...it, qty } : it)),
    );
  const removeItem = (productId: string) =>
    setItems((arr) => arr.filter((it) => it.productId !== productId));

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = () => {
    if (items.length === 0) {
      toast.error("Add at least one product to your quote");
      setStep(1);
      return;
    }
    const q = submitQuoteRequest(items, {
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      company: form.company,
      notes: [
        form.branding && `Branding: ${form.branding}`,
        form.cityList && `Cities: ${form.cityList}`,
        form.timeline && `Timeline: ${form.timeline}`,
        form.eventDate && `Event date: ${form.eventDate}`,
        form.budget && `Budget: ${form.budget}`,
        form.notes,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    bag.clear();
    setSubmitted(q);
    toast.success(`Quote request ${q.quoteNumber} submitted`);
  };

  if (submitted) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-4xl bg-white border border-stone-100 p-10 sm:p-14 text-center shadow-soft">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-50 text-brand-green-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 h2-display">We&apos;ve got your quote request</h1>
          <p className="mt-3 text-stone-500">
            A coordinator will reach out within 24 hours with options and a
            formal quote. We sent a copy to{" "}
            <span className="font-semibold text-brand-ink-800">{form.email}</span>.
          </p>
          <div className="mt-6 inline-block rounded-full bg-stone-100 px-5 py-2 text-sm font-semibold text-brand-ink-800">
            Quote #{submitted.quoteNumber}
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <Link href="/portal/quotes" className="btn-primary btn-sm w-full">
              View my quotes
            </Link>
            <Link href="/products" className="btn-outline rounded-full text-sm w-full">
              Browse more
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStep: StepName = steps[step] ?? "Contact";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between">
          <div>
            <span className="eyebrow">Request quote</span>
            <h1 className="mt-3 h2-display">Tell us about your campaign</h1>
            <p className="mt-2 text-stone-500 text-sm sm:text-base max-w-2xl">
              Five quick steps. We&apos;ll respond with options, indicative pricing and visual mockups within 48 hours.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8">
            <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8">
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                        step >= i
                          ? "bg-brand-ink-900 text-white"
                          : "bg-stone-100 text-stone-500",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold whitespace-nowrap",
                        step >= i ? "text-brand-ink-900" : "text-stone-400",
                      )}
                    >
                      {s}
                    </span>
                    {i < steps.length - 1 && (
                      <span className="h-px w-6 bg-stone-200" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-7 animate-fade-in">
                {currentStep === "Contact" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Contact name</Label>
                      <Input
                        value={form.contactName}
                        onChange={(e) =>
                          setForm({ ...form, contactName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={form.company}
                        onChange={(e) =>
                          setForm({ ...form, company: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Work email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {currentStep === "Items" && (
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <div className="rounded-2xl bg-stone-50 p-6 text-center">
                        <p className="text-sm text-stone-500">
                          No items yet. Browse the catalog and tap{" "}
                          <span className="font-semibold text-brand-ink-800">
                            Add to quote bag
                          </span>{" "}
                          on any product.
                        </p>
                        <Link href="/products" className="btn-primary btn-sm mt-4 mx-auto">
                          Browse catalog
                        </Link>
                      </div>
                    ) : (
                      items.map((it) => (
                        <div
                          key={it.productId}
                          className="rounded-2xl border border-stone-100 p-4 flex items-center gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-brand-ink-900 truncate">
                              {it.name}
                            </p>
                            <p className="text-xs text-stone-500">
                              {it.category} · MOQ {it.minOrderQty}
                            </p>
                          </div>
                          <QuantityStepper
                            value={it.qty}
                            onChange={(q) => updateItem(it.productId, q)}
                            min={it.minOrderQty}
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(it.productId)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-full text-rose-600 hover:bg-rose-50"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {currentStep === "Branding" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Branding requirements</Label>
                      <Textarea
                        placeholder="Logo placement, embroidery vs print, Pantone match, packaging treatment…"
                        value={form.branding}
                        onChange={(e) =>
                          setForm({ ...form, branding: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Embroidered logo",
                        "UV print",
                        "Laser engraving",
                        "Custom packaging",
                        "Insert card",
                        "Pantone match",
                      ].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              branding: f.branding
                                ? `${f.branding}, ${c}`
                                : c,
                            }))
                          }
                          className="rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold text-brand-ink-700 hover:bg-stone-200 text-left"
                        >
                          + {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === "Timeline" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Timeline</Label>
                      <Select
                        value={form.timeline}
                        onChange={(e) =>
                          setForm({ ...form, timeline: e.target.value })
                        }
                      >
                        <option>Less than 1 week</option>
                        <option>1-2 weeks</option>
                        <option>2-4 weeks</option>
                        <option>1-2 months</option>
                        <option>Flexible</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Event / launch date (optional)</Label>
                      <Input
                        type="date"
                        value={form.eventDate}
                        onChange={(e) =>
                          setForm({ ...form, eventDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Indicative budget</Label>
                      <Input
                        value={form.budget}
                        onChange={(e) =>
                          setForm({ ...form, budget: e.target.value })
                        }
                        placeholder="e.g. ₹3,00,000"
                      />
                    </div>
                    <div>
                      <Label>Delivery cities</Label>
                      <Input
                        value={form.cityList}
                        onChange={(e) =>
                          setForm({ ...form, cityList: e.target.value })
                        }
                        placeholder="Bengaluru, Mumbai, Hyderabad…"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Additional notes</Label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) =>
                          setForm({ ...form, notes: e.target.value })
                        }
                        placeholder="Anything else our team should know"
                      />
                    </div>
                  </div>
                )}

                {currentStep === "Review" && (
                  <div className="space-y-5 text-sm">
                    <div className="rounded-2xl border border-stone-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Contact
                      </p>
                      <p className="mt-2 text-brand-ink-900 font-semibold">
                        {form.contactName} · {form.company}
                      </p>
                      <p className="text-stone-500">{form.email} · {form.phone}</p>
                    </div>
                    <div className="rounded-2xl border border-stone-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Items
                      </p>
                      <ul className="mt-2 divide-y divide-stone-100">
                        {items.map((it) => (
                          <li
                            key={it.productId}
                            className="py-2 flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="font-semibold text-brand-ink-900">
                              {it.name}
                            </span>
                            <span className="text-stone-500">× {it.qty}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-stone-500">
                        Indicative subtotal:{" "}
                        <span className="font-semibold text-brand-ink-900">
                          {formatInr(subtotal)}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-stone-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Timeline & branding
                      </p>
                      <p className="mt-2 text-brand-ink-900">
                        {form.timeline}
                        {form.eventDate && ` · ${form.eventDate}`}
                      </p>
                      {form.branding && (
                        <p className="text-stone-500 mt-1">{form.branding}</p>
                      )}
                      {form.notes && (
                        <p className="text-stone-500 mt-2 italic">{form.notes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="btn-ghost disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                {step < steps.length - 1 ? (
                  <button type="button" onClick={next} className="btn-primary btn-lg">
                    <span className="btn-disc">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    Continue
                  </button>
                ) : (
                  <button type="button" onClick={submit} className="btn-pink btn-lg">
                    <span className="btn-disc">
                      <Wand2 className="h-4 w-4" />
                    </span>
                    Submit quote request
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-6 rounded-3xl bg-brand-ink-900 text-white p-6 shadow-elevated relative overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-pink-500/30 blur-3xl"
              />
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-brand-pink-200">
                <Sparkles className="h-3 w-3" />
                What happens next
              </span>
              <h3 className="mt-3 font-display text-2xl font-extrabold">
                A real human picks this up
              </h3>
              <ol className="mt-5 space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-pink-500 text-white text-xs font-bold">
                    1
                  </span>
                  <p className="text-white/85">
                    A coordinator confirms scope within{" "}
                    <span className="font-semibold">24 hours</span>.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-pink-500 text-white text-xs font-bold">
                    2
                  </span>
                  <p className="text-white/85">
                    Mockups + tiered pricing shared within{" "}
                    <span className="font-semibold">48 hours</span>.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-pink-500 text-white text-xs font-bold">
                    3
                  </span>
                  <p className="text-white/85">
                    Approve, pay 50% advance, production locks.
                  </p>
                </li>
              </ol>

              <div className="mt-7 grid grid-cols-2 gap-3 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-pink-300" />
                  5d dispatch SLA
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-pink-300" />
                  GST-compliant
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-brand-pink-300" />
                  Email confirmations
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-pink-300" />
                  Free mockups
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
