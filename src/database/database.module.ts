import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL')?.trim();

        const connectionString =
          databaseUrl && databaseUrl.length > 0
            ? databaseUrl
            : (() => {
                const host = configService.get<string>('POSTGRES_HOST')?.trim() || 'localhost';
                const port = configService.get<string>('POSTGRES_PORT')?.trim() || '5433';
                const db = configService.get<string>('POSTGRES_DB')?.trim() || 'backends_db';
                const user = configService.get<string>('POSTGRES_USER')?.trim() || 'postgres';
                const password =
                  configService.get<string>('POSTGRES_PASSWORD')?.trim() || 'postgres';

                const url = new URL(`postgres://${host}:${port}/${db}`);
                url.username = user;
                url.password = password;
                return url.toString();
              })();

        const client = postgres(connectionString);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
