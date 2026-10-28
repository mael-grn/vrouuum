import { zValidator as honoZodValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { ZodType } from 'zod';

export const validate = <
  T extends ZodType,
  Target extends keyof ValidationTargets
>(
  target: Target,
  schema: T
) => {
  return honoZodValidator(target, schema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  });
};
