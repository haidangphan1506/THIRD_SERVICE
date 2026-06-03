# Create NestJS artifacts

Use this skill when creating a new service, controller, module, or provider.

## Module

```ts
import { Module } from '@nestjs/common';
import { FooController } from './foo.controller';
import { FooService } from './foo.service';

@Module({
  imports: [],
  controllers: [FooController],
  providers: [FooService],
  exports: [FooService],
})
export class FooModule {}
```

- Add to `src/app.module.ts` imports after creating.
- Use forwardRef for circular deps if needed.

## Controller

```ts
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse, Public, CurrentUser } from '@packages/decorators';
import { ZodValidationPipe } from '@packages/pipes';
import { FooService } from './foo.service';

@Controller('foos')
export class FooController {
  constructor(private readonly fooService: FooService) {}

  @Post()
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Foo created' })
  async createFoo(
    @Body(new ZodValidationPipe<CreateFooDto>(createFooSchema))
    dto: CreateFooDto,
  ) {
    return this.fooService.create(dto);
  }

  @Public()
  @Get()
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'List foos' })
  async listFoos() {
    return this.fooService.findAll();
  }
}
```

- Use `@Public()` to skip global JWT guard, omit for protected routes.
- Use `@CurrentUser()` to get `user.id` from JWT token.

## Service

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class FooService {
  constructor() {}

  async create(dto: CreateFooDto) {
    // business logic here
  }

  async findAll() {
    // business logic here
  }
}
```

- Inject `@Inject('DRIZZLE')` for DB access.
- Inject repositories for `category`, `wallet`, `transaction`.

## Custom provider

Registered in module's `providers` array. Common patterns:

```ts
// Value provider
{ provide: 'CONFIG', useValue: { key: 'value' } }

// Factory provider (async)
{
  provide: 'SOME_SERVICE',
  useFactory: () => { ... },
}
```

## Importing modules

```ts
// From another feature:
import { RedisModule } from 'src/features/redis/redis.module';

// From shared packages:
import { ZodValidationPipe } from '@packages/pipes';
```
