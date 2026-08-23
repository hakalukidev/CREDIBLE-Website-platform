'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, extractError } from '@/lib/api/client';
import { useSession } from '@/lib/store/session';
import type { AuthSession } from '@credible/types';

export function LoginForm() {
  const router = useRouter();
  const setSession = useSession((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ success: true; data: AuthSession }>('/auth/login', {
        email,
        password,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setSession(data);
      toast.success('Welcome back!');
      router.push('/business/dashboard');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" loading={login.isPending} className="w-full">
            Sign in
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-2">
          <Button asChild variant="outline">
            <Link href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/auth/google`}>
              Continue with Google
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/auth/facebook`}>
              Continue with Facebook
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}