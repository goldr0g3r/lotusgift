import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Quote,
  QuoteDocument,
  QuoteItem,
  QuoteItemDocument,
  Product,
  ProductDocument,
  SiteSetting,
  SiteSettingDocument,
} from '../schemas';
import { CreateQuoteDto, CreateQuoteItemDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

interface PricedItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

@Injectable()
export class QuotesService {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    @InjectModel(QuoteItem.name) private quoteItemModel: Model<QuoteItemDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(SiteSetting.name) private settingModel: Model<SiteSettingDocument>,
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

  /**
   * Resolve authoritative unit prices from the product catalog.
   * Wholesale price applies when `quantity >= product.wholesaleMinQty`
   * and the product has wholesale enabled with a configured wholesalePrice.
   */
  private async priceItems(
    items: CreateQuoteItemDto[],
  ): Promise<PricedItem[]> {
    if (items.length === 0) return [];

    const ids = [...new Set(items.map((i) => i.productId))];
    const products = await this.productModel
      .find({ _id: { $in: ids }, isActive: true })
      .lean();
    const map = new Map(products.map((p) => [p._id, p]));

    return items.map((item) => {
      const product = map.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} is not available.`,
        );
      }

      const useWholesale =
        product.isWholesale &&
        typeof product.wholesalePrice === 'number' &&
        product.wholesalePrice > 0 &&
        item.quantity >= (product.wholesaleMinQty || 1);
      const unitPrice = useWholesale
        ? (product.wholesalePrice as number)
        : product.priceFrom;

      const total = Math.round(unitPrice * item.quantity * 100) / 100;
      return {
        productId: product._id,
        quantity: item.quantity,
        unitPrice,
        total,
      };
    });
  }

  /**
   * Read tax rate (percent) from site settings. Defaults to 0 if not set.
   */
  private async getTaxRate(): Promise<number> {
    const setting = await this.settingModel.findOne({ key: 'tax_rate' }).lean();
    if (!setting) return 0;
    const parsed = parseFloat(setting.value);
    if (Number.isNaN(parsed) || parsed < 0) return 0;
    return parsed;
  }

  private computeTotals(
    items: PricedItem[],
    discount: number,
    taxRatePct: number,
  ) {
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const taxableBase = Math.max(0, subtotal - discount);
    const tax = Math.round((taxableBase * taxRatePct) / 100 * 100) / 100;
    const total = Math.round((taxableBase + tax) * 100) / 100;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
    };
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

    const priced = await this.priceItems(items);
    const taxRate = await this.getTaxRate();
    const { subtotal, tax, total } = this.computeTotals(priced, discount, taxRate);

    const quote = await this.quoteModel.create({
      quoteNumber,
      clientId: dto.clientId,
      userId: dto.userId,
      status: 'DRAFT',
      subtotal,
      discount,
      tax,
      total,
      notes: dto.notes,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
    });

    if (priced.length > 0) {
      await this.quoteItemModel.insertMany(
        priced.map((item) => ({
          quoteId: quote._id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      );
    }

    return this.findOne(quote._id);
  }

  async update(id: string, dto: UpdateQuoteDto) {
    const existing = await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.validUntil !== undefined) data.validUntil = new Date(dto.validUntil);

    if (dto.discount !== undefined) {
      data.discount = dto.discount;
      const taxRate = await this.getTaxRate();
      const taxableBase = Math.max(0, existing.subtotal - dto.discount);
      const tax = Math.round((taxableBase * taxRate) / 100 * 100) / 100;
      data.tax = tax;
      data.total = Math.round((taxableBase + tax) * 100) / 100;
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

    const [priced] = await this.priceItems([dto]);
    if (!priced) throw new BadRequestException('Product not available');

    const item = await this.quoteItemModel.create({
      quoteId,
      productId: priced.productId,
      quantity: priced.quantity,
      unitPrice: priced.unitPrice,
      total: priced.total,
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

    const taxRate = await this.getTaxRate();
    const taxableBase = Math.max(0, subtotal - discount);
    const tax = Math.round((taxableBase * taxRate) / 100 * 100) / 100;
    const total = Math.round((taxableBase + tax) * 100) / 100;

    await this.quoteModel.findByIdAndUpdate(quoteId, {
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
    });
  }

  private async attachRelations(quotes: any[]) {
    if (quotes.length === 0) return [];

    const quoteIds = quotes.map((q) => q._id);
    const clientIds = [...new Set(quotes.map((q) => q.clientId).filter(Boolean))];

    const items = await this.quoteItemModel
      .find({ quoteId: { $in: quoteIds } })
      .lean();
    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];

    const [clients, products] = await Promise.all([
      clientIds.length > 0
        ? this.quoteModel.db
            .collection('clients')
            .find({ _id: { $in: clientIds } })
            .toArray()
        : Promise.resolve([]),
      productIds.length > 0
        ? this.productModel
            .find({ _id: { $in: productIds } })
            .lean()
        : Promise.resolve([]),
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
