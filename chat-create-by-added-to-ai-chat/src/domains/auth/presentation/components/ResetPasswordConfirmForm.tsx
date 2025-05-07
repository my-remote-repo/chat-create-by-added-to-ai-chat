// src/domains/auth/presentation/components/ResetPasswordConfirmForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/shared/components/ui/spinner';

// Схема валідації
const resetPasswordConfirmSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Пароль повинен містити не менше 8 символів')
      .regex(/[A-Z]/, 'Пароль повинен містити хоча б одну велику літеру')
      .regex(/[a-z]/, 'Пароль повинен містити хоча б одну малу літеру')
      .regex(/[0-9]/, 'Пароль повинен містити хоча б одну цифру'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });

type ResetPasswordConfirmFormValues = z.infer<typeof resetPasswordConfirmSchema>;

interface ResetPasswordConfirmFormProps {
  token: string;
}

export default function ResetPasswordConfirmForm({ token }: ResetPasswordConfirmFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { resetPasswordConfirm } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordConfirmFormValues>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordConfirmFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await resetPasswordConfirm(token, data.password, data.confirmPassword);

      if (result.success) {
        setSuccessMessage('Пароль успішно змінено');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setErrorMessage(result.error || 'Помилка при зміні пароля');
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
        <h1 className="text-2xl font-bold mb-6 text-center">Встановлення нового пароля</h1>

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
            <label htmlFor="password" className="text-sm font-medium">
              Новий пароль
            </label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Підтвердження пароля
            </label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2" /> : null}
            Встановити новий пароль
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
