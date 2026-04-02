import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import * as express from 'express';
import { AppModule } from './app.module';
import { auth } from './auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({ origin: frontendUrl, credentials: true });

  // Mount Better Auth handler before JSON body parsing
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/auth/{*any}', toNodeHandler(auth));

  // Re-enable body parsing for all other NestJS routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Lotus Gift API')
    .setDescription('Lotus Gift ecommerce API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Lotus Gift API running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  console.log(`Better Auth available at http://localhost:${port}/api/auth`);
}
bootstrap();
