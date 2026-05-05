import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().default(3001),

        // Required: silent fallbacks would mask deployment misconfiguration.
        MONGODB_URI: Joi.string()
          .uri({ scheme: ['mongodb', 'mongodb+srv'] })
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.required(),
            otherwise: Joi.string().default('mongodb://localhost:27017/lotusgift'),
          }),
        BETTER_AUTH_SECRET: Joi.string()
          .min(16)
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.required(),
            otherwise: Joi.string().default('dev-secret-change-me-please'),
          }),
        BETTER_AUTH_URL: Joi.string()
          .uri()
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.required(),
            otherwise: Joi.string().default('http://localhost:3001'),
          }),
        FRONTEND_URL: Joi.string()
          .uri()
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.required(),
            otherwise: Joi.string().default('http://localhost:3000'),
          }),
        FRONTEND_URLS: Joi.string().optional(),

        // Optional integrations: validated only when present so dev still boots.
        RAZORPAY_KEY_ID: Joi.string().optional(),
        RAZORPAY_KEY_SECRET: Joi.string().optional(),
        RAZORPAY_WEBHOOK_SECRET: Joi.string().optional(),
        SMTP_HOST: Joi.string().optional(),
        SMTP_PORT: Joi.number().optional(),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASS: Joi.string().optional(),
        MAIL_FROM: Joi.string().optional(),
      }),
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    ThrottlerModule.forRoot([
      // Default bucket: 60 req/min per IP for any authenticated/public route.
      { name: 'default', ttl: 60_000, limit: 60 },
      // Tight bucket reserved for high-abuse-risk public endpoints
      // (e.g. contacts form, newsletter). Apply with @Throttle({ public: ... }).
      { name: 'public', ttl: 60_000, limit: 5 },
    ]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI', 'mongodb://localhost:27017/lotusgift'),
      }),
    }),
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
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
