import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas';
import { OrderItem, OrderItemDocument } from '../schemas';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItemDocument>,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    const prefix = `ORD-${dateStr}-`;
    const lastOrder = await this.orderModel
      .findOne({ orderNumber: { $regex: `^${prefix}` } })
      .sort({ orderNumber: -1 });
    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }
    return `${prefix}${seq.toString().padStart(3, '0')}`;
  }

  async findAll(params: { status?: string; userId?: string }) {
    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    if (params.userId) filter.userId = params.userId;

    const orders = await this.orderModel.find(filter).sort({ createdAt: -1 }).lean();
    return this.attachRelations(orders);
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id).lean();
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    const [result] = await this.attachRelations([order], true);
    return result;
  }

  async create(dto: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber();
    const items = dto.items || [];
    const discount = dto.discount || 0;
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal - discount;

    const order = await this.orderModel.create({
      orderNumber,
      userId: dto.userId,
      quoteId: dto.quoteId,
      status: 'PENDING',
      subtotal,
      discount,
      total,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
    });

    if (items.length > 0) {
      await this.orderItemModel.insertMany(
        items.map((item) => ({
          orderId: order._id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        })),
      );
    }

    return this.findOne(order._id);
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.shippingAddress !== undefined) data.shippingAddress = dto.shippingAddress;
    if (dto.notes !== undefined) data.notes = dto.notes;
    await this.orderModel.findByIdAndUpdate(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.orderItemModel.deleteMany({ orderId: id });
    return this.orderModel.findByIdAndDelete(id);
  }

  private async attachRelations(orders: any[], includeFullQuote = false) {
    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o._id);
    const userIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))];
    const quoteIds = [...new Set(orders.map((o) => o.quoteId).filter(Boolean))];

    const db = this.orderModel.db;
    const [items, users, quotes, products] = await Promise.all([
      this.orderItemModel.find({ orderId: { $in: orderIds } }).lean(),
      userIds.length > 0
        ? db.collection('user').find({ _id: { $in: userIds } }).project({ _id: 1, name: 1, email: 1, company: 1 }).toArray()
        : Promise.resolve([]),
      quoteIds.length > 0
        ? db.collection('quotes').find({ _id: { $in: quoteIds } }).toArray()
        : Promise.resolve([]),
      db.collection('products').find({}).toArray(),
    ]);

    const userMap = new Map(users.map((u: any) => [u._id, { id: u._id, name: u.name, email: u.email, company: u.company }]));
    const quoteMap = new Map(quotes.map((q: any) => [q._id, includeFullQuote ? q : { id: q._id, quoteNumber: q.quoteNumber }]));
    const productMap = new Map(products.map((p: any) => [p._id, p]));

    const itemsByOrder = new Map<string, any[]>();
    for (const item of items) {
      if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
      itemsByOrder.get(item.orderId)!.push({
        ...item,
        id: item._id,
        product: productMap.get(item.productId) || null,
      });
    }

    return orders.map((o) => ({
      ...o,
      id: o._id,
      user: o.userId ? userMap.get(o.userId) || null : null,
      quote: o.quoteId ? quoteMap.get(o.quoteId) || null : null,
      items: itemsByOrder.get(o._id) || [],
    }));
  }
}
