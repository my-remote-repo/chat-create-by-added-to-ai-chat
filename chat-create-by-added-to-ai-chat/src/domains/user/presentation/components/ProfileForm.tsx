// src/domains/user/presentation/components/ProfileForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { useUser } from '../hooks/useUser';
import { useState } from 'react';
import { Spinner } from '@/shared/components/ui/spinner';

// Схема валідації
const profileSchema = z.object({
  name: z.string().min(2, "Ім'я повинно містити не менше 2 символів"),
  bio: z.string().max(500, 'Біографія не повинна перевищувати 500 символів').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { profile, updateProfile } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      bio: profile?.bio || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await updateProfile(data.name, data.bio);
      if (result) {
        setSuccessMessage('Профіль успішно оновлено');
      } else {
        setErrorMessage('Не вдалося оновити профіль');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrorMessage('Сталася помилка при оновленні профілю');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">{errorMessage}</div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{successMessage}</div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Ім'я
        </label>
        <Input
          id="name"
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium">
          Біографія
        </label>
        <Textarea
          id="bio"
          {...register('bio')}
          className={errors.bio ? 'border-destructive' : ''}
          rows={4}
          placeholder="Розкажіть про себе..."
        />
        {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="mr-2" /> : null}
          Зберегти зміни
        </Button>
      </div>
    </form>
  );
}
