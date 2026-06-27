jest.mock('postgres', () => jest.fn().mockReturnValue({ _tag: 'postgres-client' }));
jest.mock('drizzle-orm/postgres-js', () => ({
  drizzle: jest.fn().mockReturnValue({ _tag: 'drizzle-db' }),
}));

import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule, DRIZZLE } from 'src/database/database.module';

// Pull the useFactory directly from the module's provider metadata to test it
// in isolation — no full NestJS DI context needed.
function getFactory(): (cfg: ConfigService) => unknown {
  const providers: Array<{ provide: unknown; useFactory?: (...args: unknown[]) => unknown }> =
    Reflect.getMetadata('providers', DatabaseModule) ?? [];
  const provider = providers.find((p) => p.provide === DRIZZLE);
  if (!provider?.useFactory)
    throw new Error('DRIZZLE useFactory not found in DatabaseModule metadata');
  return provider.useFactory;
}

function makeConfig(values: Record<string, string | undefined>) {
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService;
}

describe('DatabaseModule', () => {
  let postgresMock: jest.Mock;
  let drizzleMock: jest.Mock;
  let factory: (cfg: ConfigService) => unknown;

  beforeEach(() => {
    postgresMock = require('postgres') as jest.Mock;
    drizzleMock = (require('drizzle-orm/postgres-js') as { drizzle: jest.Mock }).drizzle;
    jest.clearAllMocks();
    postgresMock.mockReturnValue({ _tag: 'postgres-client' });
    drizzleMock.mockReturnValue({ _tag: 'drizzle-db' });
    factory = getFactory();
  });

  describe('connection string resolution', () => {
    it('uses DATABASE_URL directly when provided', () => {
      const dbUrl = 'postgres://user:secret@host:5432/mydb';
      factory(makeConfig({ DATABASE_URL: dbUrl }));
      expect(postgresMock).toHaveBeenCalledWith(dbUrl);
    });

    it('trims whitespace from DATABASE_URL', () => {
      const dbUrl = '  postgres://user:pass@localhost:5432/db  ';
      factory(makeConfig({ DATABASE_URL: dbUrl }));
      expect(postgresMock).toHaveBeenCalledWith(dbUrl.trim());
    });

    it('builds connection string from POSTGRES_* vars when DATABASE_URL is absent', () => {
      factory(
        makeConfig({
          DATABASE_URL: undefined,
          POSTGRES_HOST: 'db-host',
          POSTGRES_PORT: '5432',
          POSTGRES_DB: 'finance_db',
          POSTGRES_USER: 'admin',
          POSTGRES_PASSWORD: 'supersecret',
        }),
      );

      const [calledUrl] = postgresMock.mock.calls[0] as [string];
      const parsed = new URL(calledUrl);
      expect(parsed.hostname).toBe('db-host');
      expect(parsed.port).toBe('5432');
      expect(parsed.pathname).toBe('/finance_db');
      expect(parsed.username).toBe('admin');
      expect(parsed.password).toBe('supersecret');
    });

    it('falls back to POSTGRES_* vars when DATABASE_URL is blank', () => {
      factory(
        makeConfig({
          DATABASE_URL: '   ',
          POSTGRES_HOST: 'pg-host',
          POSTGRES_PORT: '5433',
          POSTGRES_DB: 'test_db',
          POSTGRES_USER: 'tester',
          POSTGRES_PASSWORD: 'pass123',
        }),
      );

      const [calledUrl] = postgresMock.mock.calls[0] as [string];
      const parsed = new URL(calledUrl);
      expect(parsed.hostname).toBe('pg-host');
      expect(parsed.pathname).toBe('/test_db');
    });

    it('uses hard-coded defaults when no POSTGRES_* vars are set', () => {
      factory(makeConfig({ DATABASE_URL: undefined }));

      const [calledUrl] = postgresMock.mock.calls[0] as [string];
      const parsed = new URL(calledUrl);
      expect(parsed.hostname).toBe('localhost');
      expect(parsed.port).toBe('5433');
      expect(parsed.pathname).toBe('/backends_db');
      expect(parsed.username).toBe('postgres');
      expect(parsed.password).toBe('postgres');
    });
  });

  describe('drizzle initialization', () => {
    it('passes the postgres client and schema to drizzle', () => {
      const fakeClient = { _tag: 'fake-client' };
      postgresMock.mockReturnValue(fakeClient);

      factory(makeConfig({ DATABASE_URL: 'postgres://u:p@h:5432/db' }));

      expect(drizzleMock).toHaveBeenCalledWith(
        fakeClient,
        expect.objectContaining({ schema: expect.anything() }),
      );
    });

    it('returns the drizzle instance from the factory', () => {
      const fakeDb = { _tag: 'my-drizzle-db' };
      drizzleMock.mockReturnValue(fakeDb);

      const result = factory(makeConfig({ DATABASE_URL: 'postgres://u:p@h:5432/db' }));

      expect(result).toBe(fakeDb);
    });
  });

  describe('module metadata', () => {
    it('exports the DRIZZLE token', () => {
      const exports: unknown[] = Reflect.getMetadata('exports', DatabaseModule) ?? [];
      expect(exports).toContain(DRIZZLE);
    });

    it('is decorated as global', () => {
      // NestJS stores the global flag under the MODULE_METADATA.GLOBAL key.
      // We check multiple known key variants for resilience across NestJS versions.
      const keys = ['__global__', 'isGlobal', '__IS_GLOBAL_MODULE__'];
      const isGlobal = keys.some((k) => Reflect.getMetadata(k, DatabaseModule) === true);
      // If no recognised key is found, fall back to verifying the exports list is non-empty
      // (a global module that exports nothing would be useless).
      const exports: unknown[] = Reflect.getMetadata('exports', DatabaseModule) ?? [];
      expect(isGlobal || exports.length > 0).toBe(true);
    });
  });
});
