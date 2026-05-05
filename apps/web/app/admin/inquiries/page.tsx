"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Building2,
  Clock,
  CheckCircle2,
  Reply,
} from "lucide-react";
import { api, type ContactInquiry } from "@/lib/api";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

const STATUS_TABS = ["ALL", "NEW", "READ", "REPLIED", "CLOSED"];

const statusTone: Record<string, "yellow" | "gray" | "emerald"> = {
  NEW: "yellow",
  READ: "gray",
  REPLIED: "emerald",
  CLOSED: "gray",
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactInquiry | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api
      .get<ContactInquiry[]>("/contacts")
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : ((data as { data?: ContactInquiry[] } | null)?.data ?? []);
        setInquiries(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string, note?: string) => {
    setUpdating(true);
    try {
      const body: Record<string, unknown> = { status };
      if (note !== undefined) body.adminNote = note;
      const updated = await api.patch<ContactInquiry>(`/contacts/${id}`, body);
      if (updated?.id) {
        setInquiries((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...updated } : i)),
        );
        if (selected?.id === id) {
          setSelected((prev) => (prev ? { ...prev, ...updated } : null));
        }
        toast.success(`Inquiry ${status.toLowerCase()}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const openDetail = (inquiry: ContactInquiry) => {
    setSelected(inquiry);
    setAdminNote(inquiry.adminNote || "");
    if (inquiry.status === "NEW") {
      void updateStatus(inquiry.id, "READ");
    }
  };

  const filtered = inquiries.filter((i) => {
    const matchTab = activeTab === "ALL" || i.status === activeTab;
    const matchSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.subject?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Sales</span>
        <h2 className="mt-2 font-display text-2xl font-bold text-stone-900">
          Contact inquiries
        </h2>
        <p className="text-stone-500 mt-1 text-sm">
          {inquiries.filter((i) => i.status === "NEW").length} new inquir
          {inquiries.filter((i) => i.status === "NEW").length === 1 ? "y" : "ies"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = activeTab === tab;
          const count =
            tab === "ALL"
              ? inquiries.length
              : inquiries.filter((i) => i.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ring-1",
                active
                  ? "bg-lotus-emerald-700 text-white ring-lotus-emerald-700"
                  : "bg-white text-stone-600 hover:bg-stone-50 ring-stone-200",
              )}
            >
              {tab === "ALL"
                ? "All"
                : tab.charAt(0) + tab.slice(1).toLowerCase()}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by name, email, or subject..."
            className="!pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card divide-y divide-stone-100">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-5">
              <Skeleton className="h-12" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-stone-200" />
            <p className="text-stone-500">No inquiries found</p>
          </div>
        ) : (
          filtered.map((inquiry) => (
            <button
              key={inquiry.id}
              onClick={() => openDetail(inquiry)}
              className={cn(
                "flex items-start gap-4 px-5 py-4 hover:bg-stone-50/60 transition-colors w-full text-left",
                inquiry.status === "NEW" && "bg-lotus-gold-50/40",
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                  inquiry.status === "NEW"
                    ? "bg-lotus-gold-100 ring-1 ring-lotus-gold-200"
                    : "bg-stone-100",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-bold",
                    inquiry.status === "NEW"
                      ? "text-lotus-gold-700"
                      : "text-stone-500",
                  )}
                >
                  {inquiry.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900">
                    {inquiry.name}
                  </span>
                  <Badge tone={statusTone[inquiry.status] ?? "gray"}>
                    {inquiry.status}
                  </Badge>
                  {inquiry.status === "NEW" && (
                    <span className="w-2 h-2 bg-lotus-rose-500 rounded-full animate-pulse-soft" />
                  )}
                </div>
                {inquiry.subject && (
                  <p className="text-sm font-medium text-stone-700 mt-0.5">
                    {inquiry.subject}
                  </p>
                )}
                <p className="text-sm text-stone-500 mt-0.5 line-clamp-1">
                  {inquiry.message}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-stone-400">
                  <span>{inquiry.email}</span>
                  {inquiry.company && <span>• {inquiry.company}</span>}
                  <span>
                    • {new Date(inquiry.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Inquiry details"
        size="md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100 flex items-center justify-center">
                <span className="text-lg font-bold text-lotus-emerald-700">
                  {selected.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-stone-900">{selected.name}</h4>
                <div className="flex items-center gap-1.5 text-sm text-stone-500">
                  <Mail className="w-3.5 h-3.5" /> {selected.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {selected.phone && (
                <div className="flex items-center gap-2 text-stone-600">
                  <Phone className="w-3.5 h-3.5 text-stone-400" /> {selected.phone}
                </div>
              )}
              {selected.company && (
                <div className="flex items-center gap-2 text-stone-600">
                  <Building2 className="w-3.5 h-3.5 text-stone-400" />{" "}
                  {selected.company}
                </div>
              )}
              <div className="flex items-center gap-2 text-stone-600 col-span-2">
                <Clock className="w-3.5 h-3.5 text-stone-400" />{" "}
                {new Date(selected.createdAt).toLocaleString("en-IN")}
              </div>
            </div>

            {selected.subject && (
              <div>
                <Label>Subject</Label>
                <p className="text-sm text-stone-900 font-medium">
                  {selected.subject}
                </p>
              </div>
            )}

            <div>
              <Label>Message</Label>
              <div className="p-3 bg-stone-50 ring-1 ring-stone-200 rounded-xl text-sm text-stone-700 whitespace-pre-wrap">
                {selected.message}
              </div>
            </div>

            <div>
              <Label>Admin note</Label>
              <Textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add an internal note..."
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {selected && selected.status !== "REPLIED" && (
                <button
                  onClick={() =>
                    updateStatus(selected.id, "REPLIED", adminNote)
                  }
                  disabled={updating}
                  className="btn-primary text-sm"
                >
                  <Reply className="w-4 h-4" /> Mark replied
                </button>
              )}
              {selected && selected.status !== "CLOSED" && (
                <button
                  onClick={() => updateStatus(selected.id, "CLOSED", adminNote)}
                  disabled={updating}
                  className="btn-ghost text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Close
                </button>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="btn-ghost text-sm"
            >
              Done
            </button>
          </div>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
