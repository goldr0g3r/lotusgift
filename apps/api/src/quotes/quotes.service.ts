import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quote, QuoteDocument } from '../schemas';
import { QuoteItem, QuoteItemDocument } from '../schemas';
import { CreateQuoteDto, CreateQuoteItemDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    @InjectModel(QuoteItem.name) private quoteItemModel: Model<QuoteItemDocument>,
  ) {}

  private async generateQuoteNumber(): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const prefix = `QT-${dateStr}-`;
    const lastQuote = await this.quoteModel
      .findOne({ quoteNumber: { $regex: `^${prefix}` } })
      .sort({ quoteNumber: -1 });

    let seq = 1;
    if (lastQuote) {
      const lastSeq = parseInt(lastQuote.quoteNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(3, '0')}`;
  }

  async findAll(params: { status?: string; userId?: string }) {
    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    if (params.userId) filter.userId = params.userId;

    const quotes = await this.quoteModel.find(filter).sort({ createdAt: -1 }).lean();
    return this.attachRelations(quotes);
  }

  async findOne(id: string) {
    const quote = await this.quoteModel.findById(id).lean();
    if (!quote) throw new NotFoundException(`Quote #${id} not found`);
    const [result] = await this.attachRelations([quote]);
    return result;
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

    const quote = await this.quoteModel.create({
      quoteNumber,
      clientId: dto.clientId,
      userId: dto.userId,
      status: 'DRAFT',
      subtotal,
      discount,
      total,
      notes: dto.notes,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
    });

    if (items.length > 0) {
      await this.quoteItemModel.insertMany(
        items.map((item) => ({
          quoteId: quote._id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        })),
      );
    }

    return this.findOne(quote._id);
  }

  async update(id: string, dto: UpdateQuoteDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.discount !== undefined) data.discount = dto.discount;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.validUntil !== undefined) data.validUntil = new Date(dto.validUntil);

    if (dto.discount !== undefined) {
      const quote = await this.quoteModel.findById(id);
      if (quote) {
        data.total = quote.subtotal - dto.discount;
      }
    }

    await this.quoteModel.findByIdAndUpdate(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.quoteItemModel.deleteMany({ quoteId: id });
    return this.quoteModel.findByIdAndDelete(id);
  }

  async addItem(quoteId: string, dto: CreateQuoteItemDto) {
    await this.findOne(quoteId);

    const itemTotal = dto.unitPrice * dto.quantity;
    const item = await this.quoteItemModel.create({
      quoteId,
      productId: dto.productId,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      total: itemTotal,
    });

    await this.recalculateQuoteTotals(quoteId);
    return item;
  }

  async removeItem(quoteId: string, itemId: string) {
    const item = await this.quoteItemModel.findOne({ _id: itemId, quoteId });
    if (!item) throw new NotFoundException(`Quote item #${itemId} not found`);

    await this.quoteItemModel.findByIdAndDelete(itemId);
    await this.recalculateQuoteTotals(quoteId);

    return { deleted: true };
  }

  private async recalculateQuoteTotals(quoteId: string) {
    const items = await this.quoteItemModel.find({ quoteId });
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const quote = await this.quoteModel.findById(quoteId);
    const discount = quote?.discount || 0;

    await this.quoteModel.findByIdAndUpdate(quoteId, {
      subtotal,
      total: subtotal - discount,
    });
  }

  private async attachRelations(quotes: any[]) {
    if (quotes.length === 0) return [];

    const quoteIds = quotes.map((q) => q._id);
    const clientIds = [...new Set(quotes.map((q) => q.clientId).filter(Boolean))];

    const [items, clients, products] = await Promise.all([
      this.quoteItemModel.find({ quoteId: { $in: quoteIds } }).lean(),
      clientIds.length > 0
        ? this.quoteModel.db
            .collection('clients')
            .find({ _id: { $in: clientIds } })
            .toArray()
        : Promise.resolve([]),
      this.quoteItemModel.db
        .collection('products')
        .find({})
        .toArray(),
    ]);

    const clientMap = new Map(clients.map((c: any) => [c._id, c]));
    const productMap = new Map(products.map((p: any) => [p._id, p]));

    const itemsByQuote = new Map<string, any[]>();
    for (const item of items) {
      if (!itemsByQuote.has(item.quoteId)) itemsByQuote.set(item.quoteId, []);
      itemsByQuote.get(item.quoteId)!.push({
        ...item,
        id: item._id,
        product: productMap.get(item.productId) || null,
      });
    }

    return quotes.map((q) => ({
      ...q,
      id: q._id,
      client: q.clientId ? clientMap.get(q.clientId) || null : null,
      items: itemsByQuote.get(q._id) || [],
    }));
  }
}
