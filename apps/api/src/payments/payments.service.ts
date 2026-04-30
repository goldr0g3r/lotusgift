import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas';
import { OrderItem, OrderItemDocument } from '../schemas';
import { Quote, QuoteDocument } from '../schemas';
import { QuoteItem, QuoteItemDocument } from '../schemas';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItemDocument>,
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    @InjectModel(QuoteItem.name) private quoteItemModel: Model<QuoteItemDocument>,
    private config: ConfigService,
  ) {}

  async createRazorpayOrder(orderId: string, actor: { id: string; role?: string }) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new BadRequestException('Order not found');
    if (actor.role !== 'admin' && order.userId && order.userId !== actor.id) {
      throw new ForbiddenException('You can only pay for your own orders');
    }

    const keyId = this.config.get('RAZORPAY_KEY_ID');
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      return {
        message: 'Razorpay not configured. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
        order,
        demo: true,
      };
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order._id },
    });

    await this.orderModel.findByIdAndUpdate(orderId, {
      razorpayOrderId: razorpayOrder.id,
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto, actor: { id: string; role?: string }) {
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET');

    if (!keySecret) {
      const order = await this.orderModel.findOne({
        razorpayOrderId: dto.razorpay_order_id,
      });
      if (order) {
        if (actor.role !== 'admin' && order.userId && order.userId !== actor.id) {
          throw new ForbiddenException('You can only verify your own orders');
        }
        await this.orderModel.findByIdAndUpdate(order._id, {
          razorpayPaymentId: dto.razorpay_payment_id,
          status: 'CONFIRMED',
          paidAt: new Date(),
        });
      }
      return { success: true, message: 'Payment recorded (demo mode)' };
    }

    const body = dto.razorpay_order_id + '|' + dto.razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const order = await this.orderModel.findOne({
      razorpayOrderId: dto.razorpay_order_id,
    });

    if (order) {
      if (actor.role !== 'admin' && order.userId && order.userId !== actor.id) {
        throw new ForbiddenException('You can only verify your own orders');
      }
      await this.orderModel.findByIdAndUpdate(order._id, {
        razorpayPaymentId: dto.razorpay_payment_id,
        status: 'CONFIRMED',
        paidAt: new Date(),
      });
    }

    return { success: true, message: 'Payment verified successfully' };
  }

  async convertQuoteToOrder(quoteId: string, actor: { id: string; role?: string }): Promise<any> {
    const quote = await this.quoteModel.findById(quoteId);
    if (!quote) throw new BadRequestException('Quote not found');
    if (actor.role !== 'admin' && quote.userId && quote.userId !== actor.id) {
      throw new ForbiddenException('You can only convert your own quotes');
    }
    if (quote.status !== 'ACCEPTED') throw new BadRequestException('Quote must be accepted before converting to order');

    const quoteItems = await this.quoteItemModel.find({ quoteId });

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
    const orderNumber = `${prefix}${seq.toString().padStart(3, '0')}`;

    const order = await this.orderModel.create({
      orderNumber,
      userId: quote.userId,
      quoteId: quote._id,
      status: 'PENDING',
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.tax,
      total: quote.total,
    });

    if (quoteItems.length > 0) {
      await this.orderItemModel.insertMany(
        quoteItems.map((item) => ({
          orderId: order._id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      );
    }

    const orderItems = await this.orderItemModel.find({ orderId: order._id }).lean();
    const productIds = orderItems.map((i) => i.productId);
    const products = await this.orderModel.db.collection('products').find({ _id: { $in: productIds } } as any).toArray();
    const productMap = new Map(products.map((p: any) => [p._id, p]));

    return {
      ...order.toObject(),
      id: order._id,
      items: orderItems.map((i) => ({
        ...i,
        id: i._id,
        product: productMap.get(i.productId) || null,
      })),
    };
  }
}
