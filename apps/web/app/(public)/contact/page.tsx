"use client";

import { useState, type FormEvent } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle,
} from "lucide-react";

const API = "http://localhost:3001/api";

const contactInfo = [
  { icon: Phone, label: "Phone", value: "+91 98765 43210", href: "tel:+919876543210" },
  { icon: Mail, label: "Email", value: "info@lotusgift.com", href: "mailto:info@lotusgift.com" },
  {
    icon: MapPin,
    label: "Address",
    value: "123 Business Avenue, Suite 100, Mumbai, Maharashtra 400001",
    href: null,
  },
  { icon: Clock, label: "Opening Hours", value: "Mon – Sat: 9 AM – 6 PM", href: null },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(data.message || "Something went wrong");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green-500 via-brand-green-600 to-brand-green-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-brand-pink-500 blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Get in <span className="text-brand-pink-300">Touch</span>
          </h1>
          <p className="mt-4 text-lg text-brand-green-100 max-w-xl mx-auto">
            Have a question or ready to start your next project? We&apos;d love
            to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="card p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-brand-green-50 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-brand-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Message Sent!
                  </h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Thank you for reaching out. Our team will get back to you
                    within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", phone: "", company: "", subject: "", message: "" });
                    }}
                    className="btn-secondary mt-6"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div className="card p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Send Us a Message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="label">
                          Full Name <span className="text-brand-pink-500">*</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="label">
                          Email <span className="text-brand-pink-500">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="john@company.com"
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="phone" className="label">
                          Phone
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label htmlFor="company" className="label">
                          Company
                        </label>
                        <input
                          id="company"
                          name="company"
                          type="text"
                          value={form.company}
                          onChange={handleChange}
                          placeholder="Acme Inc."
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="subject" className="label">
                        Subject
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="label">
                        Message <span className="text-brand-pink-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us about your requirements..."
                        className="input-field resize-none"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        "Sending..."
                      ) : (
                        <>
                          Send Message
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Contact Information
                </h2>
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-green-50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-brand-green-500" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {item.label}
                      </div>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm text-gray-700 hover:text-brand-green-600 transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-700">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp */}
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="card p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    Chat on WhatsApp
                  </div>
                  <div className="text-sm text-gray-500">
                    Quick replies during business hours
                  </div>
                </div>
              </a>

              {/* Map Placeholder */}
              <div className="card overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-brand-green-50 to-brand-pink-50 flex flex-col items-center justify-center text-center p-6">
                  <MapPin className="w-10 h-10 text-brand-green-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    Map Coming Soon
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    123 Business Avenue, Mumbai
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
