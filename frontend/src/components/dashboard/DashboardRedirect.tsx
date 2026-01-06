"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Role-based dashboard routing
    const dashboardMap: Record<string, string> = {
      admin: '/dashboard/admin',
      doctor: '/dashboard/doctor',
      researcher: '/dashboard/researcher',
    };

    const targetDashboard = dashboardMap[user.role] || '/dashboard/admin';
    router.replace(targetDashboard);
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );
}