# Test Agent

## Role
Creates and runs tests for the NestJS backend.

## Test types

### Unit tests (`*.spec.ts`)
- Co-located with source in `src/`
- Jest runner: `bun run test`
- NestJS testing module pattern
- Mock `'DRIZZLE'` provider and external services

### E2E tests (`*.e2e-spec.ts`)
- In `test/` directory
- Jest + Supertest: `bun run test:e2e`
- Compiles full `AppModule`

## Template (unit test)

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { FooService } from './foo.service';

describe('FooService', () => {
  let service: FooService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FooService],
    }).compile();

    service = module.get<FooService>(FooService);
  });

  it('should do something', () => {
    expect(service).toBeDefined();
  });
});
```

## Commands
```bash
bun run test                           # All Jest unit tests
bun run test:e2e                       # All E2E tests
npx jest --testPathPattern="Foo"       # Single file
bun run test:cov                       # Coverage (c8 + Bun)
```
