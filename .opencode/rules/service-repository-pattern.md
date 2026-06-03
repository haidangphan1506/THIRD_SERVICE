# Service / Repository Pattern

## When to use a repository

Use a dedicated repository class when DB queries involve:
- Complex filtering / search / pagination logic
- JOINs across multiple tables
- Reusable query patterns (e.g., `getByField`)
- The same query is called from multiple service methods

```ts
// features/category/category.repository.ts
@Injectable()
export class CategoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async getCategory({ field, value }: { field: string; value: string }) {
    return this.db.select().from(categories)
      .where(eq(categories[field as keyof typeof categories] as any, value));
  }
}
```

Features WITH repository: `category`, `wallet`, `transaction`
Features WITHOUT repository: `auth`, `user` (simple CRUD, queries kept in service)

## Direct DB in service

For simple features, inject `'DRIZZLE'` directly in the service:

```ts
@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}
}
```

## Dependency flow

```
Controller → Service → (optional Repository) → Drizzle ORM → PostgreSQL
```

- Controller handles HTTP (routes, validation, decorators)
- Service handles business logic and orchestration
- Repository handles raw DB queries
