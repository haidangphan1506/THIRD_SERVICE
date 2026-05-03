import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

import { type ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<TOutput = unknown> implements PipeTransform<unknown, TOutput> {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: unknown): TOutput {
    const normalizedValue = this.parseJsonString(value);
    const result = this.schema.safeParse(normalizedValue);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        issues: result.error.issues,
      });
    }

    return result.data;
  }

  private parseJsonString(value: unknown): unknown {
    if (typeof value !== 'string') return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
