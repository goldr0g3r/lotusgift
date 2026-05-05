"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Trash2,
} from "lucide-react";
import type { Client } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/clients`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${API}/clients/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        credentials: "include",
      });
      setClients((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Client removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Sales</span>
          <h2 className="mt-2 font-display text-2xl font-bold text-stone-900">
            Clients
          </h2>
          <p className="text-stone-500 mt-1 text-sm">
            {clients.length} registered client{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/admin/clients/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add client
        </Link>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by company, contact, or email..."
            className="!pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-2 text-stone-200" />
          <p className="text-stone-500">No clients found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="card p-5 hover:shadow-elevated hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-lotus-gold-50 ring-1 ring-lotus-gold-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-lotus-gold-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-stone-900 truncate">
                      {client.companyName}
                    </h3>
                    <p className="text-xs text-stone-500">{client.contactName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(client.id)}
                  className="p-1 rounded-md text-stone-300 hover:bg-lotus-rose-50 hover:text-lotus-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete client"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-stone-500">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-stone-500">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center gap-2 text-stone-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {[client.city, client.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-400">
                  Added {new Date(client.createdAt).toLocaleDateString("en-IN")}
                </span>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="text-xs font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900 inline-flex items-center gap-1"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete client"
        description="This will remove the client and their data."
        size="sm"
      >
        <p className="text-sm text-stone-600">Are you sure?</p>
        <DialogFooter>
          <button onClick={() => setDeleteId(null)} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-xl bg-lotus-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lotus-rose-700"
          >
            Delete
          </button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
