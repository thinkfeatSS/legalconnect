import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // Root healthcheck endpoints for hosting platform pings
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.get('/', (req, res) => res.json({ status: 'ok', message: 'LegalConnect API is running' }));
  httpAdapter.get('/health', (req, res) => res.json({ status: 'ok' }));

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`LegalConnect API running on port ${port}`);
}
bootstrap();
