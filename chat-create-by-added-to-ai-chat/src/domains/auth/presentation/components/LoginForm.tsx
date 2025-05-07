// src/domains/auth/presentation/components/LoginForm.tsx
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
const loginSchema = z.object({
  email: z.string().email('Невірний формат email'),
  password: z.string().min(1, "Пароль обов'язковий"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        router.push('/chat');
      } else {
        setErrorMessage(result.error || 'Невірний email або пароль');
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
        <h1 className="text-2xl font-bold mb-6 text-center">Вхід в систему</h1>

        {errorMessage && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {errorMessage}
          </div>
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

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Пароль
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

          <div className="flex justify-end">
            <Link href="/reset-password" className="text-sm text-primary hover:underline">
              Забули пароль?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2" /> : null}
            Увійти
          </Button>

          <p className="text-sm text-center mt-4">
            Немає акаунту?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Зареєструватися
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
