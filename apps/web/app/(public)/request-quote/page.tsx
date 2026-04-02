"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Plus,
  Minus,
  Trash2,
  Send,
  Package,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import type { Product } from "@/lib/api";

const API = "http://localhost:3001/api";

interface QuoteLineItem {
  productId: string;
  product: Product;
  quantity: number;
  customization: string;
}

export default function RequestQuotePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");

  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  const [items, setItems] = useState<QuoteLineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json();
      })
      .then((data) => setProducts(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  function addProduct(product: Product) {
    if (items.some((i) => i.productId === product.id)) return;
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        product,
        quantity: product.minOrderQty || 1,
        customization: "",
      },
    ]);
  }

  function removeProduct(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateQuantity(productId: string, delta: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i,
      ),
    );
  }

  function updateCustomization(productId: string, value: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, customization: value } : i,
      ),
    );
  }

  function handleContactChange(e: React.ChangeEvent<HTMLInputElement>) {
    setContact((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Please add at least one product to your quote.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          companyName: contact.company,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            customization: i.customization || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(data.message || "Failed to submit quote");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredProducts = productSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.category?.name?.toLowerCase().includes(productSearch.toLowerCase()),
      )
    : products;

  if (submitted) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-brand-green-500 to-brand-green-700 py-16" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
          <div className="card p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-brand-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quote Request Submitted!
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Thank you, {contact.name}! Our team will review your request and
              get back to you within 24 hours with a detailed quote.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link href="/products" className="btn-secondary">
                Continue Browsing
              </Link>
              <Link href="/" className="btn-primary">
                Back to Home
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green-500 via-brand-green-600 to-brand-green-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-brand-pink-500 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Request a <span className="text-brand-pink-300">Quote</span>
          </h1>
          <p className="mt-4 text-brand-green-100 max-w-xl mx-auto">
            Select the products you need, tell us about your requirements, and
            we&apos;ll send you a custom quote.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Left: Contact Info */}
            <div className="lg:col-span-2">
              <div className="card p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  Your Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="label">
                      Full Name <span className="text-brand-pink-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={contact.name}
                      onChange={handleContactChange}
                      placeholder="John Doe"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="label">
                      Email <span className="text-brand-pink-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={contact.email}
                      onChange={handleContactChange}
                      placeholder="john@company.com"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="label">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={contact.phone}
                      onChange={handleContactChange}
                      placeholder="+91 98765 43210"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="label">
                      Company
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      value={contact.company}
                      onChange={handleContactChange}
                      placeholder="Acme Inc."
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Summary */}
                {items.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Quote Summary
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {items.map((item) => (
                        <li
                          key={item.productId}
                          className="flex justify-between"
                        >
                          <span className="truncate mr-3">{item.product.name}</span>
                          <span className="text-gray-400 flex-shrink-0">
                            ×{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 text-sm font-medium text-gray-900">
                      <span>Total items</span>
                      <span>{items.length}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="btn-primary w-full justify-center mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Quote Request
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Product Selection */}
            <div className="lg:col-span-3">
              {/* Selected Items */}
              {items.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Selected Products ({items.length})
                  </h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                      >
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-brand-green-50 to-brand-pink-50 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-brand-green-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            ₹{item.product.priceFrom}
                            {item.product.priceTo
                              ? ` – ₹${item.product.priceTo}`
                              : "+"}{" "}
                            per unit
                          </p>
                          <input
                            type="text"
                            value={item.customization}
                            onChange={(e) =>
                              updateCustomization(item.productId, e.target.value)
                            }
                            placeholder="Customisation notes (optional)"
                            className="mt-2 w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-brand-green-500"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProduct(item.productId)}
                            className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Browser */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Add Products
                  </h2>
                </div>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products to add..."
                  className="input-field mb-4"
                />

                {loadingProducts ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="card p-4 animate-pulse">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-3/4 bg-gray-100 rounded" />
                            <div className="h-3 w-1/2 bg-gray-100 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="card p-8 text-center">
                    <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No products found</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                    {filteredProducts.map((product) => {
                      const isAdded = items.some(
                        (i) => i.productId === product.id,
                      );
                      return (
                        <div
                          key={product.id}
                          className={`card p-4 flex items-center gap-3 transition-all ${
                            isAdded
                              ? "border-brand-green-200 bg-brand-green-50/30"
                              : "hover:shadow-sm"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-green-50 to-brand-pink-50 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-brand-green-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-400">
                              ₹{product.priceFrom}
                              {product.priceTo
                                ? ` – ₹${product.priceTo}`
                                : "+"}{" "}
                              · Min {product.minOrderQty}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addProduct(product)}
                            disabled={isAdded}
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isAdded
                                ? "bg-brand-green-100 text-brand-green-600 cursor-default"
                                : "border border-gray-200 text-gray-400 hover:border-brand-green-500 hover:text-brand-green-500"
                            }`}
                          >
                            {isAdded ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
