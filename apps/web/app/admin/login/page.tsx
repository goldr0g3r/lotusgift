"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Input, Label } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@lotusgift.com");
  const [password, setPassword] = useState("demo-password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn({ email, password, role: "admin" });
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const demoSignIn = async () => {
    setLoading(true);
    await signIn({ asDemo: true, role: "admin" });
    router.push("/admin");
  };

  return (
    <AuthSplitLayout
      eyebrow="Admin console"
      title="Operate Lotus Gift"
      description="Manage products, orders, quotes and content from one panel."
      badge="Admin access"
      imageSrc="https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?auto=format&fit=crop&w=1400&q=80"
      imageAlt="Lotus Gift workshop"
      quote="The admin is fast, opinionated, and exposes only what the team actually needs."
      quoteAuthor="Lotus Gift operations team"
    >
      {error && (
        <div className="mb-6 flex items-start gap-3 p-3 rounded-2xl bg-rose-50 text-rose-700 text-sm ring-1 ring-rose-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={demoSignIn}
        disabled={loading}
        className="btn-pink btn-lg w-full mb-5"
      >
        <span className="btn-disc">
          <Sparkles className="h-4 w-4" />
        </span>
        Sign in as demo admin
      </button>
      <div className="relative my-4 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-stone-200" />
        <span className="relative bg-white px-3 text-xs uppercase tracking-wider font-semibold text-stone-400">
          or with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Admin email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
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
              className="pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary btn-lg w-full"
        >
          <span className="btn-disc">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
          </span>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl bg-stone-100 p-3 text-xs text-stone-600 inline-flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-green-600" />
        Admin access is audit-logged and rate-limited.
      </div>

      <p className="mt-6 text-center text-xs text-stone-400">
        Not an admin?{" "}
        <Link
          href="/portal/login"
          className="font-semibold text-brand-ink-700 hover:underline"
        >
          Use the client portal
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
