"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LogIn, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Input, Label } from "@/components/ui/Input";

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn.email({
      email,
      password,
      callbackURL: "/portal",
    });
    if (error) setError(error.message || "Invalid credentials");
    setLoading(false);
  };

  return (
    <AuthSplitLayout
      eyebrow="Client portal"
      title="Welcome back"
      description="Sign in to manage your quotes and orders."
      badge="Trusted by 1,200+ teams"
      quote="Lotus Gift turned our quarterly gifting program into something the team actually looks forward to."
      quoteAuthor="Ananya Mehta, Marketing Lead at Northwind"
    >
      {error && (
        <div className="mb-6 flex items-start gap-3 p-3 rounded-xl bg-lotus-rose-50 text-lotus-rose-700 text-sm ring-1 ring-lotus-rose-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="pr-10"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/portal/register"
          className="font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
        >
          Create one
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
