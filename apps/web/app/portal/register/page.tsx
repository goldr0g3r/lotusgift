"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { UserPlus, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Input, Label } from "@/components/ui/Input";

export default function PortalRegisterPage() {
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
    const { error } = await signUp.email({
      email: form.email,
      password: form.password,
      name: form.name,
      callbackURL: "/portal",
    });
    if (error) setError(error.message || "Registration failed");
    setLoading(false);
  };

  return (
    <AuthSplitLayout
      eyebrow="Create account"
      title="Join the client portal"
      description="Track quotes, orders and reorders in one place."
      badge="Free to join"
      quote="Re-ordering branded merch went from a 3-week chase to a 3-click confirmation."
      quoteAuthor="Rahul Khanna, Brightline Health"
    >
      {error && (
        <div className="mb-6 flex items-start gap-3 p-3 rounded-xl bg-lotus-rose-50 text-lotus-rose-700 text-sm ring-1 ring-lotus-rose-100">
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
            placeholder="John Smith"
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
              className="pr-10"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
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
          className="btn-primary w-full justify-center !mt-6"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link
          href="/portal/login"
          className="font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
        >
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
