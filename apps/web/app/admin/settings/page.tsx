"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Building2,
  Phone,
  Mail,
  CreditCard,
  MessageCircle,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  whatsappNumber: string;
  facebookPixelId: string;
  googleAnalyticsId: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  currency: string;
  taxRate: number;
}

const defaultSettings: SiteSettings = {
  siteName: "Lotus Gift",
  siteDescription: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  whatsappNumber: "",
  facebookPixelId: "",
  googleAnalyticsId: "",
  razorpayKeyId: "",
  razorpayKeySecret: "",
  currency: "INR",
  taxRate: 18,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`${API}/settings`, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API}/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof SiteSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: "general", label: "General", icon: Building2 },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "integrations", label: "Integrations", icon: BarChart3 },
    { id: "payments", label: "Payments", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="eyebrow">System</span>
          <h2 className="mt-2 font-display text-2xl font-bold text-stone-900">
            Settings
          </h2>
          <p className="text-stone-500 mt-1 text-sm">
            Manage store configuration
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="card p-2 space-y-1">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))
              : tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors",
                        active
                          ? "bg-lotus-emerald-50 text-lotus-emerald-800"
                          : "text-stone-600 hover:bg-stone-50",
                      )}
                    >
                      <tab.icon
                        className={cn(
                          "w-4 h-4",
                          active ? "text-lotus-emerald-700" : "text-stone-400",
                        )}
                      />
                      {tab.label}
                    </button>
                  );
                })}
          </div>
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <Skeleton className="h-96" />
          ) : (
            <>
              {activeTab === "general" && (
                <div className="card p-6 space-y-6">
                  <h3 className="font-display text-lg font-semibold text-stone-900">
                    General
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Label>Site name</Label>
                      <Input
                        value={settings.siteName}
                        onChange={(e) => update("siteName", e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Site description</Label>
                      <Textarea
                        rows={3}
                        value={settings.siteDescription}
                        onChange={(e) =>
                          update("siteDescription", e.target.value)
                        }
                        placeholder="Brief description of your business"
                      />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select
                        value={settings.currency}
                        onChange={(e) => update("currency", e.target.value)}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Tax rate (%)</Label>
                      <Input
                        type="number"
                        value={settings.taxRate}
                        onChange={(e) =>
                          update("taxRate", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "contact" && (
                <div className="card p-6 space-y-6">
                  <h3 className="font-display text-lg font-semibold text-stone-900">
                    Contact information
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label>Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          className="!pl-10"
                          value={settings.contactEmail}
                          onChange={(e) =>
                            update("contactEmail", e.target.value)
                          }
                          placeholder="info@lotusgift.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Phone number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          className="!pl-10"
                          value={settings.contactPhone}
                          onChange={(e) =>
                            update("contactPhone", e.target.value)
                          }
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>WhatsApp number</Label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          className="!pl-10"
                          value={settings.whatsappNumber}
                          onChange={(e) =>
                            update("whatsappNumber", e.target.value)
                          }
                          placeholder="919876543210"
                        />
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        Country code without + (e.g. 919876543210)
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Business address</Label>
                      <Textarea
                        rows={3}
                        value={settings.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="Full business address"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "integrations" && (
                <div className="card p-6 space-y-6">
                  <h3 className="font-display text-lg font-semibold text-stone-900">
                    Third-party integrations
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <Label>Facebook Pixel ID</Label>
                      <Input
                        value={settings.facebookPixelId}
                        onChange={(e) =>
                          update("facebookPixelId", e.target.value)
                        }
                        placeholder="123456789012345"
                      />
                      <p className="text-xs text-stone-400 mt-1">
                        Used for Facebook/Meta ad tracking and analytics
                      </p>
                    </div>
                    <div>
                      <Label>Google Analytics ID</Label>
                      <Input
                        value={settings.googleAnalyticsId}
                        onChange={(e) =>
                          update("googleAnalyticsId", e.target.value)
                        }
                        placeholder="G-XXXXXXXXXX"
                      />
                      <p className="text-xs text-stone-400 mt-1">
                        Google Analytics 4 measurement ID
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="card p-6 space-y-6">
                  <h3 className="font-display text-lg font-semibold text-stone-900">
                    Razorpay configuration
                  </h3>
                  <div className="p-3 bg-lotus-gold-50 ring-1 ring-lotus-gold-200 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-lotus-gold-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-lotus-gold-900">
                      Keep your API keys secure. Never share your Key Secret
                      publicly.
                    </p>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <Label>Razorpay Key ID</Label>
                      <Input
                        className="font-mono"
                        value={settings.razorpayKeyId}
                        onChange={(e) =>
                          update("razorpayKeyId", e.target.value)
                        }
                        placeholder="rzp_live_xxxxxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <Label>Razorpay Key Secret</Label>
                      <Input
                        type="password"
                        className="font-mono"
                        value={settings.razorpayKeySecret}
                        onChange={(e) =>
                          update("razorpayKeySecret", e.target.value)
                        }
                        placeholder="••••••••••••••••"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
