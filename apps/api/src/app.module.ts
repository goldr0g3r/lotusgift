import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ClientsModule } from './clients/clients.module';
import { QuotesModule } from './quotes/quotes.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { ContactsModule } from './contacts/contacts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { BannersModule } from './banners/banners.module';
import { SettingsModule } from './settings/settings.module';
import { PaymentsModule } from './payments/payments.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EmailModule,
    AuthModule,
    ProductsModule,
    ClientsModule,
    QuotesModule,
    CategoriesModule,
    OrdersModule,
    ContactsModule,
    DashboardModule,
    TestimonialsModule,
    BannersModule,
    SettingsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
