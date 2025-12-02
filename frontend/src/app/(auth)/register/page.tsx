import type { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Register | CancerVision360',
  description: 'Create your account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
