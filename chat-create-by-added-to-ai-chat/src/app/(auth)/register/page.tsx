// src/app/(auth)/register/page.tsx
import RegisterForm from '@/domains/auth/presentation/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <RegisterForm />
    </div>
  );
}
