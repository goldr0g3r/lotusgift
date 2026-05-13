import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactInquiry, ContactInquirySchema } from '../schemas';

@Module({
  imports: [MongooseModule.forFeature([{ name: ContactInquiry.name, schema: ContactInquirySchema }])],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
