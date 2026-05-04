import Link from "next/link";
import {
  Package,
  Users,
  FileText,
  Truck,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Shield,
  Award,
  Zap,
  Gift,
  Palette,
  Headphones,
  PenTool,
  Coffee,
  ShoppingBag,
  Leaf,
  Trophy,
  ChevronRight,
  Quote as QuoteIcon,
  CheckCircle,
  Sparkles,
} from "lucide-react";

const stats = [
  { label: "Products", value: "500+", icon: Package },
  { label: "Clients", value: "1200+", icon: Users },
  { label: "Quotes", value: "5000+", icon: FileText },
  { label: "Shipping", value: "3–5 Days", icon: Truck },
];

const categories = [
  { name: "Corporate Gift Sets", icon: Gift, blurb: "Curated hampers & kits", color: "from-emerald-400/20 to-teal-400/20" },
  { name: "Drinkware", icon: Coffee, blurb: "Mugs, bottles & flasks", color: "from-amber-400/20 to-orange-400/20" },
  { name: "Bags & Backpacks", icon: ShoppingBag, blurb: "Totes to laptop bags", color: "from-blue-400/20 to-indigo-400/20" },
  { name: "Apparel", icon: PenTool, blurb: "Polos, caps & uniforms", color: "from-pink-400/20 to-rose-400/20" },
  { name: "Tech & Gadgets", icon: Headphones, blurb: "Audio, power & more", color: "from-violet-400/20 to-purple-400/20" },
  { name: "Stationery", icon: PenTool, blurb: "Notebooks, pens & desk", color: "from-cyan-400/20 to-sky-400/20" },
  { name: "Eco Friendly", icon: Leaf, blurb: "Sustainable materials", color: "from-lime-400/20 to-green-400/20" },
  { name: "Trophies & Awards", icon: Trophy, blurb: "Recognition that lasts", color: "from-yellow-400/20 to-amber-400/20" },
];

const featuredProducts = [
  {
    id: "1",
    name: "Executive Gift Hamper",
    description: "Premium snacks, drinkware, and keepsakes in a branded box.",
    priceFrom: 2499,
    minOrder: 25,
    category: "Corporate Gift Sets",
  },
  {
    id: "2",
    name: "Insulated Travel Mug",
    description: "Double-wall steel with laser engraving or full-wrap print.",
    priceFrom: 449,
    minOrder: 50,
    category: "Drinkware",
  },
  {
    id: "3",
    name: "Laptop Backpack Pro",
    description: "Padded compartment, USB pass-through, subtle logo placement.",
    priceFrom: 1299,
    minOrder: 30,
    category: "Bags & Backpacks",
  },
  {
    id: "4",
    name: "Embroidered Polo Shirt",
    description: "Cotton blend, corporate colours, durable stitch branding.",
    priceFrom: 599,
    minOrder: 100,
    category: "Apparel",
  },
  {
    id: "5",
    name: "Branded Wireless Earbuds",
    description: "Compact case with UV print or debossed logo.",
    priceFrom: 1899,
    minOrder: 50,
    category: "Tech & Gadgets",
  },
  {
    id: "6",
    name: "Leatherette Notebook Set",
    description: "A5 journal, pen loop, and matching pen — gift-ready.",
    priceFrom: 799,
    minOrder: 40,
    category: "Stationery",
  },
];

const howItWorks = [
  { step: 1, title: "Curate", body: "Shortlist categories and quantities that fit your campaign.", icon: Gift },
  { step: 2, title: "Contact", body: "Share timelines, delivery cities, and budget with our team.", icon: Phone },
  { step: 3, title: "Design", body: "Approve mockups, colours, and placement before production.", icon: Palette },
  { step: 4, title: "Deliver", body: "We produce, QC, and ship — tracked to your doorstep.", icon: Truck },
];

const usps = [
  { title: "Quality Assured", body: "Rigorous supplier checks and pre-ship inspection on every batch.", icon: Shield },
  { title: "Custom Branding", body: "Logo application across print, embroidery, deboss, and packaging.", icon: Award },
  { title: "Fast Turnaround", body: "Streamlined quoting and production slots for tight launch dates.", icon: Zap },
];

const testimonials = [
  {
    quote: "LotusGift made our annual client kits painless — one point of contact, crisp mockups, and on-time delivery across three cities.",
    author: "Ananya Mehta",
    role: "Marketing Lead",
    company: "Northwind Analytics",
    rating: 5,
  },
  {
    quote: "We needed 800 branded bottles in under two weeks. The team was transparent on feasibility and the finish exceeded expectations.",
    author: "Rahul Khanna",
    role: "Procurement Manager",
    company: "Brightline Health",
    rating: 5,
  },
  {
    quote: "From polo sampling to trophy engraving, everything felt coordinated. Our leadership off-site looked sharp and consistent.",
    author: "Sneha Iyer",
    role: "People Operations",
    company: "Cedar & Co.",
    rating: 5,
  },
];

function formatInr(n: number) {
  return n.toLocaleString("en-IN");
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green-500 via-brand-green-600 to-brand-green-800 bg-[length:200%_200%] animate-gradient-shift" />
        {/* Animated mesh blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-brand-pink-400/15 blur-3xl animate-float" />
          <div className="absolute top-1/2 right-0 h-[40rem] w-[40rem] rounded-full bg-white/8 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-green-300/10 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        </div>
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-20 sm:px-6 sm:pb-36 sm:pt-24 lg:px-8 lg:pb-44 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center lg:max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-sm font-bold tracking-wide mb-8 animate-fade-in-up">
              <Sparkles className="w-4 h-4 text-brand-pink-300" />
              Trusted corporate gifting partner
            </div>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[4rem] lg:leading-[1.1] animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Corporate Gifting,{" "}
              <span className="bg-gradient-to-r from-brand-pink-300 via-white to-brand-green-200 bg-clip-text text-transparent drop-shadow-sm">
                Made Effortless
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-brand-green-50/90 sm:text-xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Curated merchandise, clear pricing, and end-to-end support — so
              your brand shows up consistently, on budget, and on time.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <Link
                href="/request-quote"
                className="group bg-white text-brand-green-700 px-8 py-4 rounded-2xl font-bold text-base shadow-glow hover:shadow-glow-pink active:scale-[0.97] transition-all duration-300 inline-flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: "0.3s" }}
              >
                Get a Quote
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              <a
                href="#categories"
                className="border border-white/30 bg-white/5 text-white backdrop-blur-md px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/10 active:bg-white/15 transition-all duration-300 inline-flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: "0.4s" }}
              >
                Explore Categories
                <ChevronRight className="h-5 w-5" aria-hidden />
              </a>
            </div>
            <p className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-brand-green-100/80">
              <span className="inline-flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Mail className="h-3.5 w-3.5 text-brand-pink-200" aria-hidden />
                </span>
                quotes@lotusgift.com
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-brand-pink-200" aria-hidden />
                </span>
                Pan-India delivery
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="relative z-10 -mt-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="bg-white rounded-2xl shadow-elevated grid divide-y divide-gray-100/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 border border-gray-100/60">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-4 px-6 py-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green-50 to-brand-green-100/50">
                  <s.icon className="h-5 w-5 text-brand-green-600" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section id="categories" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="badge-green mb-4 inline-flex">Shop by category</span>
            <h2 className="section-heading">
              Everything your brand needs, in one place
            </h2>
            <p className="section-subheading mx-auto">
              Eight curated lanes — from everyday merch to awards and eco picks.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <a
                key={c.name}
                href="#featured"
                className="group card p-5 flex flex-col gap-3 hover:shadow-elevated hover:border-brand-green-100 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-brand-green-600 transition-transform duration-300 group-hover:scale-110`}>
                  <c.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand-green-600 transition-colors">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{c.blurb}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-green-600 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  View ideas
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section id="featured" className="scroll-mt-24 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="badge-pink mb-4 inline-flex">Featured picks</span>
              <h2 className="section-heading">Popular for corporate programs</h2>
              <p className="section-subheading">
                Indicative pricing — final quote depends on specs, print areas, and volume.
              </p>
            </div>
            <Link href="/request-quote" className="btn-secondary self-start sm:self-auto">
              Bulk &amp; custom brief
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((p) => (
              <article
                key={p.id}
                className="group card flex flex-col overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-brand-green-50/80 via-white to-brand-pink-50/80 overflow-hidden">
                  <Package className="h-14 w-14 text-brand-green-200 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" aria-hidden />
                  <span className="badge-green absolute left-3 top-3 !text-[11px]">{p.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-green-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">{p.description}</p>
                  <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-gray-100 pt-4">
                    <p className="text-xl font-bold text-brand-green-600">
                      From ₹{formatInr(p.priceFrom)}
                    </p>
                    <p className="text-xs text-gray-400">Min. order: {p.minOrder} pcs</p>
                  </div>
                  <Link
                    href="/request-quote"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 hover:text-brand-green-700 group/link"
                  >
                    Get Quote
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="dot-grid px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="badge-green mb-4 inline-flex">How it works</span>
            <h2 className="section-heading">Four steps from brief to doorstep</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item) => (
              <div
                key={item.title}
                className="group card relative p-6 pt-8 lg:pt-10 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
              >
                <span className="absolute right-5 top-4 text-5xl font-black tabular-nums text-brand-green-50 group-hover:text-brand-green-100 transition-colors">
                  {item.step}
                </span>
                <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green-500 to-brand-green-600 text-white shadow-sm shadow-brand-green-500/25 group-hover:shadow-md group-hover:shadow-brand-green-500/30 transition-shadow">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.body}</p>
                <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green-600">
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden />
                  Dedicated coordinator
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USP ── */}
      <section className="bg-gradient-to-b from-white via-brand-green-50/30 to-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="badge-pink mb-4 inline-flex">Why choose us</span>
            <h2 className="section-heading">
              Built for procurement &amp; marketing teams
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {usps.map((u) => (
              <div
                key={u.title}
                className="group card p-8 text-center hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green-100 to-brand-pink-100 group-hover:from-brand-green-200 group-hover:to-brand-pink-200 transition-colors duration-300">
                  <u.icon className="h-7 w-7 text-brand-green-600" aria-hidden />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">{u.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="badge-green mb-4 inline-flex">Testimonials</span>
            <h2 className="section-heading">Teams that ship with confidence</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote
                key={t.company}
                className="group card relative flex flex-col p-7 lg:p-8 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
              >
                <QuoteIcon className="absolute right-6 top-6 h-10 w-10 text-brand-pink-50 group-hover:text-brand-pink-100 transition-colors" aria-hidden />
                <div className="mb-5 flex gap-0.5" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
                <p className="relative z-[1] flex-1 text-sm leading-relaxed text-gray-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green-400 to-brand-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                    <p className="text-xs text-gray-500">{t.role}, {t.company}</p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-green-600 via-brand-green-700 to-brand-green-800 px-6 py-16 text-center shadow-elevated-lg sm:px-14 lg:py-20">
            {/* Decorative orbs */}
            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-pink-500/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-[32rem] rounded-full bg-brand-green-400/10 blur-3xl" />

            <div className="relative mx-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white mb-6">
                <Sparkles className="w-4 h-4 text-brand-pink-300" />
                Limited-time offer
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to Elevate Your Brand?
              </h2>
              <p className="mt-5 text-lg text-brand-green-100/90 leading-relaxed">
                Tell us your audience, timeline, and budget — we&apos;ll come back with options and visuals.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/request-quote"
                  className="group bg-white text-brand-green-700 px-8 py-4 rounded-2xl font-bold text-base shadow-glow hover:shadow-glow-pink hover:bg-slate-50 active:scale-[0.97] transition-all duration-300 inline-flex items-center gap-2"
                >
                  Request a Quote
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
                <a
                  href="mailto:quotes@lotusgift.com"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/40"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  Email us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
