// src/domains/auth/presentation/components/ResetPasswordForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '../providers/AuthProvider';
import { Spinner } from '@/shared/components/ui/spinner';

// Схема валідації
const resetPasswordSchema = z.object({
  email: z.string().email('Невірний формат email'),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await resetPassword(data.email);

      if (result.success) {
        setSuccessMessage('Інструкції для відновлення пароля надіслано на вашу електронну пошту');
      } else {
        setErrorMessage(result.error || 'Помилка при запиті на відновлення пароля');
      }
    } catch (error) {
      setErrorMessage('Сталася помилка. Спробуйте пізніше.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Відновлення пароля</h1>

        {errorMessage && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2" /> : null}
            Відновити пароль
          </Button>

          <p className="text-sm text-center mt-4">
            <Link href="/login" className="text-primary hover:underline">
              Повернутись до входу
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
