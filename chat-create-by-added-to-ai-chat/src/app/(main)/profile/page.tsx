// src/app/(main)/profile/page.tsx
'use client';

import { AvatarUploader } from '@/domains/user/presentation/components/AvatarUploader';
import { ProfileForm } from '@/domains/user/presentation/components/ProfileForm';
import { UserStatusSelector } from '@/domains/user/presentation/components/UserStatusSelector';
import { useUser } from '@/domains/user/presentation/hooks/useUser';
import { Spinner } from '@/shared/components/ui/spinner';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

export default function ProfilePage() {
  const { profile, loading, error } = useUser();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-destructive/10 text-destructive p-3 rounded-md">{error}</div>;
  }

  if (!profile || !user) {
    return (
      <div className="text-center p-4">
        <p>Не вдалося завантажити профіль. Будь ласка, спробуйте пізніше.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-8">Профіль користувача</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="space-y-6">
            <AvatarUploader />
            <UserStatusSelector />

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email:</p>
              <p>{profile.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Дата реєстрації:</p>
              <p>{new Date(profile.createdAt).toLocaleDateString('uk-UA')}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Інформація профілю</h2>
              <ProfileForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
