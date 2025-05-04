// src/domains/auth/application/validators/authValidators.ts
import { z } from 'zod';

// Схема валідації реєстрації
const registrationSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Схема валідації запиту на скидання пароля
const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Схема валідації підтвердження скидання пароля
const resetPasswordConfirmSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Валідує дані реєстрації
 */
export function validateRegistration(data: any) {
  try {
    const result = registrationSchema.parse(data);
    return { success: true, value: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message,
        path: firstError.path.join('.'),
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Валідує запит на скидання пароля
 */
export function validateResetPasswordRequest(data: any) {
  try {
    const result = resetPasswordRequestSchema.parse(data);
    return { success: true, value: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message,
        path: firstError.path.join('.'),
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Валідує підтвердження скидання пароля
 */
export function validateResetPasswordConfirm(data: any) {
  try {
    const result = resetPasswordConfirmSchema.parse(data);
    return { success: true, value: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message,
        path: firstError.path.join('.'),
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}
