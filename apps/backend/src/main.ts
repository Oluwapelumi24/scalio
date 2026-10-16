import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody is required to verify the Paystack webhook signature, which is
  // computed over the exact request bytes (see PaystackService.verifyWebhookSignature).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  // Content studio photos arrive as base64 JSON (up to ~5 MB); everything else stays small.
  app.useBodyParser('json', { limit: '6mb' });
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
