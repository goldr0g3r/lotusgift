/**
 * Curated Unsplash imagery for the Lotus Gift catalog.
 * Each URL is a stable photo ID + size params so it can be served by next/image.
 *
 * The data layer is unchanged — `productImage(product)` prefers the DB
 * `imageUrl`, then falls back to a category-aware Unsplash photo, then to a
 * neutral default.
 */

export type ImageEntry = { src: string; alt: string };

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const FALLBACK_IMAGE: ImageEntry = {
  src: u("photo-1513201099705-a9746e1e201f", 1200),
  alt: "Curated promotional product",
};

export const heroSlides: Array<{
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  image: ImageEntry;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}> = [
  {
    eyebrow: "Premium corporate gifting",
    title: "Branded gifts that",
    highlight: "tell your story",
    description:
      "Curated hampers, branded merchandise and bespoke kits for India's most thoughtful brands.",
    image: {
      src: u("photo-1607082348824-0a96f2a4b9da", 1800),
      alt: "Elegant gift box on a marble surface",
    },
    cta: { label: "Request a Quote", href: "/request-quote" },
    secondaryCta: { label: "Browse Catalog", href: "/products" },
  },
  {
    eyebrow: "Wholesale pricing",
    title: "Bulk volumes,",
    highlight: "boutique finish",
    description:
      "Tiered pricing from 50 to 5000 units, with QC at every batch and pan-India dispatch in 3–5 days.",
    image: {
      src: u("photo-1556909114-f6e7ad7d3136", 1800),
      alt: "Stack of branded notebooks and stationery",
    },
    cta: { label: "Wholesale Catalog", href: "/products?wholesale=true" },
    secondaryCta: { label: "Talk to Us", href: "/contact" },
  },
  {
    eyebrow: "End-to-end service",
    title: "From mockup to",
    highlight: "doorstep delivery",
    description:
      "Dedicated coordinators, design previews, and tracked logistics — all under one roof.",
    image: {
      src: u("photo-1513201099705-a9746e1e201f", 1800),
      alt: "Packaged corporate gift hampers ready to ship",
    },
    cta: { label: "Get Started", href: "/request-quote" },
    secondaryCta: { label: "How it works", href: "/about" },
  },
];

export const trustLogos: string[] = [
  "Northwind",
  "Brightline",
  "Cedar & Co.",
  "Aurelia Health",
  "Indus Capital",
  "Coral Studios",
  "Skyfield",
  "Linen House",
];

export const categoryImageMap: Record<string, ImageEntry> = {
  "corporate-gift-sets": {
    src: u("photo-1607082348824-0a96f2a4b9da", 1200),
    alt: "Curated corporate gift box",
  },
  drinkware: {
    src: u("photo-1514228742587-6b1558fcca3d", 1200),
    alt: "Branded mugs and travel bottles",
  },
  "bags-backpacks": {
    src: u("photo-1553062407-98eeb64c6a62", 1200),
    alt: "Premium leather backpack",
  },
  apparel: {
    src: u("photo-1521572163474-6864f9cf17ab", 1200),
    alt: "Folded corporate apparel",
  },
  "tech-gadgets": {
    src: u("photo-1518770660439-4636190af475", 1200),
    alt: "Branded tech gadgets and earbuds",
  },
  stationery: {
    src: u("photo-1517842645767-c639042777db", 1200),
    alt: "Notebook, pens and desk stationery",
  },
  "eco-friendly": {
    src: u("photo-1542601906990-b4d3fb778b09", 1200),
    alt: "Eco friendly bamboo products",
  },
  "trophies-awards": {
    src: u("photo-1555885090-b63d5fb2c8cb", 1200),
    alt: "Crystal trophy on a desk",
  },
};

export const categoryHero = (slug: string): ImageEntry =>
  categoryImageMap[slug] ?? FALLBACK_IMAGE;

const slugFallbacks: Record<string, string> = {
  default: "photo-1513201099705-a9746e1e201f",
};

export const productImage = (product?: {
  imageUrl?: string | null;
  slug?: string;
  category?: { slug?: string } | null;
}): ImageEntry => {
  if (product?.imageUrl)
    return { src: product.imageUrl, alt: product.slug ?? "Product" };
  const slug = product?.category?.slug ?? "";
  if (slug && categoryImageMap[slug]) return categoryImageMap[slug]!;
  return {
    src: u(slugFallbacks.default!, 1200),
    alt: product?.slug ?? "Product",
  };
};

export const aboutImages = {
  story: {
    src: u("photo-1556761175-5973dc0f32e7", 1600),
    alt: "Team collaborating in a modern office",
  },
  warehouse: {
    src: u("photo-1601598851547-4302969d0614", 1600),
    alt: "Warehouse with packaged goods on shelves",
  },
  craftsmanship: {
    src: u("photo-1513201099705-a9746e1e201f", 1600),
    alt: "Artisan packaging premium gifts",
  },
};

export const contactImage: ImageEntry = {
  src: u("photo-1497366216548-37526070297c", 1600),
  alt: "Modern office reception",
};

export const authImage: ImageEntry = {
  src: u("photo-1607082348824-0a96f2a4b9da", 1400),
  alt: "Branded corporate gift on a clean surface",
};

export const promoBanners: Array<{
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  image: ImageEntry;
  tone: "emerald" | "gold";
}> = [
  {
    title: "Volume pricing for procurement teams",
    subtitle: "Get tiered savings starting at 50 units. Free mockups included.",
    cta: { label: "See wholesale", href: "/products?wholesale=true" },
    image: {
      src: u("photo-1556909114-f6e7ad7d3136", 1400),
      alt: "Wholesale stationery stack",
    },
    tone: "emerald",
  },
  {
    title: "Eco-conscious gifting collection",
    subtitle: "Bamboo, recycled paper, and reclaimed cotton — production grade.",
    cta: { label: "Explore eco picks", href: "/categories/eco-friendly" },
    image: {
      src: u("photo-1542601906990-b4d3fb778b09", 1400),
      alt: "Eco-friendly bamboo products",
    },
    tone: "gold",
  },
];
