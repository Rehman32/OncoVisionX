"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Activity,
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  UserCog,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('admin' | 'doctor' | 'researcher')[];
  badge?: string;
  isNew?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Patients',
    href: '/dashboard/patients',
    icon: Users,
    roles: ['admin', 'doctor'],
  },
  {
    title: 'Predictions',
    href: '/dashboard/predictions',
    icon: FileText,
    badge: '7',
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['admin', 'researcher'],
    isNew: true,
  },
  {
    title: 'User Management',
    href: '/dashboard/admin/users',
    icon: UserCog,
    roles: ['admin'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950 relative">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/50 dark:to-slate-900/30 pointer-events-none"></div>

      {/* Logo Section */}
      <div className="relative flex h-20 items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 group transition-all duration-300"
        >
          <div className="relative">
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-blue-500/30 blur-2xl group-hover:bg-blue-500/40 transition-all duration-500 animate-pulse"></div>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 dark:text-slate-50 tracking-tight leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              OncoVisionX
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase mt-1.5 leading-none">
              Medical AI Platform
            </span>
          </div>
        </Link>
      </div>

      {/* AI Assistant Callout */}
      <div className="relative mx-4 mt-6 mb-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-[1px]">
          <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/20 dark:bg-blue-400/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                  AI Assistant Ready
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  Get instant predictions and insights powered by advanced ML models
                </p>
                <Button 
                  size="sm" 
                  className="h-7 text-[11px] font-semibold bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm"
                >
                  Try Now
                  <Zap className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-1">
          {/* Main Section Label */}
          <div className="px-3 mb-3 mt-2">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Main Menu
            </p>
          </div>

          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            // Exact match for dashboard, startsWith for others
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/50 dark:to-blue-950/30 text-blue-700 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-500 rounded-r-full"></div>
                )}

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-blue-100 dark:bg-blue-900/50" 
                      : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                  )}>
                    <Icon className={cn(
                      "h-4.5 w-4.5 transition-colors",
                      isActive 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    )} />
                  </div>
                  <span className="truncate">{item.title}</span>
                </div>
                
                {/* Badge, New tag, or Arrow */}
                <div className="flex items-center gap-2">
                  {item.isNew && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      New
                    </span>
                  )}
                  {item.badge ? (
                    <span className={cn(
                      "flex items-center justify-center min-w-[22px] h-5.5 px-2 rounded-lg text-[11px] font-bold",
                      isActive
                        ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}>
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-all duration-200",
                      isActive 
                        ? "opacity-100 translate-x-0 text-blue-600 dark:text-blue-400" 
                        : "opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 text-slate-400"
                    )} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Security Badge */}
        <div className="mt-6 px-3">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
            <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">
                HIPAA Compliant
              </p>
              <p className="text-[9px] text-emerald-600 dark:text-emerald-500 leading-tight mt-0.5">
                End-to-end encrypted
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* User Info Section */}
      <div className="relative border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="relative group cursor-pointer">
          {/* Hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-900 transition-all duration-200">
            <div className="relative">
              {/* Avatar with gradient border */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 blur-sm opacity-75"></div>
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-lg ring-2 ring-white dark:ring-slate-950">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              {/* Online status indicator */}
              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 shadow-sm"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                  {user?.role}
                </span>
                {user?.institution && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {user.institution}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
        </div>
      </div>
    </div>
  );
}