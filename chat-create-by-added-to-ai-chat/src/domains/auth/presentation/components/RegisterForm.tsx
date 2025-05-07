// src/domains/auth/presentation/components/RegisterForm.tsx
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
const registerSchema = z
  .object({
    name: z.string().min(2, "Ім'я повинно містити не менше 2 символів"),
    email: z.string().email('Невірний формат email'),
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

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register: authRegister } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await authRegister(data.name, data.email, data.password, data.confirmPassword);

      if (result.success) {
        setSuccessMessage('Реєстрація успішна! Перевірте вашу електронну пошту для підтвердження.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setErrorMessage(result.error || 'Помилка при реєстрації. Спробуйте пізніше.');
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
        <h1 className="text-2xl font-bold mb-6 text-center">Реєстрація</h1>

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
            <label htmlFor="name" className="text-sm font-medium">
              Ім'я
            </label>
            <Input
              id="name"
              type="text"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

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
            Зареєструватися
          </Button>

          <p className="text-sm text-center mt-4">
            Вже маєте акаунт?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Увійти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
