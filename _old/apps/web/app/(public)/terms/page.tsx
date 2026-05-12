import Link from "next/link";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    body: "By using lotusgift.com or placing an order, you agree to these terms. If you don't agree, please don't use the service.",
  },
  {
    id: "orders",
    title: "Orders & pricing",
    body: "Prices shown are indicative; final pricing depends on quantity, customisation and delivery destination. Quotes are valid for 21 days unless otherwise stated.",
  },
  {
    id: "payments",
    title: "Payments",
    body: "We accept UPI, cards, net-banking and select wallets via Razorpay. Bulk orders typically require a 50% advance to lock production.",
  },
  {
    id: "delivery",
    title: "Delivery",
    body: "Standard dispatch is 3–5 working days post production. We ship pan-India via reliable courier partners and provide tracking on every shipment.",
  },
  {
    id: "returns",
    title: "Returns & cancellations",
    body: "Branded merchandise is non-returnable except in case of QC defects, which we replace free of charge. Orders can be cancelled within 24 hours of confirmation if production hasn't started.",
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: "All trademarks, logos and brand assets you provide remain yours. We use them strictly to produce your order and to share visual mockups for approval.",
  },
  {
    id: "limitation",
    title: "Limitation of liability",
    body: "Our liability is limited to the value of the order placed. We are not responsible for indirect or consequential damages.",
  },
  {
    id: "law",
    title: "Governing law",
    body: "These terms are governed by the laws of India. Any dispute will be subject to the exclusive jurisdiction of the courts at Coimbatore.",
  },
];

export default function TermsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3">
          <div className="sticky top-6">
            <span className="eyebrow">Legal</span>
            <h1 className="mt-3 h2-display">Terms</h1>
            <p className="mt-3 text-sm text-stone-500">
              Updated {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <nav className="mt-6 space-y-1">
              {sections.map((s) => (
                <Link
                  key={s.id}
                  href={`#${s.id}`}
                  className="block px-3 py-1.5 rounded-full text-sm text-stone-600 hover:bg-stone-100 hover:text-brand-ink-900"
                >
                  {s.title}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <div className="lg:col-span-9 space-y-8">
          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8"
            >
              <h2 className="font-display text-xl font-bold text-brand-ink-900">
                {s.title}
              </h2>
              <p className="mt-3 text-stone-600 leading-relaxed">{s.body}</p>
            </section>
          ))}
          <div className="rounded-3xl bg-brand-pink-50 border border-brand-pink-100 p-6 text-sm text-brand-pink-800">
            Questions about these terms? Write to{" "}
            <a
              href="mailto:legal@lotusgift.com"
              className="font-semibold underline"
            >
              legal@lotusgift.com
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
