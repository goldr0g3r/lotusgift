"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";
import { api } from "@/lib/api";
import { Input, Label } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { toast } from "@/components/ui/Toaster";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  role: string;
  createdAt: string;
};

export default function PortalProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api
      .get<UserProfile>("/auth/me")
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          company: data.company || "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        company: profile.company || "",
      });
    }
    setEditing(false);
    setError("");
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await api.patch<UserProfile>("/auth/me", {
        name: form.name,
        phone: form.phone || null,
        company: form.company || null,
      });
      setProfile(updated);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!profile && error) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-12 h-12 text-lotus-rose-300 mx-auto" />
        <h3 className="mt-4 font-semibold text-stone-900">Error loading profile</h3>
        <p className="text-sm text-stone-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="card overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-lotus-emerald-700 via-lotus-emerald-800 to-stone-900">
          <div className="pointer-events-none absolute inset-0 lotus-pattern opacity-30" />
        </div>
        <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-lotus-emerald-800 ring-4 ring-white shadow-soft">
            {profile?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold text-stone-900">
              {profile?.name}
            </h2>
            <p className="text-sm text-stone-500">{profile?.email}</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary text-sm self-start sm:self-auto"
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

      {error && editing && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-lotus-rose-50 text-lotus-rose-700 text-sm ring-1 ring-lotus-rose-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Personal info</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <form onSubmit={handleSave} className="card p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="name">
                  <User className="w-3.5 h-3.5 inline mr-1.5 text-stone-400" />
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  disabled={!editing}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">
                  <Mail className="w-3.5 h-3.5 inline mr-1.5 text-stone-400" />
                  Email
                </Label>
                <Input id="email" type="email" disabled value={form.email} />
                {editing && (
                  <p className="text-xs text-stone-400 mt-1">
                    Email cannot be changed
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">
                  <Phone className="w-3.5 h-3.5 inline mr-1.5 text-stone-400" />
                  Phone number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  disabled={!editing}
                  placeholder="Not provided"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company">
                  <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-stone-400" />
                  Company
                </Label>
                <Input
                  id="company"
                  type="text"
                  disabled={!editing}
                  placeholder="Not provided"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                />
              </div>
            </div>

            {editing && (
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={handleCancel} className="btn-ghost">
                  Cancel
                </button>
              </div>
            )}
          </form>
        </TabsContent>
        <TabsContent value="account">
          <div className="card p-6">
            <h3 className="font-display text-lg font-bold text-stone-900">
              Account details
            </h3>
            <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
                <span className="text-xs text-stone-500">Account type</span>
                <p className="font-medium text-stone-900 mt-0.5">
                  {profile?.role === "CLIENT" ? "Client" : profile?.role}
                </p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
                <span className="text-xs text-stone-500">Member since</span>
                <p className="font-medium text-stone-900 mt-0.5">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
