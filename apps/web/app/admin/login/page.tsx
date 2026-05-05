"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Input, Label } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn.email({
      email,
      password,
      callbackURL: "/admin",
    });
    if (error) setError(error.message || "Login failed");
    setLoading(false);
  };

  return (
    <AuthSplitLayout
      eyebrow="Admin"
      title="Sign in to admin"
      description="Manage products, quotes, orders, and content."
      badge="Restricted access"
      quote="A clean ops dashboard means our team can ship great work, faster."
      quoteAuthor="The Lotus Gift team"
    >
      {error && (
        <div className="mb-6 flex items-start gap-3 p-3 rounded-xl bg-lotus-rose-50 text-lotus-rose-700 text-sm ring-1 ring-lotus-rose-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@lotusgift.com"
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
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            <ShieldCheck className="w-4 h-4" />
          )}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-xs text-stone-400 text-center">
        Demo: admin@lotusgift.com / admin123
      </p>
    </AuthSplitLayout>
  );
}
