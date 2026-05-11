/**
 * Stub data layer. Provides realistic mock entities for every dashboard,
 * catalog, and cart workflow in the UI redesign. Backend wiring is intentionally
 * skipped while the new design is being built.
 */

import type {
  Category,
  Client,
  ContactInquiry,
  DashboardStats,
  Order,
  Product,
  Quote,
  Testimonial,
  User,
} from "./api-types";

const u = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// ----- Categories -----

export const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Corporate Gift Sets",
    slug: "corporate-gift-sets",
    description: "Curated hampers and welcome kits for clients and employees.",
    imageUrl: u("photo-1607082348824-0a96f2a4b9da"),
    sortOrder: 1,
    isActive: true,
    _count: { products: 24 },
  },
  {
    id: "cat-2",
    name: "Drinkware",
    slug: "drinkware",
    description: "Bottles, tumblers, mugs and flasks ready for laser branding.",
    imageUrl: u("photo-1514228742587-6b1558fcca3d"),
    sortOrder: 2,
    isActive: true,
    _count: { products: 32 },
  },
  {
    id: "cat-3",
    name: "Bags & Backpacks",
    slug: "bags-backpacks",
    description: "Laptop, travel and tote bags engineered for daily use.",
    imageUrl: u("photo-1553062407-98eeb64c6a62"),
    sortOrder: 3,
    isActive: true,
    _count: { products: 18 },
  },
  {
    id: "cat-4",
    name: "Apparel",
    slug: "apparel",
    description: "T-shirts, polos, jackets and caps with custom embroidery.",
    imageUrl: u("photo-1521572163474-6864f9cf17ab"),
    sortOrder: 4,
    isActive: true,
    _count: { products: 28 },
  },
  {
    id: "cat-5",
    name: "Tech & Gadgets",
    slug: "tech-gadgets",
    description: "Power banks, earbuds, chargers and desk-ready accessories.",
    imageUrl: u("photo-1518770660439-4636190af475"),
    sortOrder: 5,
    isActive: true,
    _count: { products: 21 },
  },
  {
    id: "cat-6",
    name: "Stationery",
    slug: "stationery",
    description: "Notebooks, pens, planners and elegant desk sets.",
    imageUrl: u("photo-1517842645767-c639042777db"),
    sortOrder: 6,
    isActive: true,
    _count: { products: 26 },
  },
  {
    id: "cat-7",
    name: "Eco Friendly",
    slug: "eco-friendly",
    description: "Sustainable picks in bamboo, jute and recycled fibres.",
    imageUrl: u("photo-1542601906990-b4d3fb778b09"),
    sortOrder: 7,
    isActive: true,
    _count: { products: 15 },
  },
  {
    id: "cat-8",
    name: "Trophies & Awards",
    slug: "trophies-awards",
    description: "Premium recognition pieces in crystal, wood and metal.",
    imageUrl: u("photo-1555885090-b63d5fb2c8cb"),
    sortOrder: 8,
    isActive: true,
    _count: { products: 12 },
  },
];

// ----- Products -----

type SeedProduct = {
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  catSlug: string;
  priceFrom: number;
  priceTo?: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  minOrderQty?: number;
  stock?: number;
  imageId: string;
  gallery?: string[];
  rating: number;
  reviews: number;
  isFeatured?: boolean;
  isWholesale?: boolean;
  customizationOptions?: string[];
};

const seed: SeedProduct[] = [
  {
    slug: "premium-festive-hamper",
    name: "Premium Festive Hamper",
    shortDesc: "Curated luxury hamper with dry fruits, sweets and brand stationery.",
    description:
      "Hand-packed festive hamper featuring premium dry fruits, gourmet sweets, an artisanal candle and a leather-bound notebook. Custom card insert with your brand message included.",
    catSlug: "corporate-gift-sets",
    priceFrom: 1899,
    priceTo: 4499,
    wholesalePrice: 1499,
    wholesaleMinQty: 50,
    minOrderQty: 25,
    stock: 480,
    imageId: "photo-1607082348824-0a96f2a4b9da",
    gallery: [
      "photo-1607082348824-0a96f2a4b9da",
      "photo-1513201099705-a9746e1e201f",
      "photo-1545486332-9e0999c535b2",
    ],
    rating: 4.9,
    reviews: 312,
    isFeatured: true,
    isWholesale: true,
    customizationOptions: ["Logo printing", "Custom ribbon", "Personal card"],
  },
  {
    slug: "welcome-onboarding-kit",
    name: "Employee Welcome Kit",
    shortDesc: "Notebook, pen, bottle, tote and tech caddy in custom packaging.",
    description:
      "Make day-one unforgettable. Everything new hires need on their desk: a branded notebook, smooth-writing pen, eco bottle, canvas tote and a magnetic tech caddy.",
    catSlug: "corporate-gift-sets",
    priceFrom: 1299,
    priceTo: 2299,
    wholesalePrice: 999,
    wholesaleMinQty: 100,
    minOrderQty: 50,
    stock: 760,
    imageId: "photo-1513201099705-a9746e1e201f",
    rating: 4.8,
    reviews: 189,
    isFeatured: true,
    isWholesale: true,
    customizationOptions: ["Embroidered logo", "Printed card", "Custom box"],
  },
  {
    slug: "matte-steel-bottle-750",
    name: "Matte Steel Bottle 750ml",
    shortDesc: "Double-wall vacuum bottle. Keeps cold 24h, hot 12h.",
    description:
      "Double-walled vacuum-insulated stainless steel bottle with a satin matte finish. Powder-coat or laser engraving available in any Pantone-matched colour.",
    catSlug: "drinkware",
    priceFrom: 449,
    priceTo: 699,
    wholesalePrice: 349,
    wholesaleMinQty: 100,
    minOrderQty: 50,
    stock: 1240,
    imageId: "photo-1602143407151-7111542de6e8",
    rating: 4.7,
    reviews: 524,
    isFeatured: true,
    isWholesale: true,
    customizationOptions: ["Laser engraving", "UV print", "Pantone colour match"],
  },
  {
    slug: "ceramic-coffee-mug",
    name: "Ceramic Coffee Mug 350ml",
    shortDesc: "Glossy ceramic mug, dishwasher safe, full-colour print.",
    description:
      "Classic 350ml ceramic mug with a smooth glaze. Full-wrap sublimation or single-position screen print, dishwasher safe up to 60°C.",
    catSlug: "drinkware",
    priceFrom: 189,
    priceTo: 299,
    wholesalePrice: 149,
    wholesaleMinQty: 100,
    minOrderQty: 100,
    stock: 2400,
    imageId: "photo-1514228742587-6b1558fcca3d",
    rating: 4.6,
    reviews: 412,
    customizationOptions: ["Sublimation print", "Screen print"],
  },
  {
    slug: "executive-laptop-backpack",
    name: "Executive Laptop Backpack",
    shortDesc: "Water-resistant, padded 15.6\" sleeve, USB pass-through.",
    description:
      "Tailored for the modern executive. Water-resistant 1680D fabric, padded 15.6\" sleeve, anti-theft back pocket and a discreet USB pass-through for power.",
    catSlug: "bags-backpacks",
    priceFrom: 1499,
    priceTo: 2799,
    wholesalePrice: 1199,
    wholesaleMinQty: 50,
    minOrderQty: 25,
    stock: 540,
    imageId: "photo-1553062407-98eeb64c6a62",
    rating: 4.8,
    reviews: 268,
    isFeatured: true,
    isWholesale: true,
    customizationOptions: ["Embroidered logo", "Custom hangtag"],
  },
  {
    slug: "canvas-tote-jute-handles",
    name: "Canvas Tote with Jute Handles",
    shortDesc: "12oz heavy canvas, natural jute handles, eco-print ready.",
    description:
      "Solid 12oz cotton canvas body with twisted jute handles. Water-based screen printing for a soft, eco-friendly finish.",
    catSlug: "bags-backpacks",
    priceFrom: 249,
    priceTo: 449,
    wholesalePrice: 179,
    wholesaleMinQty: 200,
    minOrderQty: 100,
    stock: 1800,
    imageId: "photo-1591348278863-a8fb3887e2aa",
    rating: 4.5,
    reviews: 156,
    customizationOptions: ["Screen print", "Heat transfer"],
  },
  {
    slug: "premium-polo-tshirt",
    name: "Premium Cotton Polo T-Shirt",
    shortDesc: "220 GSM combed cotton piqué, tonal stitching.",
    description:
      "Premium 220 GSM combed cotton piqué polo. Tonal stitching, mother-of-pearl buttons. Embroidery up to 12,000 stitches included.",
    catSlug: "apparel",
    priceFrom: 599,
    priceTo: 999,
    wholesalePrice: 449,
    wholesaleMinQty: 100,
    minOrderQty: 50,
    stock: 1100,
    imageId: "photo-1521572163474-6864f9cf17ab",
    rating: 4.7,
    reviews: 342,
    customizationOptions: ["Chest embroidery", "Sleeve print", "Custom hangtag"],
  },
  {
    slug: "softshell-jacket",
    name: "Branded Softshell Jacket",
    shortDesc: "Wind & water resistant, fleece-lined, embroidery ready.",
    description:
      "Three-layer softshell with bonded fleece lining, wind- and water-resistant outer. Discreet contoured fit and a clean panel for chest embroidery.",
    catSlug: "apparel",
    priceFrom: 1499,
    priceTo: 2299,
    wholesalePrice: 1199,
    wholesaleMinQty: 50,
    minOrderQty: 25,
    stock: 320,
    imageId: "photo-1551028719-00167b16eac5",
    rating: 4.8,
    reviews: 124,
    isFeatured: true,
    customizationOptions: ["Embroidered logo", "Printed back panel"],
  },
  {
    slug: "wireless-charger-stand",
    name: "Wireless Charger Stand 15W",
    shortDesc: "Qi-certified, fast charge, vegan-leather wrapped base.",
    description:
      "Qi-certified 15W fast wireless charger with adjustable angle stand. Vegan leather wrapped base and brushed aluminium accents.",
    catSlug: "tech-gadgets",
    priceFrom: 899,
    priceTo: 1499,
    wholesalePrice: 699,
    wholesaleMinQty: 50,
    minOrderQty: 25,
    stock: 460,
    imageId: "photo-1606220588913-b3aacb4d2f46",
    rating: 4.6,
    reviews: 198,
    customizationOptions: ["Laser etched logo", "Custom packaging"],
  },
  {
    slug: "true-wireless-earbuds",
    name: "True Wireless Earbuds Pro",
    shortDesc: "ENC mic, Bluetooth 5.3, 36h playback, custom case print.",
    description:
      "ENC microphones, Bluetooth 5.3, 36 hours of total playback. Custom-printed charging case and gift box, ideal as a premium client gift.",
    catSlug: "tech-gadgets",
    priceFrom: 1799,
    priceTo: 2999,
    wholesalePrice: 1499,
    wholesaleMinQty: 50,
    minOrderQty: 20,
    stock: 280,
    imageId: "photo-1572569511254-d8f925fe2cbb",
    rating: 4.8,
    reviews: 246,
    isFeatured: true,
    customizationOptions: ["Case print", "Custom packaging"],
  },
  {
    slug: "leather-notebook-a5",
    name: "Vegan Leather Notebook A5",
    shortDesc: "A5 size, 192 pages, dotted, elastic closure, debossed logo.",
    description:
      "Premium vegan-leather hardback notebook. 192 pages of 100GSM dotted paper, expandable inner pocket, ribbon marker and elastic closure.",
    catSlug: "stationery",
    priceFrom: 399,
    priceTo: 699,
    wholesalePrice: 299,
    wholesaleMinQty: 100,
    minOrderQty: 50,
    stock: 1450,
    imageId: "photo-1517842645767-c639042777db",
    rating: 4.7,
    reviews: 312,
    customizationOptions: ["Deboss logo", "Foil stamp", "Custom paper insert"],
  },
  {
    slug: "metal-gel-pen-set",
    name: "Metal Gel Pen Gift Set",
    shortDesc: "Twin-pen set in a magnetic gift box, smooth gel ink.",
    description:
      "A set of two metal-bodied gel pens with engraved branding, packed in a magnetic-close gift box. Smooth-flowing German gel ink refills.",
    catSlug: "stationery",
    priceFrom: 349,
    priceTo: 599,
    wholesalePrice: 269,
    wholesaleMinQty: 100,
    minOrderQty: 50,
    stock: 980,
    imageId: "photo-1583485088034-697b5bc36b92",
    rating: 4.5,
    reviews: 142,
    customizationOptions: ["Engraved logo", "Custom box insert"],
  },
  {
    slug: "bamboo-desk-organiser",
    name: "Bamboo Desk Organiser",
    shortDesc: "FSC certified bamboo, modular pen + phone + paper trays.",
    description:
      "Sustainable FSC-certified bamboo desk organiser. Modular slots for pens, phones, sticky notes and a4 paper tray. Laser-engraved branding.",
    catSlug: "eco-friendly",
    priceFrom: 549,
    priceTo: 899,
    wholesalePrice: 449,
    wholesaleMinQty: 50,
    minOrderQty: 25,
    stock: 380,
    imageId: "photo-1542601906990-b4d3fb778b09",
    rating: 4.6,
    reviews: 98,
    isFeatured: true,
    customizationOptions: ["Laser engrave", "Plant seed card"],
  },
  {
    slug: "recycled-pet-tote",
    name: "Recycled PET Foldable Tote",
    shortDesc: "Made from 12 recycled bottles, folds into a pouch.",
    description:
      "Each tote is woven from 12 recycled PET bottles. Compact pouch fold, holds up to 12 kg of groceries or supplies.",
    catSlug: "eco-friendly",
    priceFrom: 199,
    priceTo: 349,
    wholesalePrice: 149,
    wholesaleMinQty: 200,
    minOrderQty: 100,
    stock: 2200,
    imageId: "photo-1572781025007-da7e98a1b6c5",
    rating: 4.4,
    reviews: 211,
    customizationOptions: ["Eco print", "Recycled hangtag"],
  },
  {
    slug: "crystal-recognition-award",
    name: "Crystal Recognition Award",
    shortDesc: "Optical crystal, deep-cut bevel, 3D laser-engraved core.",
    description:
      "Hand-cut optical crystal with a deep bevel. 3D sub-surface laser engraving inside and a polished aluminium base.",
    catSlug: "trophies-awards",
    priceFrom: 1799,
    priceTo: 3499,
    wholesalePrice: 1499,
    wholesaleMinQty: 20,
    minOrderQty: 10,
    stock: 120,
    imageId: "photo-1555885090-b63d5fb2c8cb",
    rating: 4.9,
    reviews: 64,
    customizationOptions: ["3D laser engrave", "Custom shape"],
  },
  {
    slug: "wooden-plaque-award",
    name: "Walnut Wood Plaque Award",
    shortDesc: "Solid walnut plaque, brushed brass plate, engraved.",
    description:
      "Sustainably sourced solid walnut plaque with a brushed brass nameplate. Custom engraving included, presentation box optional.",
    catSlug: "trophies-awards",
    priceFrom: 899,
    priceTo: 1499,
    wholesalePrice: 749,
    wholesaleMinQty: 25,
    minOrderQty: 10,
    stock: 90,
    imageId: "photo-1606159068540-89bf4f8a3afc",
    rating: 4.7,
    reviews: 41,
    customizationOptions: ["Brass plate engrave", "Gift box"],
  },
];

export const mockProducts: Product[] = seed.map((p, i) => {
  const cat = mockCategories.find((c) => c.slug === p.catSlug)!;
  const gallery = (p.gallery ?? [p.imageId]).map((id, j) => ({
    id: `${p.slug}-img-${j}`,
    url: u(id),
    alt: p.name,
    sortOrder: j,
  }));
  return {
    id: `prod-${i + 1}`,
    name: p.name,
    slug: p.slug,
    description: p.description,
    shortDesc: p.shortDesc,
    sku: `LG-${p.slug.toUpperCase().slice(0, 6)}-${i + 1}`,
    priceFrom: p.priceFrom,
    priceTo: p.priceTo,
    wholesalePrice: p.wholesalePrice ?? p.priceFrom * 0.85,
    wholesaleMinQty: p.wholesaleMinQty ?? 50,
    categoryId: cat.id,
    imageUrl: u(p.imageId),
    stock: p.stock ?? 250,
    minOrderQty: p.minOrderQty ?? 25,
    isActive: true,
    isFeatured: !!p.isFeatured,
    isWholesale: !!p.isWholesale,
    customizationOptions: (p.customizationOptions ?? []).join(", "),
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    category: cat,
    images: gallery,
    rating: p.rating,
    reviews: p.reviews,
    tieredPricing: [
      { qty: p.minOrderQty ?? 25, unitPrice: p.priceFrom },
      { qty: (p.wholesaleMinQty ?? 50), unitPrice: p.wholesalePrice ?? p.priceFrom * 0.92 },
      { qty: (p.wholesaleMinQty ?? 50) * 4, unitPrice: (p.wholesalePrice ?? p.priceFrom * 0.92) * 0.92 },
      { qty: (p.wholesaleMinQty ?? 50) * 10, unitPrice: (p.wholesalePrice ?? p.priceFrom * 0.92) * 0.84 },
    ],
  };
});

// ----- Testimonials -----

export const mockTestimonials: Testimonial[] = [
  {
    id: "t1",
    clientName: "Aanya Krishnan",
    company: "Brightline Logistics",
    content:
      "Lotus Gift turned a 1200-pc onboarding kit around in nine days. Pristine QC, on-brand packaging, and they coordinated last-mile across four cities.",
    rating: 5,
    isActive: true,
  },
  {
    id: "t2",
    clientName: "Rahul Verma",
    company: "Aurelia Health",
    content:
      "We've used three vendors before — none made it this easy. The mockups, tiered pricing, and tracking dashboard saved my team a week of chasing.",
    rating: 5,
    isActive: true,
  },
  {
    id: "t3",
    clientName: "Meera Iyer",
    company: "Cedar & Co.",
    content:
      "Our festive hampers had to feel premium without inflating cost. Lotus Gift hit that brief — and shipped to 36 partner offices in under two weeks.",
    rating: 5,
    isActive: true,
  },
  {
    id: "t4",
    clientName: "Vikram Joshi",
    company: "Indus Capital",
    content:
      "From swatches to delivery, everything came with a coordinator and a clear schedule. Renewing for our next two campaigns.",
    rating: 5,
    isActive: true,
  },
];

// ----- Clients -----

export const mockClients: Client[] = [
  {
    id: "cli-1",
    companyName: "Brightline Logistics",
    contactName: "Aanya Krishnan",
    email: "aanya@brightline.in",
    phone: "+91 98101 23456",
    address: "12 Industrial Estate",
    city: "Bengaluru",
    state: "Karnataka",
    zipCode: "560058",
    notes: "Quarterly onboarding kits — 800 to 1500 units per drop.",
    createdAt: new Date("2026-03-12").toISOString(),
  },
  {
    id: "cli-2",
    companyName: "Aurelia Health",
    contactName: "Rahul Verma",
    email: "procurement@aurelia.health",
    phone: "+91 98453 67822",
    address: "Aurelia Tower, Block C",
    city: "Mumbai",
    state: "Maharashtra",
    zipCode: "400070",
    notes: "Wellness program gifting, festive hampers x2 per year.",
    createdAt: new Date("2026-04-02").toISOString(),
  },
  {
    id: "cli-3",
    companyName: "Cedar & Co.",
    contactName: "Meera Iyer",
    email: "meera@cedarco.com",
    phone: "+91 91432 11290",
    city: "Hyderabad",
    state: "Telangana",
    zipCode: "500032",
    notes: "Premium festive hampers, customised packaging.",
    createdAt: new Date("2025-12-18").toISOString(),
  },
  {
    id: "cli-4",
    companyName: "Indus Capital",
    contactName: "Vikram Joshi",
    email: "v.joshi@induscap.com",
    phone: "+91 99203 78611",
    city: "Mumbai",
    state: "Maharashtra",
    notes: "Year-end client appreciation drops.",
    createdAt: new Date("2025-11-04").toISOString(),
  },
  {
    id: "cli-5",
    companyName: "Northwind Studios",
    contactName: "Sara Pinto",
    email: "sara@northwind.studio",
    phone: "+91 90021 54420",
    city: "Pune",
    state: "Maharashtra",
    notes: "Apparel + tech kits for design retreats.",
    createdAt: new Date("2026-02-08").toISOString(),
  },
  {
    id: "cli-6",
    companyName: "Coral Studios",
    contactName: "Aditya Rao",
    email: "ops@coralstudios.in",
    phone: "+91 98112 76554",
    city: "Chennai",
    state: "Tamil Nadu",
    notes: "Notebook + drinkware kits for design partners.",
    createdAt: new Date("2026-01-25").toISOString(),
  },
];

// ----- Quotes -----

const buildQuote = (
  i: number,
  status: Quote["status"],
  clientIdx: number,
  productIdxs: number[],
  qtys: number[],
): Quote => {
  const items = productIdxs.map((pi, j) => {
    const product = mockProducts[pi]!;
    const qty = qtys[j] ?? 50;
    const unit = product.wholesalePrice ?? product.priceFrom;
    return {
      id: `qi-${i}-${j}`,
      productId: product.id,
      quantity: qty,
      unitPrice: unit,
      total: qty * unit,
      customization: product.customizationOptions ?? undefined,
      product,
    };
  });
  const subtotal = items.reduce((s, it) => s + it.total, 0);
  const discount = Math.round(subtotal * 0.05);
  const tax = Math.round((subtotal - discount) * 0.18);
  const total = subtotal - discount + tax;
  return {
    id: `q-${i}`,
    quoteNumber: `LG-Q-${String(2400 + i).padStart(4, "0")}`,
    clientId: mockClients[clientIdx]?.id,
    status,
    subtotal,
    discount,
    tax,
    total,
    notes:
      "Lead time 10–14 days post artwork approval. Mockups shared within 48h.",
    adminNotes: "Customer prefers Pantone 7728C for primary branding.",
    validUntil: new Date(Date.now() + 21 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    client: mockClients[clientIdx],
    items,
  };
};

export const mockQuotes: Quote[] = [
  buildQuote(1, "SENT", 0, [0, 4, 8], [120, 120, 120]),
  buildQuote(2, "ACCEPTED", 1, [1, 6], [240, 240]),
  buildQuote(3, "DRAFT", 2, [2, 3], [200, 200]),
  buildQuote(4, "SENT", 3, [10, 11], [100, 100]),
  buildQuote(5, "REJECTED", 4, [9], [80]),
  buildQuote(6, "ACCEPTED", 5, [12, 13], [150, 250]),
];

// ----- Orders -----

const buildOrder = (
  i: number,
  status: Order["status"],
  fromQuoteIdx: number,
): Order => {
  const q = mockQuotes[fromQuoteIdx]!;
  return {
    id: `o-${i}`,
    orderNumber: `LG-O-${String(7800 + i).padStart(4, "0")}`,
    quoteId: q.id,
    status,
    subtotal: q.subtotal,
    discount: q.discount,
    tax: q.tax,
    total: q.total,
    shippingAddress:
      `${q.client?.address ?? ""}, ${q.client?.city ?? ""}, ${q.client?.state ?? ""} ${q.client?.zipCode ?? ""}`.trim(),
    notes: q.notes,
    razorpayOrderId: `order_${Math.random().toString(36).slice(2, 12)}`,
    razorpayPaymentId:
      status === "DELIVERED" || status === "SHIPPED"
        ? `pay_${Math.random().toString(36).slice(2, 12)}`
        : undefined,
    paidAt:
      status === "DELIVERED" || status === "SHIPPED"
        ? new Date(Date.now() - i * 86400000 * 3).toISOString()
        : undefined,
    createdAt: new Date(Date.now() - i * 86400000 * 4).toISOString(),
    items: q.items.map((it, j) => ({
      id: `oi-${i}-${j}`,
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
      product: it.product,
    })),
  };
};

export const mockOrders: Order[] = [
  buildOrder(1, "DELIVERED", 1),
  buildOrder(2, "SHIPPED", 5),
  buildOrder(3, "PROCESSING", 1),
  buildOrder(4, "CONFIRMED", 0),
  buildOrder(5, "PENDING", 3),
];

// ----- Inquiries -----

export const mockInquiries: ContactInquiry[] = [
  {
    id: "inq-1",
    name: "Priya Menon",
    email: "priya@swiftedge.co",
    phone: "+91 99876 11234",
    company: "Swift Edge",
    subject: "Diwali hampers — 600 units",
    message:
      "Need a quote for 600 premium festive hampers, delivered to 4 city offices by mid-October. Branding will be debossed on box and ribbon tag.",
    status: "NEW",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "inq-2",
    name: "Karan Shah",
    email: "karan@routebox.in",
    phone: "+91 98112 88766",
    company: "Routebox",
    subject: "Welcome kits — 250 hires",
    message:
      "Onboarding kits with notebook, bottle, tote, embroidered cap. Need mockups in 5 days.",
    status: "IN_PROGRESS",
    adminNote: "Sent samples; awaiting decision on cap colour.",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "inq-3",
    name: "Anita Sen",
    email: "anita.s@meridianhealth.com",
    company: "Meridian Health",
    subject: "Drinkware bulk inquiry",
    message:
      "Looking at 2000 matte steel bottles. Pantone match required. Please share tiered pricing.",
    status: "REPLIED",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "inq-4",
    name: "Dev Reddy",
    email: "dev@latticelabs.io",
    company: "Lattice Labs",
    subject: "Awards & trophies",
    message:
      "Annual recognition program — 40 crystal awards, 3 categories. Need design help on the engraved core.",
    status: "NEW",
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

// ----- Hero slides + categories for layout chrome -----

export const heroSlides = [
  {
    eyebrow: "Faster corporate gifting",
    title: "Branded gifts that",
    highlight: "tell your story",
    description:
      "Curated hampers, branded merchandise and bespoke kits for India's most thoughtful brands. Mockups in 48 hours, dispatch in 5 days.",
    image: u("photo-1607082348824-0a96f2a4b9da", 1800),
    floatTags: ["Curated", "Customisable", "Premium"],
    cta: { label: "Browse Catalog", href: "/products" },
    secondaryCta: { label: "How it works", href: "/about" },
    productPrice: 1899,
    productLabel: "Premium Festive Hamper",
    productRating: 4.9,
    productMoq: "MOQ 25",
  },
  {
    eyebrow: "Wholesale pricing",
    title: "Bulk volumes,",
    highlight: "boutique finish",
    description:
      "Tiered pricing from 50 to 5000 units. QC at every batch, pan-India dispatch in 3–5 days, and dedicated coordinators on every order.",
    image: u("photo-1556909114-f6e7ad7d3136", 1800),
    floatTags: ["Bulk", "Wholesale", "Volume"],
    cta: { label: "Wholesale Catalog", href: "/products?wholesale=true" },
    secondaryCta: { label: "Talk to us", href: "/contact" },
    productPrice: 449,
    productLabel: "Matte Steel Bottle 750ml",
    productRating: 4.7,
    productMoq: "MOQ 100",
  },
  {
    eyebrow: "Eco-conscious gifting",
    title: "Sustainable picks,",
    highlight: "real impact",
    description:
      "Bamboo, recycled PET, jute and reclaimed cotton — production-grade gifting that aligns with your ESG goals.",
    image: u("photo-1542601906990-b4d3fb778b09", 1800),
    floatTags: ["Eco", "Bamboo", "Recycled"],
    cta: { label: "Explore Eco", href: "/categories/eco-friendly" },
    secondaryCta: { label: "Request a quote", href: "/request-quote" },
    productPrice: 549,
    productLabel: "Bamboo Desk Organiser",
    productRating: 4.6,
    productMoq: "MOQ 25",
  },
];

export const trustLogos = [
  "Northwind",
  "Brightline",
  "Cedar & Co.",
  "Aurelia Health",
  "Indus Capital",
  "Coral Studios",
  "Skyfield",
  "Linen House",
];

// ----- Stats for admin dashboard -----

export const mockAdminStats: DashboardStats = {
  totalProducts: mockProducts.length,
  totalClients: mockClients.length,
  totalQuotes: mockQuotes.length,
  totalOrders: mockOrders.length,
  pendingQuotes: mockQuotes.filter((q) => q.status === "SENT" || q.status === "DRAFT")
    .length,
  pendingOrders: mockOrders.filter(
    (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PROCESSING",
  ).length,
  totalRevenue: mockOrders.reduce((s, o) => s + o.total, 0),
  newInquiries: mockInquiries.filter((i) => i.status === "NEW").length,
  recentQuotes: mockQuotes.slice(0, 5),
  recentOrders: mockOrders.slice(0, 5),
};

// ----- Users -----

export const mockUser: User = {
  id: "user-1",
  email: "demo@brightline.in",
  name: "Aanya Krishnan",
  phone: "+91 98101 23456",
  company: "Brightline Logistics",
  role: "client",
};

export const mockAdminUser: User = {
  id: "admin-1",
  email: "admin@lotusgift.com",
  name: "Lotus Admin",
  phone: "+91 90000 00000",
  company: "Lotus Gift",
  role: "admin",
};

// ----- Activity feed (admin) -----

export type ActivityEntry = {
  id: string;
  title: string;
  meta: string;
  type: "quote" | "order" | "inquiry" | "product" | "client";
  createdAt: string;
};

export const mockActivity: ActivityEntry[] = [
  {
    id: "a1",
    title: "New quote LG-Q-2401 from Brightline Logistics",
    meta: "3 items · ₹2,18,500",
    type: "quote",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "a2",
    title: "Order LG-O-7801 marked as Shipped",
    meta: "240 units · Aurelia Health",
    type: "order",
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: "a3",
    title: "New inquiry from Swift Edge",
    meta: "Diwali hampers — 600 units",
    type: "inquiry",
    createdAt: new Date(Date.now() - 8200000).toISOString(),
  },
  {
    id: "a4",
    title: "Product added: Crystal Recognition Award",
    meta: "Trophies & Awards",
    type: "product",
    createdAt: new Date(Date.now() - 18800000).toISOString(),
  },
  {
    id: "a5",
    title: "New client onboarded: Northwind Studios",
    meta: "Pune, MH",
    type: "client",
    createdAt: new Date(Date.now() - 22000000).toISOString(),
  },
];

// ----- Revenue series (admin chart placeholder) -----

export const mockRevenueSeries: { month: string; revenue: number }[] = [
  { month: "Jan", revenue: 280000 },
  { month: "Feb", revenue: 320000 },
  { month: "Mar", revenue: 410000 },
  { month: "Apr", revenue: 380000 },
  { month: "May", revenue: 520000 },
  { month: "Jun", revenue: 480000 },
  { month: "Jul", revenue: 610000 },
  { month: "Aug", revenue: 720000 },
  { month: "Sep", revenue: 690000 },
  { month: "Oct", revenue: 880000 },
  { month: "Nov", revenue: 940000 },
  { month: "Dec", revenue: 1120000 },
];
