"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Search, Plus, Building2, Mail, Phone, MapPin, ArrowRight, Trash2,
} from "lucide-react";
import type { Client } from "@/lib/api";

const API = "http://localhost:3001/api";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/clients`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.json())
      .then((data: any) => setClients(Array.isArray(data) ? data : data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${API}/clients/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setClients(prev => prev.filter(c => c.id !== deleteId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.companyName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div className="h-8 bg-gray-200 rounded w-40 animate-pulse" /><div className="h-10 bg-gray-200 rounded w-32 animate-pulse" /></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-40" />
                <div className="h-3 bg-gray-200 rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-gray-500 mt-1">{clients.length} registered clients</p>
        </div>
        <Link href="/admin/clients/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Client
        </Link>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by company, contact, or email..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No clients found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <div key={client.id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-pink-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-brand-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{client.companyName}</h3>
                    <p className="text-xs text-gray-500">{client.contactName}</p>
                  </div>
                </div>
                <button onClick={() => setDeleteId(client.id)} className="p-1 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{[client.city, client.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Added {new Date(client.createdAt).toLocaleDateString("en-IN")}
                </span>
                <Link href={`/admin/clients/${client.id}`} className="text-xs font-medium text-brand-green-600 hover:text-brand-green-700 inline-flex items-center gap-1">
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900">Delete Client</h3>
            <p className="text-sm text-gray-500 mt-2">Are you sure? This will remove the client and their data.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
