import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    const prefix = `ORD-${dateStr}-`;
    const lastOrder = await this.prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
    });
    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }
    return `${prefix}${seq.toString().padStart(3, '0')}`;
  }

  async findAll(params: { status?: string; userId?: string }) {
    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.userId) where.userId = params.userId;
    return this.prisma.order.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, company: true } }, items: { include: { product: true } }, quote: { select: { id: true, quoteNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, company: true } }, items: { include: { product: true } }, quote: true },
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  async create(dto: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber();
    const items = dto.items || [];
    const discount = dto.discount || 0;
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal - discount;
    return this.prisma.order.create({
      data: {
        orderNumber,
        userId: dto.userId,
        quoteId: dto.quoteId,
        status: 'PENDING',
        subtotal,
        discount,
        total,
        shippingAddress: dto.shippingAddress,
        notes: dto.notes,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: { user: { select: { id: true, name: true, email: true } }, items: { include: { product: true } } },
    });
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.shippingAddress !== undefined) data.shippingAddress = dto.shippingAddress;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.razorpayPaymentId !== undefined) {
      data.razorpayPaymentId = dto.razorpayPaymentId;
      data.paidAt = new Date();
    }
    return this.prisma.order.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true } }, items: { include: { product: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }
}
