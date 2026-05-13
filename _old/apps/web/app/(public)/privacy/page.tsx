import Link from "next/link";

const sections = [
  {
    id: "intro",
    title: "Introduction",
    body: "We respect your privacy. This policy explains what we collect, why, and how we keep it safe.",
  },
  {
    id: "info",
    title: "Information we collect",
    body: "We collect contact details (name, email, phone, company), order data, billing info, and basic analytics. We never sell your data.",
  },
  {
    id: "use",
    title: "How we use it",
    body: "To fulfil orders, share quotes, send delivery updates, and improve our services. Marketing emails are opt-in and always include an unsubscribe link.",
  },
  {
    id: "share",
    title: "Sharing",
    body: "We share data only with our shipping partners and payment processors (e.g. Razorpay) — strictly as required to complete your order.",
  },
  {
    id: "security",
    title: "Security",
    body: "Data is encrypted in transit and at rest. Access is limited to staff who need it to deliver service.",
  },
  {
    id: "rights",
    title: "Your rights",
    body: "You can request a copy of your data, ask for corrections, or have your data deleted by writing to privacy@lotusgift.com.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3">
          <div className="sticky top-6">
            <span className="eyebrow">Legal</span>
            <h1 className="mt-3 h2-display">Privacy</h1>
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
            <section key={s.id} id={s.id} className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-brand-ink-900">
                {s.title}
              </h2>
              <p className="mt-3 text-stone-600 leading-relaxed">{s.body}</p>
            </section>
          ))}
          <div className="rounded-3xl bg-brand-green-50 border border-brand-green-100 p-6 text-sm text-brand-green-800">
            Questions about this policy? Write to{" "}
            <a
              href="mailto:privacy@lotusgift.com"
              className="font-semibold underline"
            >
              privacy@lotusgift.com
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
