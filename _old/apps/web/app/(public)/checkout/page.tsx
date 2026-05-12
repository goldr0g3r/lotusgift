"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Landmark,
  Mail,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { formatInr } from "@/components/ui/PriceTag";
import { useCart, placeOrder } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { toast } from "@/components/ui/Toaster";
import type { Order } from "@/lib/api-types";
import { cn } from "@/lib/cn";

const paymentMethods = [
  { id: "upi", label: "UPI", icon: Smartphone, sub: "Pay with any UPI app" },
  { id: "card", label: "Credit / Debit", icon: CreditCard, sub: "Visa, Master, RuPay" },
  { id: "netbanking", label: "Net Banking", icon: Landmark, sub: "All major banks" },
  { id: "wallet", label: "Wallet", icon: Wallet, sub: "Razorpay wallets" },
];

export default function CheckoutPage() {
  const cart = useCart();
  const { data: session } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [placed, setPlaced] = useState<Order | null>(null);

  const [form, setForm] = useState({
    contactName: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    phone: session?.user?.phone ?? "",
    company: session?.user?.company ?? "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
    paymentMethod: "upi",
  });

  const subtotal = cart.subtotal;
  const discount = Math.round(subtotal * 0.04);
  const tax = Math.round((subtotal - discount) * 0.18);
  const total = subtotal - discount + tax;

  const onSubmit = () => {
    const order = placeOrder(cart.items, {
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      company: form.company,
      address: form.address,
      city: form.city,
      state: form.state,
      zipCode: form.zipCode,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
    });
    cart.clear();
    setPlaced(order);
    toast.success(`Order ${order.orderNumber} placed`);
  };

  if (placed) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-4xl bg-white border border-stone-100 p-10 sm:p-14 text-center shadow-soft">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-50 text-brand-green-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 h2-display">Order confirmed</h1>
          <p className="mt-3 text-stone-500">
            Thanks for your order. We&apos;ve emailed a confirmation to{" "}
            <span className="font-semibold text-brand-ink-800">{form.email || "your inbox"}</span>.
          </p>
          <div className="mt-6 inline-block rounded-full bg-stone-100 px-5 py-2 text-sm font-semibold text-brand-ink-800">
            Order #{placed.orderNumber}
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <Link href="/portal/orders" className="btn-primary btn-sm w-full">
              Track order
            </Link>
            <Link href="/products" className="btn-outline rounded-full text-sm w-full">
              Keep shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.ready && cart.items.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center rounded-4xl bg-white border border-stone-100 p-10 sm:p-14">
          <h1 className="h2-display">Your cart is empty</h1>
          <p className="mt-3 text-stone-500">
            Add a few products before checking out.
          </p>
          <Link href="/products" className="btn-primary btn-sm mt-6 mx-auto">
            Browse catalog
          </Link>
        </div>
      </div>
    );
  }

  const StepBadge = ({ n, label }: { n: number; label: string }) => (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
          step >= n ? "bg-brand-ink-900 text-white" : "bg-stone-100 text-stone-500",
        )}
      >
        {n}
      </span>
      <span
        className={cn(
          "text-xs font-semibold",
          step >= n ? "text-brand-ink-900" : "text-stone-400",
        )}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="eyebrow">Checkout</span>
            <h1 className="mt-3 h2-display">Complete your order</h1>
          </div>
          <div className="hidden sm:flex items-center gap-5">
            <StepBadge n={1} label="Contact" />
            <span className="h-px w-8 bg-stone-200" />
            <StepBadge n={2} label="Shipping" />
            <span className="h-px w-8 bg-stone-200" />
            <StepBadge n={3} label="Payment" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
              <h2 className="font-display text-lg font-bold text-brand-ink-900 inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-green-600" />
                Contact details
              </h2>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Contact name</Label>
                  <Input
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="e.g. Aanya Krishnan"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label>Company (optional)</Label>
                  <Input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Your company"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
              <h2 className="font-display text-lg font-bold text-brand-ink-900">
                Shipping address
              </h2>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Street address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Building, area"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label>PIN code</Label>
                  <Input
                    value={form.zipCode}
                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Order notes (optional)</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Delivery instructions, gate access…"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
              <h2 className="font-display text-lg font-bold text-brand-ink-900 inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-green-600" />
                Payment method
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Stubbed for preview — no payment will be captured.
              </p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setForm({ ...form, paymentMethod: m.id })}
                    className={cn(
                      "rounded-2xl border p-4 text-left flex items-start gap-3 transition-all",
                      form.paymentMethod === m.id
                        ? "border-brand-green-500 bg-brand-green-50/60"
                        : "border-stone-200 hover:border-brand-ink-300",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-full",
                        form.paymentMethod === m.id
                          ? "bg-brand-green-500 text-white"
                          : "bg-stone-100 text-brand-ink-800",
                      )}
                    >
                      <m.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-brand-ink-900">{m.label}</p>
                      <p className="text-xs text-stone-500">{m.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-6 rounded-3xl bg-white border border-stone-100 p-6 shadow-soft">
              <h2 className="text-lg font-bold text-brand-ink-900">Order summary</h2>
              <div className="mt-4 divide-y divide-stone-100">
                {cart.items.map((it) => (
                  <div
                    key={it.productId}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-ink-900 truncate">
                        {it.name}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Qty {it.qty} · {formatInr(it.unitPrice)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0">
                      {formatInr(it.qty * it.unitPrice)}
                    </p>
                  </div>
                ))}
              </div>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Subtotal</dt>
                  <dd className="font-semibold tabular-nums">{formatInr(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Volume discount</dt>
                  <dd className="font-semibold text-brand-green-700 tabular-nums">
                    − {formatInr(discount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">GST (18%)</dt>
                  <dd className="font-semibold tabular-nums">{formatInr(tax)}</dd>
                </div>
              </dl>
              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-ink-900">Total</span>
                <span className="text-2xl font-extrabold text-brand-ink-900 tabular-nums">
                  {formatInr(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  onSubmit();
                }}
                className="btn-pink btn-lg w-full mt-6"
              >
                <span className="btn-disc">
                  <ArrowRight className="h-4 w-4" />
                </span>
                Place order · {formatInr(total)}
              </button>
              <Link
                href="/cart"
                className="block text-center mt-3 text-xs font-semibold text-stone-500 hover:text-brand-ink-800"
              >
                Back to cart
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
