"use client";
import { useState, useEffect } from "react";
import {
  MessageSquare, Search, Mail, Phone, Building2, Clock, CheckCircle2,
  Reply, Eye, X, AlertCircle,
} from "lucide-react";
import type { ContactInquiry } from "@/lib/api";

const API = "http://localhost:3001/api";

const STATUS_TABS = ["ALL", "NEW", "READ", "REPLIED", "CLOSED"];

const statusConfig: Record<string, { class: string; label: string }> = {
  NEW: { class: "badge-yellow", label: "New" },
  READ: { class: "badge-gray", label: "Read" },
  REPLIED: { class: "badge-green", label: "Replied" },
  CLOSED: { class: "badge-gray", label: "Closed" },
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetch(`${API}/contacts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setInquiries(Array.isArray(data) ? data : data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string, note?: string) => {
    setUpdating(true);
    try {
      const body: any = { status };
      if (note !== undefined) body.adminNote = note;
      const res = await fetch(`${API}/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setInquiries(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
        if (selectedInquiry?.id === id) {
          setSelectedInquiry(prev => prev ? { ...prev, ...updated } : null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const openDetail = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNote(inquiry.adminNote || "");
    if (inquiry.status === "NEW") {
      updateStatus(inquiry.id, "READ");
    }
  };

  const filtered = inquiries.filter(i => {
    const matchTab = activeTab === "ALL" || i.status === activeTab;
    const matchSearch = !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.subject?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-9 bg-gray-200 rounded-lg w-20 animate-pulse" />)}</div>
        <div className="card divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-32" /><div className="h-3 bg-gray-200 rounded w-48" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Contact Inquiries</h2>
        <p className="text-gray-500 mt-1">{inquiries.filter(i => i.status === "NEW").length} new inquiries</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-brand-green-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-70">({inquiries.filter(i => i.status === tab).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, email, or subject..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p>No inquiries found</p>
          </div>
        ) : filtered.map(inquiry => {
          const cfg = statusConfig[inquiry.status] ?? statusConfig.NEW!;
          return (
            <button key={inquiry.id} onClick={() => openDetail(inquiry)}
              className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors w-full text-left ${inquiry.status === "NEW" ? "bg-brand-green-50/30" : ""}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${inquiry.status === "NEW" ? "bg-brand-green-100" : "bg-gray-100"}`}>
                <span className={`text-sm font-semibold ${inquiry.status === "NEW" ? "text-brand-green-600" : "text-gray-500"}`}>
                  {inquiry.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{inquiry.name}</span>
                  <span className={cfg.class}>{cfg.label}</span>
                  {inquiry.status === "NEW" && <span className="w-2 h-2 bg-brand-green-500 rounded-full" />}
                </div>
                {inquiry.subject && <p className="text-sm font-medium text-gray-700 mt-0.5">{inquiry.subject}</p>}
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{inquiry.message}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span>{inquiry.email}</span>
                  {inquiry.company && <span>• {inquiry.company}</span>}
                  <span>• {new Date(inquiry.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Inquiry Details</h3>
              <button onClick={() => setSelectedInquiry(null)} className="p-1 rounded-md hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-green-50 flex items-center justify-center">
                  <span className="text-lg font-semibold text-brand-green-600">{selectedInquiry.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedInquiry.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-3.5 h-3.5" /> {selectedInquiry.email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedInquiry.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedInquiry.phone}
                  </div>
                )}
                {selectedInquiry.company && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" /> {selectedInquiry.company}
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> {new Date(selectedInquiry.createdAt).toLocaleString("en-IN")}
                </div>
              </div>

              {selectedInquiry.subject && (
                <div>
                  <label className="label">Subject</label>
                  <p className="text-sm text-gray-900 font-medium">{selectedInquiry.subject}</p>
                </div>
              )}

              <div>
                <label className="label">Message</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">{selectedInquiry.message}</div>
              </div>

              <div>
                <label className="label">Admin Note</label>
                <textarea className="input-field resize-none" rows={3} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add an internal note..." />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-2">
                {selectedInquiry.status !== "REPLIED" && (
                  <button onClick={() => updateStatus(selectedInquiry.id, "REPLIED", adminNote)} disabled={updating} className="btn-primary text-sm">
                    <Reply className="w-4 h-4" /> Mark Replied
                  </button>
                )}
                {selectedInquiry.status !== "CLOSED" && (
                  <button onClick={() => updateStatus(selectedInquiry.id, "CLOSED", adminNote)} disabled={updating} className="btn-ghost text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Close
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="btn-ghost text-sm">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
