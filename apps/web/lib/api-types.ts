// Domain types reused throughout the redesigned UI.
// During the standalone phase these power the mock data layer; the same shapes
// will be honoured by the real API once it is wired back in.

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
}

export interface PriceTier {
  qty: number;
  unitPrice: number;
}

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
  // UI-only enrichment fields (sourced from mocks for now).
  rating?: number;
  reviews?: number;
  tieredPricing?: PriceTier[];
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

export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId?: string;
  userId?: string;
  status: QuoteStatus;
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

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  quoteId?: string;
  status: OrderStatus;
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

export type InquiryStatus = "NEW" | "IN_PROGRESS" | "REPLIED" | "CLOSED";

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  status: InquiryStatus;
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
