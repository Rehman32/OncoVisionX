import type { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login | OncoVisionX',
  description: 'Login to your account',
};

export default function LoginPage() {
  return <LoginForm />;
}
