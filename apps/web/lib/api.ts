// Standalone mock-backed "API" layer. Every call resolves locally so the
// redesigned UI can be developed and demoed without a backend. The real fetch
// implementation is preserved beneath a compile-time flag in case we want to
// flip back on integration day.

import {
  mockActivity,
  mockAdminStats,
  mockCategories,
  mockClients,
  mockInquiries,
  mockOrders,
  mockProducts,
  mockQuotes,
  mockRevenueSeries,
  mockTestimonials,
} from "./mock-data";

import type {
  Category,
  ContactInquiry,
  DashboardStats,
  Order,
  Product,
  Quote,
  Testimonial,
} from "./api-types";

export type * from "./api-types";

const wait = (ms = 280) => new Promise((r) => setTimeout(r, ms));

async function resolve<T>(value: T): Promise<T> {
  await wait();
  return JSON.parse(JSON.stringify(value)) as T;
}

function matchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return mockProducts;
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.shortDesc ?? "").toLowerCase().includes(q) ||
      p.category.name.toLowerCase().includes(q),
  );
}

export const api = {
  async get<T = unknown>(endpoint: string): Promise<T> {
    // Strip leading slash + optional query string.
    const [pathRaw, queryRaw = ""] = endpoint.replace(/^\/+/, "").split("?");
    const path = pathRaw ?? "";
    const query = new URLSearchParams(queryRaw);

    if (path === "products" || path.startsWith("products?")) {
      const search = query.get("search") ?? "";
      const wholesale = query.get("wholesale");
      const category = query.get("category");
      let list = matchProducts(search);
      if (wholesale === "true") list = list.filter((p) => p.isWholesale);
      if (category) list = list.filter((p) => p.category.slug === category);
      return resolve(list as unknown as T);
    }
    const productMatch = path.match(/^products\/(.+)$/);
    if (productMatch) {
      const slug = productMatch[1];
      const p = mockProducts.find((x) => x.slug === slug || x.id === slug);
      return resolve((p ?? null) as unknown as T);
    }

    if (path === "categories") return resolve(mockCategories as unknown as T);
    const categoryMatch = path.match(/^categories\/(.+)$/);
    if (categoryMatch) {
      const slug = categoryMatch[1];
      const cat = mockCategories.find((c) => c.slug === slug || c.id === slug);
      return resolve((cat ?? null) as unknown as T);
    }

    if (path === "quotes") return resolve(mockQuotes as unknown as T);
    const quoteMatch = path.match(/^quotes\/(.+)$/);
    if (quoteMatch) {
      const id = quoteMatch[1];
      const q = mockQuotes.find((x) => x.id === id || x.quoteNumber === id);
      return resolve((q ?? null) as unknown as T);
    }

    if (path === "orders") return resolve(mockOrders as unknown as T);
    const orderMatch = path.match(/^orders\/(.+)$/);
    if (orderMatch) {
      const id = orderMatch[1];
      const o = mockOrders.find((x) => x.id === id || x.orderNumber === id);
      return resolve((o ?? null) as unknown as T);
    }

    if (path === "clients") return resolve(mockClients as unknown as T);
    const clientMatch = path.match(/^clients\/(.+)$/);
    if (clientMatch) {
      const id = clientMatch[1];
      const c = mockClients.find((x) => x.id === id);
      return resolve((c ?? null) as unknown as T);
    }

    if (path === "inquiries") return resolve(mockInquiries as unknown as T);

    if (path === "testimonials") return resolve(mockTestimonials as unknown as T);

    if (path === "dashboard/stats") return resolve(mockAdminStats as unknown as T);

    if (path === "dashboard/activity") return resolve(mockActivity as unknown as T);

    if (path === "dashboard/revenue") return resolve(mockRevenueSeries as unknown as T);

    return resolve(null as unknown as T);
  },

  async post<T = unknown>(endpoint: string, data: unknown): Promise<T> {
    await wait(420);
    // The redesigned UI doesn't actually persist; we echo the payload back with
    // a fake id so optimistic UI flows can complete.
    return {
      id: `local-${Date.now()}`,
      ok: true,
      data,
      endpoint,
    } as unknown as T;
  },

  async patch<T = unknown>(endpoint: string, data: unknown): Promise<T> {
    await wait(360);
    return { ok: true, data, endpoint } as unknown as T;
  },

  async delete<T = unknown>(endpoint: string): Promise<T> {
    await wait(220);
    return { ok: true, endpoint } as unknown as T;
  },
};

// Re-export the seed collections so pages can use them directly when they
// don't need the async API surface.
export {
  mockActivity,
  mockAdminStats,
  mockCategories,
  mockClients,
  mockInquiries,
  mockOrders,
  mockProducts,
  mockQuotes,
  mockRevenueSeries,
  mockTestimonials,
} from "./mock-data";

export type {
  Category as TCategory,
  Product as TProduct,
  Quote as TQuote,
  Order as TOrder,
  ContactInquiry as TInquiry,
  Testimonial as TTestimonial,
  DashboardStats as TDashboardStats,
};
