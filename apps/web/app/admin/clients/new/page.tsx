"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";

const API = "http://localhost:3001/api";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!companyName || !contactName || !email) {
      setError("Company name, contact person, and email are required");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const body: Record<string, string> = {
        companyName,
        contactName,
        email,
      };
      if (phone) body.phone = phone;
      if (address) body.address = address;
      if (city) body.city = city;
      if (state) body.state = state;
      if (zipCode) body.zipCode = zipCode;
      if (notes) body.notes = notes;

      const res = await fetch(`${API}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create client");
      }

      router.push("/admin/clients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/clients"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Client</h2>
          <p className="text-gray-500 mt-1">Register a new business client</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">
            Company Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="label">Company Name *</label>
              <input
                type="text"
                placeholder="e.g., Acme Corporation"
                className="input-field"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Contact Person *</label>
              <input
                type="text"
                placeholder="Full name"
                className="input-field"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                placeholder="contact@company.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">Address</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="label">Street Address</label>
              <input
                type="text"
                placeholder="123 Business Ave"
                className="input-field"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                type="text"
                placeholder="City"
                className="input-field"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className="label">State</label>
              <input
                type="text"
                placeholder="State"
                className="input-field"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <label className="label">PIN Code</label>
              <input
                type="text"
                placeholder="641001"
                className="input-field"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">
            Additional Notes
          </h3>
          <textarea
            rows={4}
            placeholder="Any relevant notes about this client..."
            className="input-field resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/clients" className="btn-ghost">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Client"}
          </button>
        </div>
      </form>
    </div>
  );
}
