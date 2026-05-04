"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { LogIn, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { signIn } from "@/lib/auth-client";

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

    if (error) {
      setError(error.message || "Invalid credentials");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="justify-center mx-auto" />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Client Portal
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage your quotes and orders
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input-field"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/portal/register"
            className="text-brand-green-600 hover:text-brand-green-700 font-medium"
          >
            Create one here
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600">
            &larr; Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
