"use client";

import { useState } from "react";
import { Bell, Building2, Key, MapPin, User, Users } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useSession } from "@/lib/auth-client";
import { toast } from "@/components/ui/Toaster";

export default function PortalProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    company: user?.company ?? "",
    role: "Procurement Lead",
    bio: "",
  });
  const [notifications, setNotifications] = useState({
    quotes: true,
    orders: true,
    promos: false,
    digest: true,
  });

  const save = () => {
    toast.success("Changes saved");
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Account</span>
        <h2 className="mt-3 h2-display">Profile & preferences</h2>
        <p className="mt-2 text-sm text-stone-500">
          Manage your contact details, shipping addresses and notification
          preferences.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex w-full max-w-full flex-nowrap overflow-x-auto scrollbar-hide">
          <TabsTrigger value="profile">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="addresses">
            <MapPin className="h-4 w-4" />
            Addresses
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Key className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full name</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Role / title</Label>
                <Input
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Company</Label>
                <Input
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Short bio (optional)</Label>
                <Textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>
            </div>
            <button type="button" onClick={save} className="btn-primary btn-lg mt-6">
              Save changes
            </button>
          </div>
        </TabsContent>

        <TabsContent value="addresses">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Saved addresses
            </h3>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "HQ — Brightline Logistics",
                  body: "12 Industrial Estate, Bengaluru, KA 560058",
                },
                {
                  title: "Mumbai office",
                  body: "Aurelia Tower, Block C, Mumbai, MH 400070",
                },
              ].map((a) => (
                <div
                  key={a.title}
                  className="rounded-2xl border border-stone-100 p-5"
                >
                  <p className="text-sm font-bold text-brand-ink-900">{a.title}</p>
                  <p className="text-xs text-stone-500 mt-1">{a.body}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="text-xs font-semibold text-brand-green-700 hover:underline">
                      Edit
                    </button>
                    <button className="text-xs font-semibold text-rose-600 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => toast.success("Address form would open here")}
                className="rounded-2xl border-2 border-dashed border-stone-200 p-5 text-sm font-semibold text-stone-500 hover:text-brand-ink-900 hover:border-brand-ink-300"
              >
                + Add address
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-brand-ink-900">
                Team members
              </h3>
              <button
                type="button"
                onClick={() => toast.success("Invite sent")}
                className="btn-primary btn-sm"
              >
                + Invite member
              </button>
            </div>
            <div className="mt-5 divide-y divide-stone-100 border-y border-stone-100">
              {[
                {
                  name: "Aanya Krishnan",
                  role: "Owner",
                  email: "aanya@brightline.in",
                },
                {
                  name: "Karthik R",
                  role: "Procurement",
                  email: "karthik@brightline.in",
                },
                {
                  name: "Smita Joshi",
                  role: "Marketing",
                  email: "smita@brightline.in",
                },
              ].map((m) => (
                <div
                  key={m.email}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-green-500 to-brand-green-700 text-white text-xs font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-ink-900">
                        {m.name}
                      </p>
                      <p className="text-xs text-stone-500">{m.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-brand-ink-700 bg-stone-100 rounded-full px-3 py-1">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8 space-y-3">
            {[
              { id: "quotes", label: "Quote updates", desc: "When admins respond or send new quotes." },
              { id: "orders", label: "Order updates", desc: "Status changes, dispatch and delivery." },
              { id: "promos", label: "Promotions", desc: "Seasonal launches and curated picks." },
              { id: "digest", label: "Monthly digest", desc: "A roundup of activity and analytics." },
            ].map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-ink-900">
                    {row.label}
                  </p>
                  <p className="text-xs text-stone-500">{row.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotifications((n) => ({
                      ...n,
                      [row.id as keyof typeof n]: !n[row.id as keyof typeof n],
                    }))
                  }
                  className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                    notifications[row.id as keyof typeof notifications]
                      ? "bg-brand-green-500"
                      : "bg-stone-300"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      notifications[row.id as keyof typeof notifications]
                        ? "translate-x-5"
                        : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8 space-y-5">
            <div>
              <h3 className="font-display text-lg font-bold text-brand-ink-900">
                Password
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Use a strong, unique password — minimum 12 characters.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input type="password" placeholder="Current password" />
                <Input type="password" placeholder="New password" />
              </div>
              <button type="button" onClick={save} className="btn-primary btn-sm mt-4">
                Update password
              </button>
            </div>
            <div className="rounded-2xl bg-brand-pink-50 border border-brand-pink-100 p-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-brand-pink-600" />
              <div>
                <p className="text-sm font-semibold text-brand-pink-800">
                  Two-factor authentication
                </p>
                <p className="text-xs text-brand-pink-700/80">
                  Coming soon — protect your account with SMS or authenticator.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
