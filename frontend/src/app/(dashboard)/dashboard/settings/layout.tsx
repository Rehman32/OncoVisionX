"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  User,
  Lock,
  Bell,
  Shield,
  Database,
  LogOut,
  FileText,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('admin' | 'doctor' | 'researcher')[];
}

const settingsNavItems: SettingsNavItem[] = [
  {
    title: 'Profile',
    href: '/dashboard/settings/profile',
    icon: User,
  },
  {
    title: 'Password & Security',
    href: '/dashboard/settings/security',
    icon: Lock,
  },
  {
    title: 'Notifications',
    href: '/dashboard/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Privacy & Data',
    href: '/dashboard/settings/privacy',
    icon: Shield,
  },
  {
    title: 'Data Export',
    href: '/dashboard/settings/data-export',
    icon: Database,
    roles: ['doctor', 'researcher'],
  },
  {
    title: 'Audit Logs',
    href: '/dashboard/settings/audit-logs',
    icon: FileText,
    roles: ['admin'],
  },
  {
    title: 'System Health',
    href: '/dashboard/settings/system',
    icon: BarChart3,
    roles: ['admin'],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredItems = settingsNavItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Settings
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Manage your account preferences and security
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      isActive &&
                        'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}