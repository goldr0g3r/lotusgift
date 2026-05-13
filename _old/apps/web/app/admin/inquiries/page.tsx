"use client";

import { useState } from "react";
import { Mail, Phone, Reply } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Input";
import { mockInquiries } from "@/lib/mock-data";
import { toast } from "@/components/ui/Toaster";
import type { ContactInquiry, InquiryStatus } from "@/lib/api-types";
import { cn } from "@/lib/cn";

const tone: Record<InquiryStatus, "neutral" | "warning" | "green" | "danger"> = {
  NEW: "warning",
  IN_PROGRESS: "neutral",
  REPLIED: "green",
  CLOSED: "neutral",
};

const filters = ["all", "NEW", "IN_PROGRESS", "REPLIED", "CLOSED"] as const;

export default function AdminInquiriesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [selected, setSelected] = useState<ContactInquiry | null>(null);
  const list =
    filter === "all"
      ? mockInquiries
      : mockInquiries.filter((i) => i.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Sales</span>
        <h2 className="mt-3 h2-display">Inquiries</h2>
        <p className="text-stone-500 mt-1 text-sm">
          Inbound leads, sorted by status. Reply directly from the side panel.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === f
                ? "bg-brand-ink-900 text-white"
                : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200",
            )}
          >
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((inq) => (
          <button
            type="button"
            key={inq.id}
            onClick={() => setSelected(inq)}
            className="text-left rounded-3xl bg-white border border-stone-100 p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all"
          >
            <div className="flex items-center justify-between">
              <Badge tone={tone[inq.status]} size="sm">
                {inq.status.replace("_", " ")}
              </Badge>
              <span className="text-[11px] text-stone-400">
                {new Date(inq.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-4 text-base font-bold text-brand-ink-900 line-clamp-1">
              {inq.subject ?? "(No subject)"}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {inq.name}
              {inq.company ? ` · ${inq.company}` : ""}
            </p>
            <p className="mt-3 text-sm text-stone-600 line-clamp-3">{inq.message}</p>
          </button>
        ))}
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        title={selected?.subject ?? "Inquiry"}
      >
        {selected && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center justify-between">
              <Badge tone={tone[selected.status]}>
                {selected.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-stone-500">
                {new Date(selected.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                From
              </p>
              <p className="mt-1 text-base font-bold text-brand-ink-900">
                {selected.name}
              </p>
              <p className="text-xs text-stone-500">{selected.company}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <a
                  href={`mailto:${selected.email}`}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 hover:bg-stone-200"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {selected.email}
                </a>
                {selected.phone && (
                  <a
                    href={`tel:${selected.phone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 hover:bg-stone-200"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {selected.phone}
                  </a>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Message
              </p>
              <p className="mt-2 text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                {selected.message}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Reply
              </p>
              <Textarea rows={4} placeholder="Type your reply…" />
              <button
                type="button"
                onClick={() => {
                  toast.success("Reply sent");
                  setSelected(null);
                }}
                className="btn-primary btn-lg mt-3"
              >
                <span className="btn-disc">
                  <Reply className="h-4 w-4" />
                </span>
                Send reply
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
