import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from '../schemas';
import { Quote, QuoteDocument } from '../schemas';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
  ) {}

  async findAll(params: { search?: string }): Promise<any> {
    const filter: Record<string, unknown> = {};
    if (params.search) {
      filter.$or = [
        { companyName: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
        { contactName: { $regex: params.search, $options: 'i' } },
      ];
    }

    const clients = await this.clientModel.find(filter).sort({ createdAt: -1 }).lean();
    const clientIds = clients.map((c) => c._id);
    const quotes = await this.quoteModel
      .find({ clientId: { $in: clientIds } })
      .select('_id quoteNumber status total clientId')
      .lean();

    const quoteMap = new Map<string, typeof quotes>();
    for (const q of quotes) {
      const cid = q.clientId!;
      if (!quoteMap.has(cid)) quoteMap.set(cid, []);
      quoteMap.get(cid)!.push(q);
    }

    return clients.map((c) => ({
      ...c,
      id: c._id,
      quotes: (quoteMap.get(c._id) || []).map((q) => ({
        id: q._id,
        quoteNumber: q.quoteNumber,
        status: q.status,
        total: q.total,
      })),
    }));
  }

  async findOne(id: string): Promise<any> {
    const client = await this.clientModel.findById(id).lean();
    if (!client) throw new NotFoundException(`Client #${id} not found`);
    const quotes = await this.quoteModel.find({ clientId: id }).lean();
    return { ...client, id: client._id, quotes };
  }

  async create(dto: CreateClientDto) {
    return this.clientModel.create(dto);
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.clientModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.clientModel.findByIdAndDelete(id);
  }
}
