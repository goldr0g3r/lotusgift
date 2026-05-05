import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItemDocument>,
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    @InjectModel(QuoteItem.name) private quoteItemModel: Model<QuoteItemDocument>,
    private config: ConfigService,
  ) {}

  private isDevEnvironment(): boolean {
    const env = this.config.get<string>('NODE_ENV') || process.env.NODE_ENV;
    return env !== 'production';
  }

  private async markOrderPaid(
    orderId: string,
    razorpayPaymentId: string,
  ): Promise<{ alreadyPaid: boolean }> {
    const order = await this.orderModel.findById(orderId).lean();
    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }
    if (order.paidAt) {
      return { alreadyPaid: true };
    }
    await this.orderModel.findByIdAndUpdate(orderId, {
      razorpayPaymentId,
      status: 'CONFIRMED',
      paidAt: new Date(),
    });
    return { alreadyPaid: false };
  }

  async createRazorpayOrder(orderId: string, actor: { id: string; role?: string }) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    if (actor.role !== 'admin') {
      if (!order.userId || order.userId !== actor.id) {
        throw new ForbiddenException('You can only pay for your own orders');
      }
    }

    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      if (!this.isDevEnvironment()) {
        throw new ServiceUnavailableException(
          'Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
        );
      }
      this.logger.warn(
        'Razorpay not configured. Returning demo response (non-production only).',
      );
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
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

    if (!keySecret) {
      if (!this.isDevEnvironment()) {
        throw new ServiceUnavailableException(
          'Payment verification is not configured. Set RAZORPAY_KEY_SECRET.',
        );
      }
      // Dev-only "demo mode": still scope by user, still 404 on missing order,
      // and still short-circuit if already paid.
      const order = await this.orderModel.findOne({
        razorpayOrderId: dto.razorpay_order_id,
      });
      if (!order) {
        throw new NotFoundException('Order for given razorpay_order_id not found');
      }
      if (actor.role !== 'admin') {
        if (!order.userId || order.userId !== actor.id) {
          throw new ForbiddenException('You can only verify your own orders');
        }
      }
      const { alreadyPaid } = await this.markOrderPaid(
        order._id,
        dto.razorpay_payment_id,
      );
      return {
        success: true,
        alreadyPaid,
        message: alreadyPaid
          ? 'Order was already paid'
          : 'Payment recorded (demo mode)',
      };
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

    if (!order) {
      throw new NotFoundException('Order for given razorpay_order_id not found');
    }

    if (actor.role !== 'admin') {
      if (!order.userId || order.userId !== actor.id) {
        throw new ForbiddenException('You can only verify your own orders');
      }
    }

    const { alreadyPaid } = await this.markOrderPaid(
      order._id,
      dto.razorpay_payment_id,
    );

    return {
      success: true,
      alreadyPaid,
      message: alreadyPaid
        ? 'Order was already paid'
        : 'Payment verified successfully',
    };
  }

  /**
   * Razorpay webhook entry point (server-to-server, no user session).
   *
   * Verifies HMAC SHA-256 of the raw request body using
   * `RAZORPAY_WEBHOOK_SECRET`. Handles `payment.captured` events idempotently —
   * orders that already have `paidAt` are short-circuited.
   */
  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'Webhook is not configured. Set RAZORPAY_WEBHOOK_SECRET.',
      );
    }
    if (!signature) {
      throw new BadRequestException('Missing X-Razorpay-Signature header');
    }
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Empty webhook body');
    }

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    if (expected !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
      throw new BadRequestException('Webhook body is not valid JSON');
    }

    const event: string | undefined = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderId: string | undefined = paymentEntity?.order_id;
    const paymentId: string | undefined = paymentEntity?.id;

    if (event !== 'payment.captured' && event !== 'payment.authorized') {
      // Acknowledge receipt for events we don't act on.
      return { received: true, handled: false, event };
    }

    if (!orderId || !paymentId) {
      throw new BadRequestException('Webhook payload missing payment.entity ids');
    }

    const order = await this.orderModel.findOne({ razorpayOrderId: orderId });
    if (!order) {
      // Idempotent: webhook may arrive before our local create-order writes
      // razorpayOrderId. Returning 200 here lets Razorpay stop retrying for
      // unrelated orders; if you'd rather have it retry, switch to NotFoundException.
      this.logger.warn(
        `Webhook payment.captured received for unknown razorpayOrderId=${orderId}`,
      );
      return { received: true, handled: false, reason: 'order_not_found' };
    }

    const { alreadyPaid } = await this.markOrderPaid(order._id, paymentId);
    return { received: true, handled: true, alreadyPaid };
  }

  async convertQuoteToOrder(quoteId: string, actor: { id: string; role?: string }): Promise<any> {
    const quote = await this.quoteModel.findById(quoteId);
    if (!quote) throw new BadRequestException('Quote not found');
    if (actor.role !== 'admin') {
      if (!quote.userId || quote.userId !== actor.id) {
        throw new ForbiddenException('You can only convert your own quotes');
      }
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
