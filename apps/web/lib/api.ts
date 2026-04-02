const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T = unknown>(endpoint: string) => fetchAPI<T>(endpoint),
  post: <T = unknown>(endpoint: string, data: unknown) =>
    fetchAPI<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T = unknown>(endpoint: string, data: unknown) =>
    fetchAPI<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T = unknown>(endpoint: string) =>
    fetchAPI<T>(endpoint, { method: 'DELETE' }),
};

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc?: string;
  sku: string;
  priceFrom: number;
  priceTo?: number;
  wholesalePrice?: number;
  wholesaleMinQty: number;
  categoryId: string;
  imageUrl?: string;
  stock: number;
  minOrderQty: number;
  isActive: boolean;
  isFeatured: boolean;
  isWholesale: boolean;
  customizationOptions?: string;
  createdAt: string;
  category: Category;
  images: ProductImage[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId?: string;
  userId?: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  adminNotes?: string;
  validUntil?: string;
  createdAt: string;
  client?: Client;
  items: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  customization?: string;
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  quoteId?: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  shippingAddress?: string;
  notes?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: Product;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  status: string;
  adminNote?: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  company?: string;
  content: string;
  rating: number;
  isActive: boolean;
}

export interface DashboardStats {
  totalProducts: number;
  totalClients: number;
  totalQuotes: number;
  totalOrders: number;
  pendingQuotes: number;
  pendingOrders: number;
  totalRevenue: number;
  newInquiries: number;
  recentQuotes: Quote[];
  recentOrders: Order[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  role: string;
}

