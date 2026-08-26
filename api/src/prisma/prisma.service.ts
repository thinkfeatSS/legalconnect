import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    let rawUrl = (process.env.DATABASE_URL || '').trim();
    // Remove wrapping quotes if entered like "mysql://..." in hosting environment variables
    if ((rawUrl.startsWith('"') && rawUrl.endsWith('"')) || (rawUrl.startsWith("'") && rawUrl.endsWith("'"))) {
      rawUrl = rawUrl.slice(1, -1).trim();
    }

    // Default fallback if DATABASE_URL is missing or malformed on Hostinger
    let dbUrl = rawUrl;
    if (!dbUrl) {
      dbUrl = 'mysql://u897031851_farhan:Mastsanai110@148.222.53.12:3306/u897031851_legalconnect';
    } else if (!dbUrl.includes('://')) {
      dbUrl = `mysql://${dbUrl}`;
    }

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }

  async onModuleInit() {
    // Non-blocking connect so app.listen() starts immediately (< 1 sec) on Hostinger
    this.$connect()
      .then(() => {
        this.logger.log('✓ Successfully connected to database');
      })
      .catch((error) => {
        this.logger.error(`✗ Database connection error: ${error.message}`);
      });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

