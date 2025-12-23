"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  HelpCircle, 
  Search, 
  ChevronDown,
  Shield,
  CreditCard,
  Moon,
  Sun,
  Laptop,
  Sparkles,
  Activity,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notificationCount] = useState(3);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="flex h-20 items-center justify-between px-8">
        {/* Left Section - Greeting with Time */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                Welcome back, {user?.firstName}
              </h2>
              <Badge 
                variant="secondary" 
                className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900"
              >
                <Activity className="h-2.5 w-2.5 mr-1" />
                Online
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-normal">
                {currentDate}
              </p>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{currentTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Search with shortcut hint */}
          <Button 
            variant="ghost" 
            size="sm"
            className="h-10 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 gap-2 hidden md:flex"
          >
            <Search className="h-4.5 w-4.5" />
            <span className="text-sm">Search</span>
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              ⌘K
            </kbd>
          </Button>

          {/* Mobile search */}
          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 md:hidden"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Help Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuItem className="rounded-lg cursor-pointer py-2.5">
                <HelpCircle className="mr-3 h-4 w-4 text-slate-500" />
                <span className="text-sm">Documentation</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer py-2.5">
                <Sparkles className="mr-3 h-4 w-4 text-slate-500" />
                <span className="text-sm">What's New</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications with enhanced dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
  <Button
    variant="ghost"
    size="icon"
    className="relative h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
  >
    <Bell className="h-5 w-5" />

    {notificationCount > 0 && (
  <span className="
    absolute -top-1 -right-1
    flex h-[18px] w-[18px] items-center justify-center
    rounded-full
    bg-red-600/90
    text-[10px] font-semibold text-white
    ring-2 ring-white dark:ring-slate-950
  ">
    {notificationCount}
  </span>
)}


    <span className="sr-only">Notifications</span>
  </Button>
</DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                  Notifications
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {notificationCount} new
                </Badge>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2 space-y-1">
                  <div className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          New prediction completed
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Patient P-2025-045 staging results ready
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          2 hours ago
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          Security update available
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Review and approve security patches
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          5 hours ago
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 p-2">
                <Button variant="ghost" className="w-full justify-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg">
                  View all notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2"></div>

          {/* User Dropdown with enhanced design */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-11 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 gap-3 group"
              >
                <div className="relative">
                  <Avatar className="h-9 w-9 ring-2 ring-slate-200 dark:ring-slate-800 group-hover:ring-slate-300 dark:group-hover:ring-slate-700 transition-all">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950"></div>
                </div>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {user?.role}
                  </span>
                </div>
                <ChevronDown className="hidden lg:block h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2">
              {/* User Info Header */}
              <div className="p-3 mb-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12 ring-2 ring-slate-200 dark:ring-slate-800">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                {user?.institution && (
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {user.institution}
                    </span>
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="my-2" />

              {/* Menu Items */}
              <DropdownMenuItem 
                onClick={() => router.push('/dashboard/profile')}
                className="rounded-lg cursor-pointer py-2.5 group"
              >
                <User className="mr-3 h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile</p>
                  <p className="text-xs text-slate-500">Manage your account</p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => router.push('/dashboard/settings')}
                className="rounded-lg cursor-pointer py-2.5 group"
              >
                <Settings className="mr-3 h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Settings</p>
                  <p className="text-xs text-slate-500">Preferences & privacy</p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => router.push('/dashboard/billing')}
                className="rounded-lg cursor-pointer py-2.5 group"
              >
                <CreditCard className="mr-3 h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Billing</p>
                  <p className="text-xs text-slate-500">Plans & payments</p>
                </div>
              </DropdownMenuItem>

              {/* Theme Submenu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="rounded-lg cursor-pointer py-2.5 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 group flex items-center">
                    <Laptop className="mr-3 h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Theme</p>
                      <p className="text-xs text-slate-500">Customize appearance</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 -rotate-90" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left" className="w-48 p-1">
                  <DropdownMenuItem className="rounded-md py-2">
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-md py-2">
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-md py-2">
                    <Laptop className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenuSeparator className="my-2" />

              {/* Logout */}
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 py-2.5 group"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Log out</p>
                  <p className="text-xs opacity-80">End your session</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}