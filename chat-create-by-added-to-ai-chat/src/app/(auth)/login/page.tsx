// src/app/(auth)/login/page.tsx
import LoginForm from '@/domains/auth/presentation/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <LoginForm />
    </div>
  );
}
