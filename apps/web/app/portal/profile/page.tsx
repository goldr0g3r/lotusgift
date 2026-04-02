"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
} from "lucide-react";

const API = "http://localhost:3001/api";

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
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("client_token");
    if (!token) return;

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data: UserProfile) => {
        setProfile(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          company: data.company || "",
        });
        localStorage.setItem(
          "client_user",
          JSON.stringify({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
          }),
        );
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
    setSuccess("");
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const token = localStorage.getItem("client_token");
    if (!token || !profile) return;

    try {
      const res = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || null,
          company: form.company || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || "Failed to update profile",
        );
      }

      const updated: UserProfile = await res.json();
      setProfile(updated);
      localStorage.setItem(
        "client_user",
        JSON.stringify({
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
        }),
      );
      setEditing(false);
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green-500" />
      </div>
    );
  }

  if (!profile && error) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
        <h3 className="mt-4 text-sm font-medium text-gray-900">
          Error loading profile
        </h3>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <p className="text-gray-500 mt-1">Manage your account information</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-green-50 text-brand-green-600 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && editing && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-green-50 flex items-center justify-center">
              <span className="text-xl font-bold text-brand-green-600">
                {profile?.name?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {profile?.name}
              </h3>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary text-sm"
            >
              Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="label">
                <User className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                disabled={!editing}
                className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                <Mail className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                disabled
                className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                value={form.email}
              />
              {editing && (
                <p className="text-xs text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="label">
                <Phone className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                disabled={!editing}
                className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Not provided"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="company" className="label">
                <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                Company
              </label>
              <input
                id="company"
                type="text"
                disabled={!editing}
                className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Not provided"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
          </div>

          {editing && (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Account Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Account Type</span>
            <p className="font-medium text-gray-900 mt-0.5">
              {profile?.role === "CLIENT" ? "Client" : profile?.role}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Member Since</span>
            <p className="font-medium text-gray-900 mt-0.5">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
