"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Sidebar nav items moved to layout for potential future use
  const settingsNavItems = [
    { title: 'Profile', href: '/dashboard/settings', icon: 'user' },
    { title: 'Password & Security', href: '/dashboard/settings', icon: 'lock' },
    { title: 'Notifications', href: '/dashboard/settings', icon: 'bell' },
    { title: 'Privacy & Data', href: '/dashboard/settings', icon: 'shield' },
    { title: 'Data Export', href: '/dashboard/settings', icon: 'database', roles: ['doctor', 'researcher'] },
    { title: 'Audit Logs', href: '/dashboard/settings', icon: 'file-text', roles: ['admin'] },
    { title: 'System Health', href: '/dashboard/settings', icon: 'bar-chart', roles: ['admin'] },
  ];

  const filteredItems = settingsNavItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="space-y-6">
      {/* Header - same as before */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Settings
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Manage your account preferences and security
        </p>
      </div>

      {/* Simplified content area - no sidebar, no grid */}
      <div className="max-w-6xl">
        {children}
      </div>
    </div>
  );
}
