"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, PlusCircle, Search } from "lucide-react";
import { mockClients } from "@/lib/mock-data";

export default function AdminClientsPage() {
  const [query, setQuery] = useState("");
  const list = mockClients.filter((c) =>
    `${c.companyName} ${c.contactName} ${c.email}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Sales</span>
          <h2 className="mt-3 h2-display">Clients</h2>
          <p className="text-stone-500 mt-1 text-sm">
            {list.length} of {mockClients.length} clients
          </p>
        </div>
        <Link href="/admin/clients/new" className="btn-primary btn-lg">
          <span className="btn-disc">
            <PlusCircle className="h-4 w-4" />
          </span>
          Add client
        </Link>
      </div>

      <div className="rounded-3xl bg-white border border-stone-100 p-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-stone-400 ml-2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients by name, company or email"
          className="flex-1 bg-transparent outline-none text-sm py-2"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((c) => (
          <div
            key={c.id}
            className="rounded-3xl bg-white border border-stone-100 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-green-500 to-brand-green-700 text-white text-sm font-bold">
                {c.companyName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-brand-ink-900 truncate">
                  {c.companyName}
                </p>
                <p className="text-xs text-stone-500">{c.contactName}</p>
              </div>
            </div>
            {c.notes && (
              <p className="mt-3 text-sm text-stone-500 line-clamp-2">
                {c.notes}
              </p>
            )}
            <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-stone-600 border-t border-stone-100 pt-4">
              <a
                href={`mailto:${c.email}`}
                className="inline-flex items-center gap-2 hover:text-brand-ink-900"
              >
                <Mail className="h-3.5 w-3.5 text-brand-pink-500" />
                {c.email}
              </a>
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  className="inline-flex items-center gap-2 hover:text-brand-ink-900"
                >
                  <Phone className="h-3.5 w-3.5 text-brand-green-500" />
                  {c.phone}
                </a>
              )}
            </div>
            <p className="mt-3 text-[11px] text-stone-400">
              {c.city ? `${c.city}, ${c.state}` : "—"} · Onboarded{" "}
              {new Date(c.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
