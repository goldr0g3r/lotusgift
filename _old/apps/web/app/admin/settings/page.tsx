"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  CreditCard,
  Plug,
  Save,
  Shield,
  Users,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";

export default function AdminSettingsPage() {
  const [brand, setBrand] = useState({
    name: "Lotus Gift",
    tagline: "Premium promotional products & corporate gifts",
    primary: "#02783C",
    accent: "#F01282",
    address: "123 Business Park, Coimbatore, TN 641001",
    gst: "33ABCDE1234F1Z5",
    supportEmail: "hello@lotusgift.com",
    supportPhone: "+91 98765 43210",
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">System</span>
        <h2 className="mt-3 h2-display">Settings</h2>
        <p className="text-stone-500 mt-1 text-sm">
          Brand identity, notifications, payment integrations and team access.
        </p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList className="!flex flex-wrap !rounded-full">
          <TabsTrigger value="brand">
            <Building2 className="h-4 w-4" />
            Brand
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brand">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Brand name</Label>
              <Input
                value={brand.name}
                onChange={(e) => setBrand({ ...brand, name: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Tagline</Label>
              <Input
                value={brand.tagline}
                onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
              />
            </div>
            <div>
              <Label>Primary colour</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.primary}
                  onChange={(e) => setBrand({ ...brand, primary: e.target.value })}
                  className="h-12 w-12 rounded-2xl border border-stone-200"
                />
                <Input
                  value={brand.primary}
                  onChange={(e) => setBrand({ ...brand, primary: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Accent colour</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.accent}
                  onChange={(e) => setBrand({ ...brand, accent: e.target.value })}
                  className="h-12 w-12 rounded-2xl border border-stone-200"
                />
                <Input
                  value={brand.accent}
                  onChange={(e) => setBrand({ ...brand, accent: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>GST number</Label>
              <Input
                value={brand.gst}
                onChange={(e) => setBrand({ ...brand, gst: e.target.value })}
              />
            </div>
            <div>
              <Label>Support phone</Label>
              <Input
                value={brand.supportPhone}
                onChange={(e) =>
                  setBrand({ ...brand, supportPhone: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Textarea
                rows={2}
                value={brand.address}
                onChange={(e) => setBrand({ ...brand, address: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => toast.success("Brand settings saved")}
                className="btn-primary btn-lg"
              >
                <span className="btn-disc">
                  <Save className="h-4 w-4" />
                </span>
                Save changes
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7 space-y-3">
            {[
              {
                title: "New quote requests",
                desc: "Email + dashboard alert when a quote is submitted.",
                enabled: true,
              },
              {
                title: "Order paid",
                desc: "Trigger production workflow when payment captured.",
                enabled: true,
              },
              {
                title: "Low stock",
                desc: "Notify when SKU stock dips below threshold.",
                enabled: false,
              },
              {
                title: "Daily summary",
                desc: "Roll up activity + KPIs in a single morning digest.",
                enabled: true,
              },
            ].map((n) => (
              <div
                key={n.title}
                className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-ink-900">
                    {n.title}
                  </p>
                  <p className="text-xs text-stone-500">{n.desc}</p>
                </div>
                <span
                  className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 ${
                    n.enabled ? "bg-brand-green-500" : "bg-stone-300"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      n.enabled ? "translate-x-5" : ""
                    }`}
                  />
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Razorpay key ID</Label>
              <Input placeholder="rzp_live_xxxxxxxxxxxx" />
            </div>
            <div>
              <Label>Razorpay secret</Label>
              <Input type="password" placeholder="••••••••••••" />
            </div>
            <div>
              <Label>Webhook secret</Label>
              <Input type="password" />
            </div>
            <div>
              <Label>Default currency</Label>
              <Input value="INR" readOnly />
            </div>
            <div className="sm:col-span-2 rounded-2xl bg-brand-green-50 border border-brand-green-100 p-4 text-sm text-brand-green-800">
              Test mode is currently <strong>enabled</strong>. No live payments
              will be captured.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "Mailchimp", desc: "Push newsletter signups", state: "Connected" },
              { name: "Slack", desc: "Inquiry alerts in #sales", state: "Disconnected" },
              { name: "Shiprocket", desc: "Logistics automation", state: "Connected" },
              { name: "Google Analytics", desc: "Site traffic", state: "Connected" },
            ].map((it) => (
              <div
                key={it.name}
                className="rounded-3xl bg-white border border-stone-100 p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-brand-ink-900">{it.name}</p>
                  <p className="text-xs text-stone-500">{it.desc}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    it.state === "Connected"
                      ? "bg-brand-green-50 text-brand-green-700"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {it.state}
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-brand-ink-900">
                Admin team
              </h3>
              <button
                type="button"
                onClick={() => toast.success("Invite sent")}
                className="btn-primary btn-sm"
              >
                + Invite admin
              </button>
            </div>
            <div className="mt-4 divide-y divide-stone-100 border-y border-stone-100">
              {[
                { name: "Lotus Admin", email: "admin@lotusgift.com", role: "Owner" },
                { name: "Anita Sen", email: "anita@lotusgift.com", role: "Sales" },
                { name: "Vikas Roy", email: "vikas@lotusgift.com", role: "Operations" },
              ].map((m) => (
                <div
                  key={m.email}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-ink-900">
                      {m.name}
                    </p>
                    <p className="text-xs text-stone-500">{m.email}</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-ink-700 bg-stone-100 rounded-full px-3 py-1">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <div className="rounded-3xl bg-white border border-stone-100 p-6">
              <h3 className="font-display text-lg font-bold text-brand-ink-900">
                Sign-in security
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  {
                    title: "Two-factor authentication",
                    desc: "Authenticator app for all admin accounts.",
                    state: "Recommended",
                  },
                  {
                    title: "Session timeout",
                    desc: "Auto sign-out after 12 hours of inactivity.",
                    state: "On",
                  },
                ].map((row) => (
                  <div
                    key={row.title}
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-brand-ink-900">
                        {row.title}
                      </p>
                      <p className="text-xs text-stone-500">{row.desc}</p>
                    </div>
                    <span className="text-xs font-semibold text-brand-ink-700 bg-white rounded-full px-3 py-1 ring-1 ring-stone-200">
                      {row.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-rose-50 border border-rose-100 p-6">
              <h3 className="font-display text-lg font-bold text-rose-900 inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger zone
              </h3>
              <p className="text-sm text-rose-800 mt-2">
                Permanent deletion of historical data is irreversible. Use with care.
              </p>
              <button
                type="button"
                onClick={() => toast.error("This action is disabled in the demo")}
                className="btn-pink btn-sm mt-4 bg-rose-600 hover:bg-rose-700"
              >
                Purge archived data
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
