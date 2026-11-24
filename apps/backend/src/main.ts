import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { corsOriginsFromEnv } from './common/cors';
import { productionConfigProblems } from './common/production-config';

async function bootstrap() {
  // Shared-types must be built to JS before start:prod (see railway.json buildCommand).
  const problems = productionConfigProblems(process.env);
  if (problems.length) {
    throw new Error(`Refusing to start:\n- ${problems.join('\n- ')}`);
  }

  // rawBody is required to verify the Paystack webhook signature, which is
  // computed over the exact request bytes (see PaystackService.verifyWebhookSignature).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  // Railway terminates TLS at the proxy; trust one hop so req.ip is the client.
  app.set('trust proxy', 1);
  app.use(helmet());
  // Content studio photos arrive as base64 JSON (up to ~5 MB); everything else stays small.
  app.useBodyParser('json', { limit: '6mb' });
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.enableCors({
    origin: corsOriginsFromEnv(),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
