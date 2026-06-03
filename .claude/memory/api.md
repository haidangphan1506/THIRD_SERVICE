# API

Base: `http://localhost:8888`

## Auth

All routes at `/`.

| Endpoint                     | Auth   | Body                                           |
| ---------------------------- | ------ | ---------------------------------------------- |
| `POST /auth/register`        | Public | email, username, firstName, lastName, password |
| `POST /auth/login`           | Public | email, password                                |
| `POST /auth/refresh`         | Public | refreshToken                                   |
| `POST /auth/forgot-password` | JWT    | email                                          |
| `POST /auth/reset-password`  | JWT    | token, newPassword                             |

- Access token TTL: default 3h (10800s)
- Refresh token TTL: default 7d (604800s)

## Response format

All responses wrapped by `ResponseInterceptor`:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "method": "POST",
  "path": "/api/auth/login"
}
```

All error wrapper by `ErrorInterceptor` and `Error Filter`

```json
{
  "success": false,
  "statusCode": "422|400|500|...",
  "message"
  "errors" : "errors.errors",
  "path": "request.url",
 "trace": "exception.stack",
  "timestamp": "new Date().toISOString()",
}

## Auth decorators

- `@Public()` — skip JWT guard on handler
- `@CurrentUser()` — inject current user from JWT payload
- `@ApiResponse({ statusCode, message })` — set response message
```
