"use client";

import { useEffect, useState } from "react";
import { mockOrders, mockQuotes } from "@/lib/mock-data";
import type { BagLine } from "./bag-store";
import type { Order, OrderStatus, Quote, QuoteStatus } from "@/lib/api-types";

// Lightweight in-memory + localStorage store of user-created orders/quotes so
// that submitting checkout or a quote request reflects in the portal pages.

const ORDERS_KEY = "lg.userOrders";
const QUOTES_KEY = "lg.userQuotes";

type Listener = () => void;
const orderSubs = new Set<Listener>();
const quoteSubs = new Set<Listener>();

let userOrders: Order[] = [];
let userQuotes: Quote[] = [];
let hydrated = false;

const hydrate = () => {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const o = window.localStorage.getItem(ORDERS_KEY);
    if (o) userOrders = JSON.parse(o) as Order[];
    const q = window.localStorage.getItem(QUOTES_KEY);
    if (q) userQuotes = JSON.parse(q) as Quote[];
  } catch {
    // ignore
  }
};

const persistOrders = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(userOrders));
  } catch {
    // ignore
  }
};
const persistQuotes = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUOTES_KEY, JSON.stringify(userQuotes));
  } catch {
    // ignore
  }
};

const emitOrders = () => orderSubs.forEach((l) => l());
const emitQuotes = () => quoteSubs.forEach((l) => l());

const buildLineTotals = (lines: BagLine[]) => {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const discount = Math.round(subtotal * 0.04);
  const tax = Math.round((subtotal - discount) * 0.18);
  const total = subtotal - discount + tax;
  return { subtotal, discount, tax, total };
};

export type CheckoutMeta = {
  contactName: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  paymentMethod: string;
  notes?: string;
};

export function placeOrder(lines: BagLine[], meta: CheckoutMeta): Order {
  hydrate();
  const { subtotal, discount, tax, total } = buildLineTotals(lines);
  const id = `local-o-${Date.now()}`;
  const orderNumber = `LG-O-${String(7900 + userOrders.length + 1).padStart(4, "0")}`;
  const items = lines.map((l, j) => ({
    id: `${id}-i-${j}`,
    productId: l.productId,
    quantity: l.qty,
    unitPrice: l.unitPrice,
    total: l.unitPrice * l.qty,
    product: {
      id: l.productId,
      name: l.name,
      slug: l.slug,
      description: "",
      sku: l.productId,
      priceFrom: l.unitPrice,
      wholesaleMinQty: l.minOrderQty,
      categoryId: "",
      imageUrl: l.imageUrl,
      stock: 0,
      minOrderQty: l.minOrderQty,
      isActive: true,
      isFeatured: false,
      isWholesale: true,
      createdAt: new Date().toISOString(),
      category: {
        id: "",
        name: l.category,
        slug: "",
        sortOrder: 0,
        isActive: true,
      },
      images: [],
    },
  }));
  const order: Order = {
    id,
    orderNumber,
    status: "CONFIRMED" as OrderStatus,
    subtotal,
    discount,
    tax,
    total,
    shippingAddress: `${meta.address}, ${meta.city}, ${meta.state} ${meta.zipCode}`,
    notes: meta.notes,
    razorpayOrderId: `order_${Math.random().toString(36).slice(2, 12)}`,
    razorpayPaymentId: `pay_${Math.random().toString(36).slice(2, 12)}`,
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    items,
  };
  userOrders = [order, ...userOrders];
  persistOrders();
  emitOrders();
  return order;
}

export type QuoteMeta = {
  contactName: string;
  email: string;
  phone: string;
  company?: string;
  notes?: string;
};

export function submitQuoteRequest(lines: BagLine[], meta: QuoteMeta): Quote {
  hydrate();
  const { subtotal, discount, tax, total } = buildLineTotals(lines);
  const id = `local-q-${Date.now()}`;
  const quoteNumber = `LG-Q-${String(2500 + userQuotes.length + 1).padStart(4, "0")}`;
  const items = lines.map((l, j) => ({
    id: `${id}-qi-${j}`,
    productId: l.productId,
    quantity: l.qty,
    unitPrice: l.unitPrice,
    total: l.unitPrice * l.qty,
    customization: l.customization,
    product: {
      id: l.productId,
      name: l.name,
      slug: l.slug,
      description: "",
      sku: l.productId,
      priceFrom: l.unitPrice,
      wholesaleMinQty: l.minOrderQty,
      categoryId: "",
      imageUrl: l.imageUrl,
      stock: 0,
      minOrderQty: l.minOrderQty,
      isActive: true,
      isFeatured: false,
      isWholesale: true,
      createdAt: new Date().toISOString(),
      category: {
        id: "",
        name: l.category,
        slug: "",
        sortOrder: 0,
        isActive: true,
      },
      images: [],
    },
  }));
  const quote: Quote = {
    id,
    quoteNumber,
    status: "SENT" as QuoteStatus,
    subtotal,
    discount,
    tax,
    total,
    notes: meta.notes,
    validUntil: new Date(Date.now() + 21 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    items,
  };
  userQuotes = [quote, ...userQuotes];
  persistQuotes();
  emitQuotes();
  return quote;
}

export function listUserOrders(): Order[] {
  hydrate();
  return [...userOrders, ...mockOrders];
}
export function listUserQuotes(): Quote[] {
  hydrate();
  return [...userQuotes, ...mockQuotes];
}

export function useUserOrders() {
  const [items, setItems] = useState<Order[]>([]);
  useEffect(() => {
    setItems(listUserOrders());
    const fn = () => setItems(listUserOrders());
    orderSubs.add(fn);
    return () => {
      orderSubs.delete(fn);
    };
  }, []);
  return items;
}

export function useUserQuotes() {
  const [items, setItems] = useState<Quote[]>([]);
  useEffect(() => {
    setItems(listUserQuotes());
    const fn = () => setItems(listUserQuotes());
    quoteSubs.add(fn);
    return () => {
      quoteSubs.delete(fn);
    };
  }, []);
  return items;
}
