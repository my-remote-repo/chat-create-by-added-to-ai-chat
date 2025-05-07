// src/app/(auth)/reset-password/page.tsx
import ResetPasswordForm from '@/domains/auth/presentation/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <ResetPasswordForm />
    </div>
  );
}
