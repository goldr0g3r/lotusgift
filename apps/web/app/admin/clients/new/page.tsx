"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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

    if (!companyName || !contactName || !email) {
      toast.error("Company, contact, and email are required");
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
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create client");
      }

      toast.success("Client created");
      router.push("/admin/clients");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/clients"
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="eyebrow">Sales</span>
          <h2 className="mt-1 font-display text-2xl font-bold text-stone-900">
            Add new client
          </h2>
          <p className="text-stone-500 mt-1 text-sm">
            Register a new business client
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h3 className="font-display text-lg font-semibold text-stone-900">
            Company information
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Label>Company name *</Label>
              <Input
                placeholder="e.g., Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Contact person *</Label>
              <Input
                placeholder="Full name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="contact@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h3 className="font-display text-lg font-semibold text-stone-900">
            Address
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Label>Street address</Label>
              <Input
                placeholder="123 Business Ave"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <Label>PIN code</Label>
              <Input
                placeholder="641001"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h3 className="font-display text-lg font-semibold text-stone-900">
            Additional notes
          </h3>
          <Textarea
            rows={4}
            placeholder="Any relevant notes about this client..."
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
            {saving ? "Saving..." : "Save client"}
          </button>
        </div>
      </form>
    </div>
  );
}
