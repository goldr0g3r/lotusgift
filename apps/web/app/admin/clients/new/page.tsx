"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";

export default function NewClientAdminPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-brand-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>
      <div>
        <span className="eyebrow">New client</span>
        <h2 className="mt-3 h2-display">Add a new client</h2>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Client added (stub)");
          router.push("/admin/clients");
        }}
        className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl"
      >
        <div className="sm:col-span-2">
          <Label>Company name</Label>
          <Input required />
        </div>
        <div>
          <Label>Contact name</Label>
          <Input required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" required />
        </div>
        <div>
          <Label>Phone</Label>
          <Input />
        </div>
        <div>
          <Label>GST number</Label>
          <Input />
        </div>
        <div className="sm:col-span-2">
          <Label>Address</Label>
          <Input />
        </div>
        <div>
          <Label>City</Label>
          <Input />
        </div>
        <div>
          <Label>State</Label>
          <Input />
        </div>
        <div className="sm:col-span-2">
          <Label>Internal notes</Label>
          <Textarea rows={3} />
        </div>
        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" className="btn-primary btn-lg">
            <span className="btn-disc">
              <Save className="h-4 w-4" />
            </span>
            Save client
          </button>
          <Link href="/admin/clients" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
