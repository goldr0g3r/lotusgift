import Link from "next/link";

export const metadata = {
  title: "Terms of Service - Lotus Gift",
  description: "Lotus Gift terms of service — the rules and guidelines for using our platform and services.",
};

const sections = [
  {
    title: "Acceptance of Terms",
    content: `By accessing or using the Lotus Gift website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to update these terms at any time, and your continued use constitutes acceptance of any changes.`,
  },
  {
    title: "Account Registration",
    content: `To access certain features of our platform, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration and keep your account information up to date.`,
  },
  {
    title: "Orders and Quotes",
    content: `All quotes provided through our platform are valid for the period specified in the quote. Prices are subject to change based on quantity, customisation requirements, and market conditions. An order is considered confirmed only after we send you written confirmation. We reserve the right to refuse or cancel any order at our discretion.`,
  },
  {
    title: "Pricing and Payment",
    content: `All prices listed on our website are in Indian Rupees (INR) and are exclusive of applicable taxes unless stated otherwise. Payment terms are as specified in your quote or invoice. We accept payment through bank transfer, UPI, and major credit/debit cards via Razorpay. Late payments may incur additional charges.`,
  },
  {
    title: "Custom Branding and Intellectual Property",
    content: `When you submit logos, artwork, or designs for custom branding, you represent that you own or have the right to use such materials. Lotus Gift is not responsible for verifying your ownership of submitted intellectual property. You grant us a limited licence to use submitted materials solely for the purpose of fulfilling your order.`,
  },
  {
    title: "Shipping and Delivery",
    content: `We aim to deliver orders within the timeframe specified in your quote or order confirmation. Delivery timelines are estimates and not guarantees. Lotus Gift is not liable for delays caused by factors beyond our control, including natural disasters, transportation disruptions, or customs delays. Shipping costs are as quoted and may vary based on destination and order size.`,
  },
  {
    title: "Returns and Refunds",
    content: `Due to the custom nature of our products, returns are accepted only for defective items or items that do not match the approved specifications. Claims must be made within 7 business days of delivery with photographic evidence. Refunds for eligible returns will be processed within 15 business days. Customised products cannot be returned unless defective.`,
  },
  {
    title: "Limitation of Liability",
    content: `Lotus Gift shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services or products. Our total liability for any claim shall not exceed the amount you paid for the specific order in question.`,
  },
  {
    title: "Governing Law",
    content: `These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising from these terms or your use of our services shall be subject to the exclusive jurisdiction of the courts in Coimbatore, Tamil Nadu.`,
  },
];

export default function TermsPage() {
  return (
    <div className="bg-white">
      <div className="bg-gradient-to-br from-brand-green-500 to-brand-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
          <p className="mt-4 text-brand-green-100 text-lg">
            Rules and guidelines for using our platform
          </p>
          <p className="mt-2 text-sm text-brand-green-200">
            Last updated: April 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 leading-relaxed">
            Welcome to Lotus Gift. These Terms of Service govern your use of our
            website, products, and services. Please read them carefully before
            using our platform.
          </p>

          <div className="mt-10 space-y-10">
            {sections.map((section, index) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-gray-900 flex items-baseline gap-3">
                  <span className="text-sm font-bold text-brand-green-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-12 p-6 bg-brand-green-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Need Clarification?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              If you have questions about these terms, our team is happy to
              help.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link href="/contact" className="btn-primary text-sm">
                Contact Us
              </Link>
              <a
                href="mailto:legal@lotusgift.com"
                className="btn-secondary text-sm"
              >
                legal@lotusgift.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
