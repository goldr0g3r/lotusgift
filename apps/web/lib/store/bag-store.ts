"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/api-types";

export type BagLine = {
  productId: string;
  slug: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  qty: number;
  minOrderQty: number;
  category: string;
  customization?: string;
};

type Listener = () => void;

function createBagStore(key: string) {
  let lines: BagLine[] = [];
  let hydrated = false;
  const subs = new Set<Listener>();

  const readLocal = (): BagLine[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw) as BagLine[];
    } catch {
      return [];
    }
  };

  const writeLocal = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(lines));
    } catch {
      // ignore quota errors
    }
  };

  const emit = () => {
    subs.forEach((l) => l());
  };

  const hydrate = () => {
    if (hydrated) return;
    hydrated = true;
    lines = readLocal();
  };

  const add = (product: Product, qty?: number, customization?: string) => {
    hydrate();
    const q = qty ?? product.minOrderQty;
    const existing = lines.find((l) => l.productId === product.id);
    if (existing) {
      existing.qty += q;
      if (customization) existing.customization = customization;
    } else {
      lines.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.imageUrl ?? product.images?.[0]?.url,
        unitPrice: product.wholesalePrice ?? product.priceFrom,
        qty: q,
        minOrderQty: product.minOrderQty,
        category: product.category.name,
        customization,
      });
    }
    writeLocal();
    emit();
  };

  const updateQty = (productId: string, qty: number) => {
    hydrate();
    const line = lines.find((l) => l.productId === productId);
    if (!line) return;
    line.qty = Math.max(line.minOrderQty, qty);
    writeLocal();
    emit();
  };

  const remove = (productId: string) => {
    hydrate();
    lines = lines.filter((l) => l.productId !== productId);
    writeLocal();
    emit();
  };

  const clear = () => {
    hydrate();
    lines = [];
    writeLocal();
    emit();
  };

  const list = (): BagLine[] => {
    hydrate();
    return [...lines];
  };

  const subscribe = (l: Listener) => {
    subs.add(l);
    return () => {
      subs.delete(l);
    };
  };

  return { add, updateQty, remove, clear, list, subscribe };
}

function useBag(store: ReturnType<typeof createBagStore>) {
  const [items, setItems] = useState<BagLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(store.list());
    setReady(true);
    return store.subscribe(() => setItems(store.list()));
  }, [store]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const lineCount = items.length;
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  return {
    items,
    count,
    lineCount,
    subtotal,
    ready,
    add: store.add,
    updateQty: store.updateQty,
    remove: store.remove,
    clear: store.clear,
  };
}

export const cartStore = createBagStore("lg.cart");
export const quoteBagStore = createBagStore("lg.quote");

export function useCart() {
  return useBag(cartStore);
}

export function useQuoteBag() {
  return useBag(quoteBagStore);
}
