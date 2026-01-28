import { z } from 'zod';

export * from './schemas';

/**
 * Helper to validate input using a Zod schema with structured error messages
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; 
  data: T 
} | { 
  success: false; 
  errors: Record<string, string> 
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return {
    success: false,
    errors,
  };
}
