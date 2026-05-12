"use client";

import { useEffect, useState } from "react";
import { mockAdminUser, mockUser } from "./mock-data";
import type { User } from "./api-types";

// In-memory + localStorage-backed session stub. Lets the UI redesign run
// without the real auth backend wired up.

const STORAGE_KEY = "lg.session";

export type Session = {
  user: User & { role: "client" | "admin" | string };
} | null;

type Listener = (s: Session) => void;
const listeners = new Set<Listener>();

let current: Session = null;
let hydrated = false;

function readStorage(): Session {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function writeStorage(s: Session) {
  if (typeof window === "undefined") return;
  try {
    if (s) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore quota / privacy errors
  }
}

function emit(s: Session) {
  current = s;
  writeStorage(s);
  listeners.forEach((l) => l(s));
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  current = readStorage();
}

export function useSession(): { data: Session; isPending: boolean } {
  const [state, setState] = useState<{ data: Session; isPending: boolean }>(() => ({
    data: null,
    isPending: true,
  }));

  useEffect(() => {
    hydrate();
    setState({ data: current, isPending: false });
    const onChange = (s: Session) =>
      setState({ data: s, isPending: false });
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return state;
}

export async function getSession(): Promise<Session> {
  hydrate();
  return current;
}

type SignInResult = { data: { user: User } | null; error?: { message: string } };

type SignInArgs = {
  email?: string;
  password?: string;
  role?: "client" | "admin";
  asDemo?: boolean;
  fetchOptions?: { onSuccess?: () => void; onError?: (e: unknown) => void };
};

export async function signIn(args: SignInArgs = {}): Promise<SignInResult> {
  await new Promise((r) => setTimeout(r, 280));
  const role = args.role ?? "client";
  const baseUser = role === "admin" ? mockAdminUser : mockUser;
  const user: User = args.email
    ? { ...baseUser, email: args.email, name: baseUser.name }
    : baseUser;
  const session: Session = { user: { ...user, role } };
  emit(session);
  args.fetchOptions?.onSuccess?.();
  return { data: { user } };
}

export async function signUp(args: {
  email: string;
  password?: string;
  name: string;
  company?: string;
  phone?: string;
}): Promise<SignInResult> {
  await new Promise((r) => setTimeout(r, 320));
  const user: User = {
    ...mockUser,
    email: args.email,
    name: args.name,
    company: args.company ?? mockUser.company,
    phone: args.phone ?? mockUser.phone,
    role: "client",
  };
  const session: Session = { user };
  emit(session);
  return { data: { user } };
}

export async function signOut(args?: {
  fetchOptions?: { onSuccess?: () => void };
}) {
  await new Promise((r) => setTimeout(r, 180));
  emit(null);
  args?.fetchOptions?.onSuccess?.();
}

export const authClient = { signIn, signUp, signOut, useSession, getSession };
