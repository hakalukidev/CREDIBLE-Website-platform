'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import type { AuthSession } from '@credible/types';

export function RegisterForm() {
  const router = useRouter();
  const setSession = useSession((s) => s.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER', acceptTerms: true },
  });

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
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit((v) => submit.mutate(v))}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register('firstName')} />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register('lastName')} />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div>
            <Label>I am a…</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="cursor-pointer rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input type="radio" value="CUSTOMER" {...register('role')} className="mr-2" />
                Customer / Reviewer
              </label>
              <label className="cursor-pointer rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input type="radio" value="BUSINESS" {...register('role')} className="mr-2" />
                Business owner
              </label>
            </div>
          </div>

          <Button type="submit" loading={submit.isPending} className="w-full">
            Create account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}