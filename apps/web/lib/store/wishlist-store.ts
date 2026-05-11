"use client";

import { useEffect, useState } from "react";

const KEY = "lg.wishlist";
let ids = new Set<string>();
let hydrated = false;
const subs = new Set<() => void>();

const read = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
};

const write = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
};

const emit = () => subs.forEach((s) => s());

const hydrate = () => {
  if (hydrated) return;
  hydrated = true;
  ids = read();
};

export const wishlist = {
  toggle(id: string) {
    hydrate();
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    write();
    emit();
  },
  add(id: string) {
    hydrate();
    ids.add(id);
    write();
    emit();
  },
  remove(id: string) {
    hydrate();
    ids.delete(id);
    write();
    emit();
  },
  has(id: string) {
    hydrate();
    return ids.has(id);
  },
  list() {
    hydrate();
    return [...ids];
  },
};

export function useWishlist() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    setItems(wishlist.list());
    const sub = () => setItems(wishlist.list());
    subs.add(sub);
    return () => {
      subs.delete(sub);
    };
  }, []);
  return {
    items,
    count: items.length,
    has: (id: string) => items.includes(id),
    toggle: wishlist.toggle,
    add: wishlist.add,
    remove: wishlist.remove,
  };
}
