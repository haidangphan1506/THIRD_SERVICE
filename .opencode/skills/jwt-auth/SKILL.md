---
name: jwt-auth
description: Use when implementing authentication flows, working with JWT tokens, guards, or auth-related features in the backends NestJS API.
---

# JWT Authentication

## Architecture

- **Global guard**: `JwtAuthGuard` applied via `APP_GUARD` in `AppModule`
- **Public routes**: `@Public()` decorator skips JWT verification
- **Token types**: Access token (`typ: 'access'`) + Refresh token (`typ: 'refresh'`)
- **Default TTL**: Access 3h, Refresh 7d (configurable via env)

## JWT Payloads

### Access token
```ts
type JwtAccessPayload = {
  sub: string;    // user id
  email: string;
  typ: 'access';
  role: 'STUDENT' | 'ADMIN' | 'TUTOR' | 'PARENT';
};
```

### Refresh token
```ts
type JwtRefreshPayload = {
  sub: string;    // user id
  email: string;
  typ: 'refresh';
};
```

## Signing tokens

Use helpers from `@packages/helpers`:
```ts
import { signAccessToken, signRefreshToken } from '@packages/helpers';

const accessToken = await signAccessToken(jwtService, payload, config);
const refreshToken = await signRefreshToken(jwtService, payload, config);
```

## Guard flow (`JwtAuthGuard`)

1. Check if route is `@Public()` → skip
2. Extract `Bearer` token from `Authorization` header
3. Verify with `JWT_ACCESS_SECRET` (fallback: `JWT_SECRET`, then hardcoded dev secret)
4. Validate payload shape (`typ === 'access'`)
5. Attach `{ id, email, typ, role }` to `request.user`

## CurrentUser decorator

```ts
@CurrentUser() user: Record<string, string>     // full payload
@CurrentUser('id') userId: string               // single field
```

## Refresh token flow

1. Client sends `POST /auth/refresh` with `{ refreshToken }`
2. Verify with refresh secret
3. Validate `typ === 'refresh'` and payload shape
4. Issue new access + refresh token pair

## Redis integration

- Access tokens optionally cached in Redis (prefix: `access_token_:{userId}`)
- Password reset tokens stored in Redis (prefix: `password_reset_`, TTL: 1h)
- Blacklisted tokens stored in Redis (prefix: `black_list_token_:{userId}`, TTL: 7d)

## Forgot/reset password

1. `POST /auth/forgot-password` — generates UUID, stores in Redis with 1h TTL
2. Sends email with link containing JTI token
3. `POST /auth/reset-password` — verifies token from Redis, updates password
4. Development mode: logs reset link to console instead of sending email
