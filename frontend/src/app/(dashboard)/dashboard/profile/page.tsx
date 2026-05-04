"use client";

import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Shield,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Hash,
} from 'lucide-react';
import { format } from 'date-fns';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const infoItems = [
    { icon: Mail, label: 'Email Address', value: user.email },
    { icon: Shield, label: 'Role', value: user.role, capitalize: true },
    { icon: Hash, label: 'User ID', value: user._id, mono: true },
    { icon: Building2, label: 'Institution', value: user.institution || '—' },
    { icon: Briefcase, label: 'Department', value: user.department || '—' },
    { icon: Calendar, label: 'Account Created', value: user.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy') : '—' },
    { icon: Clock, label: 'Last Login', value: user.lastLogin ? format(new Date(user.lastLogin), 'MMMM dd, yyyy HH:mm') : '—' },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6 max-w-3xl mx-auto pb-10">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Profile
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400">
            Your account information
          </p>
        </div>

        {/* Identity Card */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          {/* Gradient banner */}
          <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
          </div>

          <CardContent className="relative pt-0 pb-8 px-8">
            {/* Avatar overlapping banner */}
            <div className="flex items-end gap-6 -mt-10 mb-6">
              <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-slate-950 shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {user.firstName} {user.lastName}
                </h2>
                <Badge 
                  variant="secondary" 
                  className="mt-1 capitalize text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                >
                  {user.role}
                </Badge>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Info Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {infoItems.map(({ icon: Icon, label, value, capitalize, mono }) => (
                <div 
                  key={label} 
                  className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
                    <Icon className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className={`text-sm font-semibold text-slate-900 dark:text-slate-50 mt-0.5 truncate ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono text-xs' : ''}`}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
