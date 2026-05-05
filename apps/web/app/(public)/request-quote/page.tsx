"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Minus,
  Trash2,
  Send,
  Package,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { Product } from "@/lib/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";
import { productImage } from "@/lib/images";
import { cn } from "@/lib/cn";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type Step = 1 | 2 | 3;

type LineItem = {
  productId: string;
  product: Product;
  quantity: number;
  customization: string;
};

const STORAGE_KEY = "lotus.quote.cart.v1";

function loadCart(): LineItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LineItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: LineItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota
  }
}

function StepIndicator({ step }: { step: Step }) {
  const labels = ["Your Details", "Choose Products", "Review & Submit"];
  return (
    <ol className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
      {labels.map((label, i) => {
        const idx = (i + 1) as Step;
        const active = step === idx;
        const done = step > idx;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold",
                done
                  ? "bg-lotus-emerald-700 text-white"
                  : active
                    ? "bg-lotus-emerald-50 text-lotus-emerald-800 ring-2 ring-lotus-emerald-700"
                    : "bg-stone-100 text-stone-400",
              )}
            >
              {done ? <CheckCircle className="h-4 w-4" /> : idx}
            </span>
            <span
              className={cn(
                "font-medium",
                active ? "text-stone-900" : done ? "text-stone-700" : "text-stone-400",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function RequestQuotePage() {
  const params = useSearchParams();
  const initialProductSlug = params?.get("product");
  const initialQty = Number(params?.get("qty") ?? "0");

  const [step, setStep] = useState<Step>(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");

  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<LineItem[]>(() => loadCart());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list: Product[] = Array.isArray(data) ? data : data.data ?? [];
        setProducts(list);
        if (initialProductSlug) {
          const p = list.find((x) => x.slug === initialProductSlug);
          if (p) {
            setItems((cur) =>
              cur.some((i) => i.productId === p.id)
                ? cur.map((i) =>
                    i.productId === p.id
                      ? {
                          ...i,
                          quantity:
                            initialQty > 0
                              ? initialQty
                              : Math.max(p.minOrderQty || 1, i.quantity),
                        }
                      : i,
                  )
                : [
                    ...cur,
                    {
                      productId: p.id,
                      product: p,
                      quantity: initialQty > 0 ? initialQty : p.minOrderQty || 1,
                      customization: "",
                    },
                  ],
            );
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [initialProductSlug, initialQty]);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addProduct = (p: Product) => {
    setItems((cur) =>
      cur.some((i) => i.productId === p.id)
        ? cur
        : [
            ...cur,
            {
              productId: p.id,
              product: p,
              quantity: p.minOrderQty || 1,
              customization: "",
            },
          ],
    );
  };

  const updateQty = (id: string, delta: number) =>
    setItems((cur) =>
      cur.map((i) =>
        i.productId === id
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i,
      ),
    );

  const setQtyDirect = (id: string, qty: number) =>
    setItems((cur) =>
      cur.map((i) => (i.productId === id ? { ...i, quantity: Math.max(1, qty) } : i)),
    );

  const updateCustomization = (id: string, value: string) =>
    setItems((cur) =>
      cur.map((i) => (i.productId === id ? { ...i, customization: value } : i)),
    );

  const removeProduct = (id: string) =>
    setItems((cur) => cur.filter((i) => i.productId !== id));

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setContact((p) => ({ ...p, [e.target.name]: e.target.value }));

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q),
    );
  }, [productSearch, products]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.product.priceFrom, 0),
    [items],
  );

  const canStep1 = contact.name.trim() && contact.email.trim();
  const canStep2 = items.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canStep1 || !canStep2) {
      setError("Please complete all steps before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          companyName: contact.company,
          notes,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            customization: i.customization || undefined,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(data.message || "Failed to submit quote");
      }
      setSubmitted(true);
      setItems([]);
      saveCart([]);
      toast.success("Quote request submitted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 py-20" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-20">
          <div className="card p-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100">
              <CheckCircle className="h-8 w-8 text-lotus-emerald-700" />
            </div>
            <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">
              Quote request submitted!
            </h2>
            <p className="text-stone-500 max-w-md mx-auto">
              Thank you, {contact.name}! Our team will review your request and get back
              to you within 24 hours with a detailed quote.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/products" className="btn-secondary">
                Continue browsing
              </Link>
              <Link href="/" className="btn-primary">
                Back to home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <section className="bg-lotus-cream border-b border-stone-200">
        <div className="absolute inset-0 lotus-pattern opacity-70" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <span className="eyebrow">Wholesale enquiry</span>
          <h1 className="mt-3 h1-display !text-4xl sm:!text-5xl">
            Request a Quote
          </h1>
          <p className="mt-3 max-w-xl text-base text-stone-500">
            Tell us your timeline and quantities — we&apos;ll come back with options,
            mockups and pricing within 24 hours.
          </p>
          <div className="mt-8 max-w-3xl">
            <StepIndicator step={step} />
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="card p-6 sm:p-8 animate-fade-in">
              <h2 className="font-display text-xl font-bold text-stone-900">
                Your details
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                We&apos;ll use these to send your quote and confirm timelines.
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">
                    Full name <span className="text-lotus-rose-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={contact.name}
                    onChange={handleContactChange}
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
                    value={contact.email}
                    onChange={handleContactChange}
                    placeholder="jane@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={contact.phone}
                    onChange={handleContactChange}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={contact.company}
                    onChange={handleContactChange}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={!canStep1}
                  onClick={() => setStep(2)}
                  className="btn-primary disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6 lg:grid-cols-5 animate-fade-in">
              <div className="lg:col-span-3 card p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-xl font-bold text-stone-900">
                    Add products
                  </h2>
                  <span className="text-xs text-stone-400">
                    {items.length} selected
                  </span>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search the catalog..."
                    className="!pl-9"
                  />
                </div>

                {loadingProducts ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center">
                    <Package className="mx-auto mb-2 h-10 w-10 text-stone-200" />
                    <p className="text-sm text-stone-500">No products found</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
                    {filteredProducts.map((p) => {
                      const added = items.some((i) => i.productId === p.id);
                      const img = productImage(p);
                      return (
                        <div
                          key={p.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 transition-all",
                            added
                              ? "border-lotus-emerald-200 bg-lotus-emerald-50/40"
                              : "border-stone-200 hover:bg-stone-50",
                          )}
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-200">
                            <ImageWithFallback src={img.src} alt={p.name} sizes="56px" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-stone-900">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-stone-400">
                              ₹{p.priceFrom.toLocaleString("en-IN")} · MOQ {p.minOrderQty}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addProduct(p)}
                            disabled={added}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                              added
                                ? "bg-lotus-emerald-700 text-white cursor-default"
                                : "border border-stone-200 text-stone-500 hover:border-lotus-emerald-400 hover:text-lotus-emerald-700",
                            )}
                          >
                            {added ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <div className="card p-6 sticky top-28">
                  <h3 className="font-display text-lg font-bold text-stone-900">
                    Selected ({items.length})
                  </h3>
                  {items.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500">
                      <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                      Pick a few products to start your quote.
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {items.map((item) => (
                        <li
                          key={item.productId}
                          className="rounded-xl border border-stone-200 bg-white p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-200">
                              <ImageWithFallback
                                src={productImage(item.product).src}
                                alt={item.product.name}
                                sizes="48px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-stone-900">
                                {item.product.name}
                              </p>
                              <p className="text-[11px] text-stone-400">
                                ₹{item.product.priceFrom.toLocaleString("en-IN")} · MOQ{" "}
                                {item.product.minOrderQty}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProduct(item.productId)}
                              className="text-stone-400 hover:text-lotus-rose-600"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white">
                              <button
                                type="button"
                                onClick={() => updateQty(item.productId, -1)}
                                className="px-2 py-1 text-stone-500 hover:text-stone-900"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  setQtyDirect(
                                    item.productId,
                                    Number(e.target.value || 1),
                                  )
                                }
                                className="w-12 border-0 bg-transparent text-center text-xs font-semibold focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateQty(item.productId, 1)}
                                className="px-2 py-1 text-stone-500 hover:text-stone-900"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={item.customization}
                              onChange={(e) =>
                                updateCustomization(item.productId, e.target.value)
                              }
                              placeholder="Branding notes"
                              className="flex-1 rounded-lg border border-stone-200 px-2 py-1 text-xs focus:outline-none focus:border-lotus-emerald-500 focus:ring-2 focus:ring-lotus-emerald-500/20"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
                    <span className="text-stone-500">Indicative subtotal</span>
                    <span className="font-bold text-stone-900">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={!canStep2}
                  onClick={() => setStep(3)}
                  className="btn-primary disabled:opacity-50"
                >
                  Review
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
              <div className="lg:col-span-2 card p-6 space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-stone-900">
                    Review your request
                  </h2>
                  <p className="text-sm text-stone-500">
                    Confirm everything looks good and add any final notes.
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400 mb-2">
                    Contact
                  </p>
                  <p className="text-sm font-medium text-stone-900">{contact.name}</p>
                  <p className="text-sm text-stone-500">{contact.email}</p>
                  {contact.phone && (
                    <p className="text-sm text-stone-500">{contact.phone}</p>
                  )}
                  {contact.company && (
                    <p className="text-sm text-stone-500">{contact.company}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-stone-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400 mb-3">
                    Items ({items.length})
                  </p>
                  <ul className="divide-y divide-stone-100">
                    {items.map((item) => (
                      <li key={item.productId} className="py-3 flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-200">
                          <ImageWithFallback
                            src={productImage(item.product).src}
                            alt={item.product.name}
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-stone-900">
                            {item.product.name}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Qty {item.quantity} · ₹
                            {item.product.priceFrom.toLocaleString("en-IN")} each
                          </p>
                          {item.customization && (
                            <p className="mt-1 text-[11px] text-lotus-gold-700">
                              <Sparkles className="mr-1 inline h-3 w-3" />
                              {item.customization}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-stone-900 tabular-nums">
                          ₹
                          {(item.quantity * item.product.priceFrom).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label htmlFor="notes">Anything else we should know?</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Timelines, delivery cities, target budget, branding requirements..."
                  />
                </div>
              </div>

              <div className="lg:col-span-1 card p-6 sticky top-28 self-start">
                <h3 className="font-display text-lg font-bold text-stone-900">
                  Summary
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Items</span>
                    <span className="font-medium text-stone-900">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total units</span>
                    <span className="font-medium text-stone-900">
                      {items.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-stone-100 pt-3">
                    <span className="text-stone-500">Indicative subtotal</span>
                    <span className="font-bold text-stone-900">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-stone-400">
                  Final pricing depends on branding, packaging and volume tier.
                </p>
                {error && (
                  <p className="mt-3 rounded-lg bg-lotus-rose-50 px-3 py-2 text-sm text-lotus-rose-700 ring-1 ring-lotus-rose-100">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting || !canStep1 || !canStep2}
                  className="btn-primary mt-5 w-full justify-center disabled:opacity-60"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit request
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-ghost mt-2 w-full justify-center"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Edit items
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
