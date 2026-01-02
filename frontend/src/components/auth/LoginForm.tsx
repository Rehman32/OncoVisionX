"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';

export default function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', data);
      
      const { user, accessToken, refreshToken } = response.data.data;
      
      setAuth(user, accessToken, refreshToken);
      toast.success('Welcome back!');
      
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header with gradient */}
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-2">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">
            Welcome Back
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Sign in to your account to access advanced AI-powered cancer staging tools
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            Email Address
          </Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 blur-xl"></div>
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200 z-10" />
            <Input
              id="email"
              placeholder="doctor@hospital.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              className="pl-10 h-12 relative z-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-slate-200 dark:border-slate-800 focus:border-primary"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
              <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
              {errors.email.message}
            </p>
          )}
        </div>
        
        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Link 
              href="/forgot-password" 
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors hover:underline inline-flex items-center gap-1"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 blur-xl"></div>
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200 z-10" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              className="pl-10 h-12 relative z-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-slate-200 dark:border-slate-800 focus:border-primary"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
              <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
              {errors.password.message}
            </p>
          )}
        </div>
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold group relative overflow-hidden shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 mt-6" 
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/90 group-hover:scale-105 transition-transform duration-300"></div>
        </Button>
      </form>
      
      {/* Security Features */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>Your connection is secure and encrypted</span>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground font-medium">
            New to OncoVisionX?
          </span>
        </div>
      </div>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Don't have an account yet?
        </p>
        <Link 
          href="/register"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg hover:bg-primary/5"
        >
          <span>Create your free account</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>

      {/* Trust Indicators */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium">HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium">ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium">SOC 2 Type II</span>
          </div>
        </div>
      </div>
    </div>
  );
}