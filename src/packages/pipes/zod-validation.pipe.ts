import { Injectable, UnprocessableEntityException, type PipeTransform } from '@nestjs/common';
import { StatusCodes } from 'http-status-codes';
import { type ZodIssue, type ZodType } from 'zod';

export type ZodValidationErrorItem = {
  field: string;
  message: string;
  code: ZodIssue['code'];
};

@Injectable()
export class ZodValidationPipe<TOutput = unknown> implements PipeTransform<unknown, TOutput> {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: unknown): TOutput {
    const normalizedValue = this.parseJsonString(value);
    const result = this.schema.safeParse(normalizedValue);

    if (!result.success) {
      console.log("result.error.issues: ", result.error.issues);
      const errors = this.firstErrorPerField(result.error.issues);

      throw new UnprocessableEntityException({
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        message: 'Validation failed',
        errors,
      });
    }

    return result.data;
  }

  private issuePathToField(path: ZodIssue['path']): string {
    if (path.length === 0) {
      return '';
    }
    return path.map(String).join('.');
  }

  /** One entry per `field`: keeps the first Zod issue for that path (order preserved). */
  private firstErrorPerField(issues: ZodIssue[]): ZodValidationErrorItem[] {
    const seen = new Set<string>();
    const out: ZodValidationErrorItem[] = [];
    for (const issue of issues) {
      const field = this.issuePathToField(issue.path);
      if (seen.has(field)) continue;
      seen.add(field);
      out.push({
        field,
        message: issue.message,
        code: issue.code,
      });
    }
    
    return out;
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
