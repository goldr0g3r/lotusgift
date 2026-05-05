import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactInquiry, ContactInquiryDocument } from '../schemas';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(@InjectModel(ContactInquiry.name) private contactModel: Model<ContactInquiryDocument>) {}

  async findAll(params: { status?: string }) {
    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    return this.contactModel.find(filter).sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const inquiry = await this.contactModel.findById(id);
    if (!inquiry) throw new NotFoundException(`Inquiry #${id} not found`);
    return inquiry;
  }

  async create(dto: CreateContactDto) {
    // Strip the honeypot off before persisting; class-validator already enforced
    // it must be empty so this is just hygiene.
    const { website, ...payload } = dto;
    void website;
    return this.contactModel.create(payload);
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.findOne(id);
    return this.contactModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.contactModel.findByIdAndDelete(id);
  }
}
