// features/auth/register-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { registerSchema, type RegisterInput } from '@credible/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, extractError } from '@/lib/api/client';
import { useSession } from '@/lib/store/session';
import {
  User,
  Mail,
  Lock,
  Users,
  Building2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import type { AuthSession } from '@credible/types';

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const setSession = useSession((s) => s.setSession);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER', acceptTerms: true },
  });

  const selectedRole = watch('role');

  const submit = useMutation({
    mutationFn: async (values: RegisterInput) => {
      const res = await apiClient.post<{ success: true; data: AuthSession }>('/auth/register', values);
      return res.data.data;
    },
    onSuccess: (data) => {
      setSession(data);
      toast.success('Welcome to Credible!');
      router.push(data.user.role === 'BUSINESS' ? '/business/dashboard' : '/');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="pt-8 pb-6 px-6">
        <form
          className="space-y-5"
          onSubmit={handleSubmit((v) => submit.mutate(v))}
        >
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  className="pl-10 h-11 bg-muted/50 border-muted focus:bg-background transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last name
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register('lastName')}
                className="h-11 bg-muted/50 border-muted focus:bg-background transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className={`pl-10 h-11 bg-muted/50 border-muted focus:bg-background transition-colors ${errors.email ? 'border-destructive' : ''
                  }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                {...register('password')}
                className={`pl-10 pr-10 h-11 bg-muted/50 border-muted focus:bg-background transition-colors ${errors.password ? 'border-destructive' : ''
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with numbers and symbols
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-primary/50 ${selectedRole === 'CUSTOMER'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-muted bg-muted/30 hover:bg-muted/50'
                  }`}
              >
                <input
                  type="radio"
                  value="CUSTOMER"
                  {...register('role')}
                  className="sr-only"
                />
                <Users className={`h-5 w-5 mx-auto mb-1.5 ${selectedRole === 'CUSTOMER' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                <div className={`text-sm font-medium ${selectedRole === 'CUSTOMER' ? 'text-primary' : ''
                  }`}>
                  Customer/Reviewer
                </div>
              </label>

              <label
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-primary/50 ${selectedRole === 'BUSINESS'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-muted bg-muted/30 hover:bg-muted/50'
                  }`}
              >
                <input
                  type="radio"
                  value="BUSINESS"
                  {...register('role')}
                  className="sr-only"
                />
                <Building2 className={`h-5 w-5 mx-auto mb-1.5 ${selectedRole === 'BUSINESS' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                <div className={`text-sm font-medium ${selectedRole === 'BUSINESS' ? 'text-primary' : ''
                  }`}>
                  Business
                </div>
              </label>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="acceptTerms"
              {...register('acceptTerms')}
              className="mt-0.5 h-4 w-4 rounded border-muted text-primary focus:ring-primary"
            />
            <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground font-normal leading-relaxed">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline font-medium">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            disabled={submit.isPending}
            className="w-full h-11 text-base font-semibold gap-2"
          >
            {submit.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
        <Button asChild variant="outline" className="w-full mt-4 h-11 gap-2 hover:bg-muted/50">
          <Link href="/login">
            <CheckCircle2 className="h-4 w-4" />
            Sign in instead
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}