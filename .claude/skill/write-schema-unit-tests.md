---
name: write-schema-unit-tests
description: Create or update Zod schema unit tests for entity packages following the project's established spec patterns. Use this skill whenever the user asks to write, add, or update unit tests for a schema, DTO, or entity in src/packages/entities/.
---

# Write Schema Unit Tests

Use this skill to create or update `*.spec.ts` files in `test/packages/entities/{domain}/` that test Zod validation schemas from `src/packages/entities/{domain}/`.

## File location

```
test/packages/entities/{domain}/{domain}.schema.spec.ts   ← schema tests
test/packages/entities/{domain}/{domain}.dto.spec.ts      ← DTO / update-schema tests (if needed)
```

## Two TC patterns in use — pick the right one

### Pattern A — field-value loop (wallet, user style)

Best when the schema has many fields each needing their own invalid-type / boundary cases.

```ts
type TC<T = unknown> = { case: string; value: T; isValid: boolean; message: string | null };

describe('fieldName ...', () => {
  test.each<TC>([
    { value: undefined, case: 'missing',       isValid: false, message: 'Field is required' },
    { value: null,      case: 'null',           isValid: false, message: 'Field must be a string' },
    { value: 123,       case: 'number',         isValid: false, message: 'Field must be a string' },
    { value: '',        case: 'empty string',   isValid: false, message: 'Field is required' },
    { value: 'ok',      case: 'valid string',   isValid: true,  message: null },
  ])('$case => $message', ({ value, message, isValid }) => {
    const result = schema.safeParse({ ...baseValidation, fieldName: value });
    expect(result.success).toBe(isValid);
    if (!isValid) {
      expect(result.error?.issues.map((i) => i.message)).toContain(message);
    }
  });
});
```

### Pattern B — label / input / msg loop (auth, category style)

Best when testing entire payloads (e.g., `registerSchema`) and the error-message constants live in a `*_MESSAGES` object.

```ts
type TC = { label: string; input: Record<string, unknown>; msg: string };

test.each<TC>([
  { label: 'missing email', input: { ...validPayload, email: undefined }, msg: MESSAGES.EMAIL_REQUIRED },
  { label: 'invalid email', input: { ...validPayload, email: 'bad' },     msg: MESSAGES.EMAIL_INVALID },
])('$label → $msg', ({ input, msg }) => {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  const messages = result.error?.issues.map((i) => i.message);
  expect(messages).toContain(msg);
});
```

Use Pattern B when a `*_MESSAGES` constant object is exported from the entity (e.g. `AUTH_MESSAGES`). Otherwise use Pattern A.

## Checklist for each schema

For every schema being tested, cover:

1. **Valid full payload passes** — always include a `test('valid payload passes')` at the end of the `describe` block.
2. **Required fields** — test `undefined` (missing), and for strings also test empty string `''`.
3. **Wrong types** — test `null`, `number`, `boolean` as appropriate to what the schema rejects.
4. **Boundary values** — `min`, `max`, string length limits, numeric range limits.
5. **Enum fields** — test every valid value passes; test an unknown string fails; test lowercase variants fail if the enum is uppercase-only.
6. **Default values** — for fields with `.default(x)`, add an `it('defaults to X when omitted')` that omits the field via `Object.fromEntries(Object.entries(base).filter(([k]) => k !== 'field'))`.
7. **Coercion quirks** — for `z.coerce.number()`, note in a comment that `null`→0 and `true`→1 both pass `min(0)`, so they count as valid.
8. **Refinements** — password complexity, UUID format, `superRefine` / cross-field checks (e.g. `confirmPassword` must match `password`).
9. **Path-specific errors** — when a schema has multiple fields that can emit the same message, find the issue by path:
   ```ts
   const issue = result.error.issues.find((i) => i.path[0] === 'fieldName');
   expect(issue?.message).toBe(msg);
   ```

## Import style

```ts
// Prefer the barrel when available:
import { createFooSchema, FOO_MESSAGES } from '@packages/entities/foo';

// Fall back to the file directly if the barrel doesn't re-export it:
import { createFooSchema } from '@packages/entities/foo/foo.schema';
```

## Section dividers

Use ASCII dividers to separate `describe` blocks visually (mirrors existing tests):

```ts
// ─── fieldName ────────────────────────────────────────────────────────────────
describe('fieldName ...', () => { ... });
```

## Template — full skeleton

```ts
import { createFooSchema } from '@packages/entities/foo';

describe('createFooSchema', () => {
  const baseValidation = {
    // all required fields with valid values
  };

  type TC<T = unknown> = { case: string; value: T; isValid: boolean; message: string | null };

  // ─── fieldA ───────────────────────────────────────────────────────────────────
  describe('fieldA ...', () => {
    test.each<TC>([
      { value: undefined, case: 'missing',     isValid: false, message: 'FieldA is required' },
      { value: null,      case: 'null',         isValid: false, message: 'FieldA must be a string' },
      { value: 'valid',   case: 'valid string', isValid: true,  message: null },
    ])('$case => $message', ({ value, message, isValid }) => {
      const result = createFooSchema.safeParse({ ...baseValidation, fieldA: value });
      expect(result.success).toBe(isValid);
      if (!isValid) {
        expect(result.error?.issues.map((i) => i.message)).toContain(message);
      }
    });

    it('defaults to "bar" when omitted', () => {
      const input = Object.fromEntries(Object.entries(baseValidation).filter(([k]) => k !== 'fieldA'));
      const result = createFooSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.fieldA).toBe('bar');
    });
  });

  // ─── full valid payload ───────────────────────────────────────────────────────
  it('accepts a fully valid payload', () => {
    const result = createFooSchema.safeParse(baseValidation);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ /* key assertions */ });
    }
  });
});
```

## Workflow

1. Read the target schema file (`src/packages/entities/{domain}/{domain}.schema.ts`) to learn every field, its type, constraints, defaults, and custom error messages.
2. Read the domain's `index.ts` barrel to know what names are exported.
3. Check if a `*_MESSAGES` constant object is exported — if yes, use Pattern B; otherwise Pattern A.
4. Check whether a spec file already exists at `test/packages/entities/{domain}/`. If it does, update it rather than replacing it wholesale — add missing `describe` blocks and cases.
5. Write or update the spec file following the patterns above.
6. Run `bun run test -- --testPathPattern="{domain}"` to verify all tests pass before reporting done. Fix any failures before finishing.
