"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, Building2, Briefcase, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { registerSchema, RegisterFormData } from '@/lib/validations/auth';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';

export default function RegisterForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'doctor',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registrationData } = data;
      
      const response = await apiClient.post('/auth/register', registrationData);
      
      const { user, accessToken, refreshToken } = response.data.data;
      
      setAuth(user, accessToken, refreshToken);
      toast.success('Account created successfully!');
      
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Create Your Account
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Join our platform and start leveraging AI for cancer staging
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </Label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="firstName"
                placeholder="John"
                disabled={isLoading}
                className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-destructive animate-in slide-in-from-top-1">
                {errors.firstName.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </Label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="lastName"
                placeholder="Doe"
                disabled={isLoading}
                className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                {...register('lastName')}
              />
            </div>
            {errors.lastName && (
              <p className="text-xs text-destructive animate-in slide-in-from-top-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>
        
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="email"
              placeholder="doctor@hospital.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              disabled={isLoading}
              className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive animate-in slide-in-from-top-1">
              {errors.email.message}
            </p>
          )}
        </div>
        
        {/* Password Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive animate-in slide-in-from-top-1">
                {errors.password.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive animate-in slide-in-from-top-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
        
        {/* Role Selection */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-medium">
            Your Role
          </Label>
          <Select
            defaultValue="doctor"
            onValueChange={(value: 'doctor' | 'researcher') => setValue('role', value)}
          >
            <SelectTrigger className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="doctor" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Doctor / Clinician</span>
                </div>
              </SelectItem>
              <SelectItem value="researcher" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Researcher</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-xs text-destructive animate-in slide-in-from-top-1">
              {errors.role.message}
            </p>
          )}
        </div>
        
        {/* Optional Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="institution" className="text-sm font-medium text-muted-foreground">
              Institution <span className="text-xs">(Optional)</span>
            </Label>
            <div className="relative group">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="institution"
                placeholder="City General Hospital"
                disabled={isLoading}
                className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                {...register('institution')}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-medium text-muted-foreground">
              Department <span className="text-xs">(Optional)</span>
            </Label>
            <div className="relative group">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="department"
                placeholder="Oncology"
                disabled={isLoading}
                className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                {...register('department')}
              />
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-11 text-base font-medium group relative overflow-hidden mt-6" 
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 group-hover:from-primary/90 group-hover:to-primary transition-all duration-300"></div>
        </Button>
      </form>
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Already have an account?
          </span>
        </div>
      </div>

      {/* Login Link */}
      <div className="text-center">
        <Link 
          href="/login"
          className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign in here
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Trust Indicators */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>ISO Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
}