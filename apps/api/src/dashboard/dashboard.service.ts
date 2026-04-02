import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Product, ProductDocument,
  Client, ClientDocument,
  Quote, QuoteDocument, QuoteItem, QuoteItemDocument,
  Order, OrderDocument, OrderItem, OrderItemDocument,
  ContactInquiry, ContactInquiryDocument,
  User, UserDocument,
} from '../schemas';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    @InjectModel(QuoteItem.name) private quoteItemModel: Model<QuoteItemDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItemDocument>,
    @InjectModel(ContactInquiry.name) private contactModel: Model<ContactInquiryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getStats(): Promise<any> {
    const [
      totalProducts,
      totalClients,
      totalQuotes,
      totalOrders,
      pendingQuotes,
      pendingOrders,
      recentQuotesRaw,
      recentOrdersRaw,
      revenueResult,
      newInquiries,
    ] = await Promise.all([
      this.productModel.countDocuments({ isActive: true }),
      this.clientModel.countDocuments(),
      this.quoteModel.countDocuments(),
      this.orderModel.countDocuments(),
      this.quoteModel.countDocuments({ status: 'DRAFT' }),
      this.orderModel.countDocuments({ status: 'PENDING' }),
      this.quoteModel.find().sort({ createdAt: -1 }).limit(5).lean(),
      this.orderModel.find().sort({ createdAt: -1 }).limit(5).lean(),
      this.orderModel.aggregate([
        { $match: { status: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      this.contactModel.countDocuments({ status: 'NEW' }),
    ]);

    const quoteIds = recentQuotesRaw.map((q) => q._id);
    const quoteClientIds = [...new Set(recentQuotesRaw.map((q) => q.clientId).filter(Boolean))];
    const [quoteItems, quoteClients, quoteProducts] = await Promise.all([
      this.quoteItemModel.find({ quoteId: { $in: quoteIds } }).lean(),
      quoteClientIds.length > 0
        ? this.clientModel.find({ _id: { $in: quoteClientIds } }).lean()
        : Promise.resolve([]),
      this.productModel.find().lean(),
    ]);

    const clientMap = new Map(quoteClients.map((c) => [c._id, c]));
    const productMap = new Map(quoteProducts.map((p) => [p._id, p]));

    const quoteItemsByQuote = new Map<string, any[]>();
    for (const item of quoteItems) {
      if (!quoteItemsByQuote.has(item.quoteId)) quoteItemsByQuote.set(item.quoteId, []);
      quoteItemsByQuote.get(item.quoteId)!.push({
        ...item,
        id: item._id,
        product: productMap.get(item.productId) || null,
      });
    }

    const recentQuotes = recentQuotesRaw.map((q) => ({
      ...q,
      id: q._id,
      client: q.clientId ? clientMap.get(q.clientId) || null : null,
      items: quoteItemsByQuote.get(q._id) || [],
    }));

    const orderIds = recentOrdersRaw.map((o) => o._id);
    const orderUserIds = [...new Set(recentOrdersRaw.map((o) => o.userId).filter(Boolean))];
    const [orderItems, orderUsers] = await Promise.all([
      this.orderItemModel.find({ orderId: { $in: orderIds } }).lean(),
      orderUserIds.length > 0
        ? this.userModel.find({ _id: { $in: orderUserIds } }).select('_id name email').lean()
        : Promise.resolve([]),
    ]);

    const userMap = new Map(orderUsers.map((u) => [u._id, { id: u._id, name: u.name, email: u.email }]));

    const orderItemsByOrder = new Map<string, any[]>();
    for (const item of orderItems) {
      if (!orderItemsByOrder.has(item.orderId)) orderItemsByOrder.set(item.orderId, []);
      orderItemsByOrder.get(item.orderId)!.push({
        ...item,
        id: item._id,
        product: productMap.get(item.productId) || null,
      });
    }

    const recentOrders = recentOrdersRaw.map((o) => ({
      ...o,
      id: o._id,
      user: o.userId ? userMap.get(o.userId) || null : null,
      items: orderItemsByOrder.get(o._id) || [],
    }));

    return {
      totalProducts,
      totalClients,
      totalQuotes,
      totalOrders,
      pendingQuotes,
      pendingOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      newInquiries,
      recentQuotes,
      recentOrders,
    };
  }
}
