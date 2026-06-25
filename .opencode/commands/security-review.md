---
description: Audit code for security vulnerabilities
agent: security-review
---

Run a security review on the codebase or specified files.

Follow the security-review agent checklist:
1. Auth & authorization — grep for @Public(), verify user-scoped data access
2. Input validation — every @Body/@Query uses ZodValidationPipe
3. Data exposure — no password leaks, minimal JWT payload
4. SQL injection — no unsanitized user input in sql`` templates
5. Hardcoded secrets — grep for secrets outside known dev fallback
6. Rate limiting — flag missing throttle on auth endpoints
7. Error handling — no stack leaks in responses

Report findings as 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🔵 LOW with file:line.
