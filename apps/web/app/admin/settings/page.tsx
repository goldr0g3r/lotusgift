"use client";
import { useState, useEffect } from "react";
import {
  Save, Building2, Phone, Mail, Globe, CreditCard, MessageCircle,
  BarChart3, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";

const API = "http://localhost:3001/api";

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
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetch(`${API}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === "object") {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`${API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof SiteSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: "general", label: "General", icon: Building2 },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "integrations", label: "Integrations", icon: BarChart3 },
    { id: "payments", label: "Payments", icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="card p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />)}</div>
          <div className="lg:col-span-3 card p-6 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-500 mt-1">Manage store configuration</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-brand-green-600">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" /> {error}
            </span>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-2 space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors ${activeTab === tab.id ? "bg-brand-green-50 text-brand-green-600" : "text-gray-600 hover:bg-gray-50"}`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-brand-green-500" : "text-gray-400"}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === "general" && (
            <div className="card p-6 space-y-6">
              <h3 className="text-base font-semibold text-gray-900">General Settings</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="label">Site Name</label>
                  <input className="input-field" value={settings.siteName} onChange={e => update("siteName", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Site Description</label>
                  <textarea className="input-field resize-none" rows={3} value={settings.siteDescription} onChange={e => update("siteDescription", e.target.value)} placeholder="Brief description of your business" />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input-field" value={settings.currency} onChange={e => update("currency", e.target.value)}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tax Rate (%)</label>
                  <input type="number" className="input-field" value={settings.taxRate} onChange={e => update("taxRate", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="card p-6 space-y-6">
              <h3 className="text-base font-semibold text-gray-900">Contact Information</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className="input-field pl-10" value={settings.contactEmail} onChange={e => update("contactEmail", e.target.value)} placeholder="info@lotusgift.com" />
                  </div>
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className="input-field pl-10" value={settings.contactPhone} onChange={e => update("contactPhone", e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="label">WhatsApp Number</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className="input-field pl-10" value={settings.whatsappNumber} onChange={e => update("whatsappNumber", e.target.value)} placeholder="919876543210" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Country code without + (e.g. 919876543210)</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Business Address</label>
                  <textarea className="input-field resize-none" rows={3} value={settings.address} onChange={e => update("address", e.target.value)} placeholder="Full business address" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="card p-6 space-y-6">
              <h3 className="text-base font-semibold text-gray-900">Third-party Integrations</h3>
              <div className="space-y-5">
                <div>
                  <label className="label">Facebook Pixel ID</label>
                  <input className="input-field" value={settings.facebookPixelId} onChange={e => update("facebookPixelId", e.target.value)} placeholder="123456789012345" />
                  <p className="text-xs text-gray-400 mt-1">Used for Facebook/Meta ad tracking and analytics</p>
                </div>
                <div>
                  <label className="label">Google Analytics ID</label>
                  <input className="input-field" value={settings.googleAnalyticsId} onChange={e => update("googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" />
                  <p className="text-xs text-gray-400 mt-1">Google Analytics 4 measurement ID</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="card p-6 space-y-6">
              <h3 className="text-base font-semibold text-gray-900">Razorpay Configuration</h3>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">Keep your API keys secure. Never share your Key Secret publicly.</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="label">Razorpay Key ID</label>
                  <input className="input-field font-mono" value={settings.razorpayKeyId} onChange={e => update("razorpayKeyId", e.target.value)} placeholder="rzp_live_xxxxxxxxxxxxx" />
                </div>
                <div>
                  <label className="label">Razorpay Key Secret</label>
                  <input type="password" className="input-field font-mono" value={settings.razorpayKeySecret} onChange={e => update("razorpayKeySecret", e.target.value)} placeholder="••••••••••••••••" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
