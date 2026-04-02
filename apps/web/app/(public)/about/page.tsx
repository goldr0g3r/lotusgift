import Link from "next/link";
import {
  Award,
  Users,
  Clock,
  Star,
  Shield,
  Palette,
  Truck,
  IndianRupee,
  Headphones,
  Leaf,
  ArrowRight,
  Target,
  Heart,
  Package,
} from "lucide-react";

const stats = [
  { label: "Products", value: "500+", icon: Package },
  { label: "Happy Clients", value: "1,200+", icon: Users },
  { label: "Years Experience", value: "5+", icon: Clock },
  { label: "Avg. Rating", value: "4.8/5", icon: Star },
];

const features = [
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description:
      "Every product goes through rigorous quality checks so your brand is always represented at its best.",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    description:
      "Full-spectrum customisation — logos, colours, packaging — tailored to your brand identity.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Streamlined production and logistics ensure your order reaches you on schedule, every time.",
  },
  {
    icon: IndianRupee,
    title: "Competitive Pricing",
    description:
      "Volume-based pricing tiers and transparent quotes mean maximum value for every rupee.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description:
      "A single point of contact from brief to delivery, so you never have to chase updates.",
  },
  {
    icon: Leaf,
    title: "Eco-Friendly Options",
    description:
      "Sustainable materials and processes for brands that care about their environmental impact.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green-500 via-brand-green-600 to-brand-green-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-brand-pink-500 blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur text-white border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Heart className="w-4 h-4" />
            Our Story
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            About <span className="text-brand-pink-300">Lotus Gift</span>
          </h1>
          <p className="mt-6 text-lg text-brand-green-100 max-w-2xl mx-auto leading-relaxed">
            We help businesses create memorable brand experiences through
            premium promotional products and corporate gifts.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-10 z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-6">
              <div className="w-10 h-10 rounded-lg bg-brand-green-50 flex items-center justify-center flex-shrink-0">
                <stat.icon className="w-5 h-5 text-brand-green-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="badge-green mb-3">Who We Are</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
                Crafting Brand Moments{" "}
                <span className="text-brand-green-600">Since 2019</span>
              </h2>
              <p className="mt-6 text-gray-500 leading-relaxed">
                Lotus Gift was founded with a simple belief: the right
                promotional product doesn&apos;t just carry a logo — it carries
                a story. From a small catalogue to over 500 products, we have
                grown into one of India&apos;s trusted sources for corporate
                gifting and branded merchandise.
              </p>
              <p className="mt-4 text-gray-500 leading-relaxed">
                We partner with businesses of every scale — from start-ups
                ordering their first branded pens to enterprises running
                nationwide campaigns — delivering quality, creativity, and
                reliability at every step.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-brand-green-50 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-brand-green-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Our Mission
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  To empower brands with high-quality, customisable promotional
                  products that create lasting impressions and real business
                  value.
                </p>
              </div>
              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-brand-pink-50 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-brand-pink-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Our Vision
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  To be India&apos;s most trusted promotional products partner,
                  known for innovation, sustainability, and exceptional service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 to-brand-green-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="badge-pink mb-3">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              What Sets Us Apart
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Six reasons businesses across India trust Lotus Gift for their
              promotional needs.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-green-50 to-brand-pink-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-brand-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Make Your Brand Stand Out?
          </h2>
          <p className="mt-4 text-brand-green-100 text-lg max-w-2xl mx-auto">
            Whether you need 50 pens or 50,000 gift sets, we&apos;re here to
            help. Get in touch or request a personalised quote today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/request-quote"
              className="bg-white text-brand-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-2 shadow-lg shadow-brand-green-900/20"
            >
              Request a Quote
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
