import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Lotus Gift",
  description: "Lotus Gift privacy policy — how we collect, use, and protect your information.",
};

const sections = [
  {
    title: "Information We Collect",
    content: `We collect information you provide directly when you create an account, request a quote, place an order, or contact us. This includes your name, email address, phone number, company name, shipping address, and payment information. We also automatically collect usage data such as pages visited, browser type, and IP address when you interact with our website.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use the information we collect to process and fulfil your orders, send you quotes and invoices, communicate with you about your account and orders, improve our products and services, send promotional communications (with your consent), and comply with legal obligations. We do not sell your personal information to third parties.`,
  },
  {
    title: "Information Sharing",
    content: `We may share your information with trusted service providers who assist us in operating our business, such as payment processors, shipping partners, and email service providers. These parties are obligated to keep your information confidential and use it only for the purposes we specify.`,
  },
  {
    title: "Data Security",
    content: `We implement industry-standard security measures to protect your personal information, including encrypted data transmission (SSL/TLS), secure servers, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "Cookies and Tracking",
    content: `We use cookies and similar technologies to enhance your browsing experience, analyse website traffic, and personalise content. You can manage your cookie preferences through your browser settings. Some cookies are essential for the website to function properly.`,
  },
  {
    title: "Your Rights",
    content: `You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time. To exercise any of these rights, please contact us at privacy@lotusgift.com or through our contact page.`,
  },
  {
    title: "Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide you services. We also retain data as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.`,
  },
  {
    title: "Changes to This Policy",
    content: `We may update this privacy policy from time to time. We will notify you of material changes by posting the updated policy on our website and updating the "last updated" date. Your continued use of our services after changes are posted constitutes your acceptance of the revised policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-lotus-cream border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <span className="eyebrow">Legal</span>
          <h1 className="mt-3 h1-display !text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-stone-500 text-base max-w-xl mx-auto">
            How we collect, use, and protect your information
          </p>
          <p className="mt-2 text-xs text-stone-400">Last updated: April 2026</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <p className="text-stone-600 leading-relaxed">
          Lotus Gift (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed
          to protecting your privacy. This policy describes how we handle your personal
          information when you use our website, place orders, or interact with our services.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="font-display text-xl font-bold text-stone-900 flex items-baseline gap-3">
                <span className="text-sm font-bold text-lotus-gold-700 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              <p className="mt-3 text-stone-600 leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 card p-6 bg-lotus-cream border-lotus-gold-100">
          <h2 className="font-display text-lg font-bold text-stone-900">
            Questions or concerns?
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            If you have questions about this privacy policy or how we handle your data,
            please reach out.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary text-sm">
              Contact us
            </Link>
            <a href="mailto:privacy@lotusgift.com" className="btn-secondary text-sm">
              privacy@lotusgift.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
