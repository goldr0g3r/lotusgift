"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Input, Label } from "@/components/ui/Input";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@brightline.in");
  const [password, setPassword] = useState("demo-password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn({ email, password, role: "client" });
      router.push("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const demoSignIn = async () => {
    setLoading(true);
    await signIn({ asDemo: true, role: "client" });
    router.push("/portal");
  };

  return (
    <AuthSplitLayout
      eyebrow="Client portal"
      title="Welcome back"
      description="Sign in to manage your quotes, track orders and re-run campaigns."
      badge="Trusted by 500+ brands"
      quote="Lotus Gift turned our quarterly gifting program into something the team actually looks forward to."
      quoteAuthor="Ananya Mehta, Marketing Lead at Northwind"
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
        Sign in as demo client
      </button>
      <div className="relative my-4 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-stone-200" />
        <span className="relative bg-white px-3 text-xs uppercase tracking-wider font-semibold text-stone-400">
          or with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="pr-12"
              placeholder="Enter your password"
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
              <ArrowRight className="w-4 h-4" />
            )}
          </span>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/portal/register"
          className="font-semibold text-brand-green-700 hover:text-brand-green-800"
        >
          Create one
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-stone-400">
        Admin?{" "}
        <Link
          href="/admin/login"
          className="font-semibold text-brand-ink-700 hover:underline"
        >
          Sign in here
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
