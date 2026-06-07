import { UnprocessableEntityException } from '@nestjs/common';
import { ZodValidationErrorItem, ZodValidationPipe } from '@packages/pipes';
import z from 'zod';

let pipe: ZodValidationPipe;
describe('Zod validation pipes ...', () => {
  beforeEach(() => {
    const schemas = z.object({
      email: z
        .string({
          message: 'Email must be string.',
        })
        .email({
          message: 'Email must be trust format ...',
        }),

      password: z
        .string({
          message: 'Password must be string.',
        })
        .min(6, {
          message: 'Password must be 6 character ...',
        })
        .max(15, {
          message: 'Password must not exceed 15 characters.',
        })
        .regex(/[A-Z]/, {
          message: 'Password must contain at least one uppercase letter.',
        })
        .regex(/[a-z]/, {
          message: 'Password must contain at least one lowercase letter.',
        })
        .regex(/[0-9]/, {
          message: 'Password must contain at least one number.',
        })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, {
          message: 'Password must contain at least one special character.',
        }),
    });
    pipe = new ZodValidationPipe(schemas);
  });
  describe('transform ...', () => {
    test('transform return data when success ...', () => {
      const payload = {
        email: 'dang04223@gmail.com',
        password: '12345678@Aa',
      };

      const result = pipe.transform(payload);

      expect(result).toEqual(payload);
    });

    test('2.transform return error when catch err ...', () => {
      const payload = {
        email: 'dang04223@gmail.com',
        password: '123',
      };

      let thrownError: UnprocessableEntityException | undefined;
      try {
        pipe.transform(payload);
      } catch (err) {
        thrownError = err as UnprocessableEntityException;
      }

      expect(thrownError).toBeInstanceOf(UnprocessableEntityException);
      expect(thrownError?.getStatus()).toBe(422);

      const body = thrownError?.getResponse() as {
        statusCode: number;
        message: string;
        errors: ZodValidationErrorItem[];
      };
      expect(body.statusCode).toBe(422);
      expect(body.message).toBe('Validation failed');
      expect(body.errors).toEqual([
        {
          field: 'password',
          message: 'Password must be 6 character ...',
          code: 'too_small',
        },
      ]);
    });

    test('3. should be return all error when validate failed in more field ...', () => {
      const payload = {
        email: 'dang04223',
        password: '1234',
      };

      let throwError: UnprocessableEntityException | undefined;
      try {
        pipe.transform(payload);
      } catch (err) {
        throwError = err as UnprocessableEntityException;
      }

      expect(throwError).toBeInstanceOf(UnprocessableEntityException);
      const result = throwError?.getResponse() as {
        statusCode: number;
        message: string;
        errors: ZodValidationErrorItem[];
      };

      expect(result.statusCode).toBe(422);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toEqual([
        {
          field: 'email',
          message: 'Email must be trust format ...',
          code: 'invalid_format',
        },
        {
          field: 'password',
          message: 'Password must be 6 character ...',
          code: 'too_small',
        },
      ]);
    });

    test('4. should map nested field path with dot notation ...', () => {
      const nestedSchema = z.object({
        address: z.object({
          city: z.string({ message: 'City must be a string.' }),
        }),
      });
      const nestedPipe = new ZodValidationPipe(nestedSchema);

      let thrownError: UnprocessableEntityException | undefined;
      try {
        nestedPipe.transform({ address: { city: 123 } });
      } catch (err) {
        thrownError = err as UnprocessableEntityException;
      }

      expect(thrownError).toBeInstanceOf(UnprocessableEntityException);
      const body = thrownError?.getResponse() as {
        statusCode: number;
        message: string;
        errors: ZodValidationErrorItem[];
      };
      expect(body.errors).toEqual([
        {
          field: 'address.city',
          message: 'City must be a string.',
          code: 'invalid_type',
        },
      ]);
    });

    test('5. should be return first error only field ...', () => {
      const payload = {
        email: 'dang04223',
        password: '1234',
      };

      let throwError: UnprocessableEntityException | undefined;
      try {
        pipe.transform(payload);
      } catch (err) {
        throwError = err as UnprocessableEntityException;
      }

      expect(throwError).toBeInstanceOf(UnprocessableEntityException);
      const result = throwError?.getResponse() as {
        statusCode: number;
        message: string;
        errors: ZodValidationErrorItem[];
      };

      expect(result.statusCode).toBe(422);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toEqual([
        {
          field: 'email',
          message: 'Email must be trust format ...',
          code: 'invalid_format',
        },
        {
          field: 'password',
          message: 'Password must be 6 character ...',
          code: 'too_small',
        },
      ]);
    });
    test('6. should map empty path to empty string for top-level refine error ...', () => {
      const schemaWithRefine = z
        .object({
          value: z.number(),
        })
        .refine(() => false, { message: 'Top-level schema error.' });
      const refinePipe = new ZodValidationPipe(schemaWithRefine);

      let thrownError: UnprocessableEntityException | undefined;
      try {
        refinePipe.transform({ value: 1 });
      } catch (err) {
        thrownError = err as UnprocessableEntityException;
      }

      expect(thrownError).toBeInstanceOf(UnprocessableEntityException);
      const body = thrownError?.getResponse() as {
        statusCode: number;
        message: string;
        errors: ZodValidationErrorItem[];
      };
      expect(body.errors).toEqual([
        {
          field: '',
          message: 'Top-level schema error.',
          code: 'custom',
        },
      ]);
    });
  });

  describe('parse Json String ...', () => {
    test('7. should parse valid JSON string and validate successfully ...', () => {
      const payload = { email: 'dang04223@gmail.com', password: '12345678@Aa' };
      const jsonString = JSON.stringify(payload);

      const result = pipe.transform(jsonString);

      expect(result).toEqual(payload);
    });

    test('8. should return original value when JSON.parse throws ...', () => {
      const invalidJson = '{not-valid-json}';

      let thrownError: UnprocessableEntityException | undefined;
      try {
        pipe.transform(invalidJson);
      } catch (err) {
        thrownError = err as UnprocessableEntityException;
      }

      expect(thrownError).toBeInstanceOf(UnprocessableEntityException);
    });
  });
});
