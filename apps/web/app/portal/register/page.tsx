"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
} from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Input, Label } from "@/components/ui/Input";

export default function PortalRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    company: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: form.email,
        password: form.password,
        name: form.name,
        company: form.company,
        phone: form.phone,
      });
      router.push("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="Create account"
      title="Join the client portal"
      description="Track quotes, orders and reorders in one place. Free to join, no credit card."
      badge="Free to join"
      quote="Re-ordering branded merch went from a 3-week chase to a 3-click confirmation."
      quoteAuthor="Rahul Khanna, Brightline Health"
    >
      {error && (
        <div className="mb-6 flex items-start gap-3 p-3 rounded-2xl bg-rose-50 text-rose-700 text-sm ring-1 ring-rose-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Aanya Krishnan"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              className="pr-12"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="phone">
              Phone <span className="text-stone-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="company">
              Company <span className="text-stone-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="company"
              type="text"
              autoComplete="organization"
              placeholder="Acme Inc."
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary btn-lg w-full !mt-6"
        >
          <span className="btn-disc">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </span>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link
          href="/portal/login"
          className="font-semibold text-brand-green-700 hover:text-brand-green-800"
        >
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
