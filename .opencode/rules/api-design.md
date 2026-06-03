# API Design Conventions

## Route naming

- Plural nouns for resources: `/users`, `/categories`, `/wallets`, `/transactions`
- Auth routes under `/auth`: `/auth/login`, `/auth/register`, `/auth/refresh`
- No version prefix in routes (no `/api/v1/`)
- Use `@Controller('name')` decorator for route prefix

## CRUD naming (controller methods)

| Action | HTTP | Method name convention |
|--------|------|----------------------|
| List | GET /resource | `get{Resources}Controller` or implicit |
| Get one | GET /resource/:id | `get{Resource}Controller` |
| Create | POST /resource | `create{Resource}Controller` |
| Update | PUT /resource/:id | `update{Resource}Controller` |
| Delete | DELETE /resource/:id | `delete{Resource}Controller` |

## CRUD naming (service methods)

- `{action}{Resource}Service` — e.g., `createCategoryService`, `getCategoriesService`
- Service methods accept a single DTO/params object, not individual args

## Response

- All responses through `ResponseInterceptor` (automatic)
- Message controlled by `@ApiResponse()` decorator on handler
- Paginated responses return `{ data, pagination: { total, page, limit, totalPages } }`

## HTTP status codes

Use `StatusCodes` from `http-status-codes` package:

```ts
import { StatusCodes } from 'http-status-codes';

@HttpCode(StatusCodes.OK)
@ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Created' })
```
