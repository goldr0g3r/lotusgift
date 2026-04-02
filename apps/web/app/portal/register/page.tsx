"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserPlus, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { signUp } from "@/lib/auth-client";

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

    if (error) {
      setError(error.message || "Registration failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Lotus Gift"
            width={160}
            height={36}
            className="mx-auto object-contain"
          />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Register for the client portal to manage quotes &amp; orders
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                className="input-field"
                placeholder="John Smith"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>

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
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
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
                  minLength={6}
                  autoComplete="new-password"
                  className="input-field pr-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
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

            <div>
              <label htmlFor="phone" className="label">
                Phone Number{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                className="input-field"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="company" className="label">
                Company Name{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="company"
                type="text"
                autoComplete="organization"
                className="input-field"
                placeholder="Acme Corporation"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/portal/login"
            className="text-brand-green-600 hover:text-brand-green-700 font-medium"
          >
            Sign in
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
