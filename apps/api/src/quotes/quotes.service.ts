import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto, CreateQuoteItemDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  private async generateQuoteNumber(): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const prefix = `QT-${dateStr}-`;
    const lastQuote = await this.prisma.quote.findFirst({
      where: { quoteNumber: { startsWith: prefix } },
      orderBy: { quoteNumber: 'desc' },
    });

    let seq = 1;
    if (lastQuote) {
      const lastSeq = parseInt(lastQuote.quoteNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(3, '0')}`;
  }

  async findAll(params: { status?: string }) {
    const where: Record<string, unknown> = {};
    if (params.status) {
      where.status = params.status;
    }

    return this.prisma.quote.findMany({
      where,
      include: {
        client: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });
    if (!quote) throw new NotFoundException(`Quote #${id} not found`);
    return quote;
  }

  async create(dto: CreateQuoteDto) {
    const quoteNumber = await this.generateQuoteNumber();
    const items = dto.items || [];
    const discount = dto.discount || 0;

    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const total = subtotal - discount;

    return this.prisma.quote.create({
      data: {
        quoteNumber,
        clientId: dto.clientId,
        status: 'DRAFT',
        subtotal,
        discount,
        total,
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });
  }

  async update(id: string, dto: UpdateQuoteDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.discount !== undefined) data.discount = dto.discount;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.validUntil !== undefined) data.validUntil = new Date(dto.validUntil);

    if (dto.discount !== undefined) {
      const quote = await this.prisma.quote.findUnique({ where: { id } });
      if (quote) {
        data.total = quote.subtotal - dto.discount;
      }
    }

    return this.prisma.quote.update({
      where: { id },
      data,
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.quote.delete({ where: { id } });
  }

  async addItem(quoteId: string, dto: CreateQuoteItemDto) {
    await this.findOne(quoteId);

    const itemTotal = dto.unitPrice * dto.quantity;
    const item = await this.prisma.quoteItem.create({
      data: {
        quoteId,
        productId: dto.productId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        total: itemTotal,
      },
      include: { product: true },
    });

    await this.recalculateQuoteTotals(quoteId);
    return item;
  }

  async removeItem(quoteId: string, itemId: string) {
    const item = await this.prisma.quoteItem.findFirst({
      where: { id: itemId, quoteId },
    });
    if (!item) throw new NotFoundException(`Quote item #${itemId} not found`);

    await this.prisma.quoteItem.delete({ where: { id: itemId } });
    await this.recalculateQuoteTotals(quoteId);

    return { deleted: true };
  }

  private async recalculateQuoteTotals(quoteId: string) {
    const items = await this.prisma.quoteItem.findMany({ where: { quoteId } });
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    const discount = quote?.discount || 0;

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { subtotal, total: subtotal - discount },
    });
  }
}
