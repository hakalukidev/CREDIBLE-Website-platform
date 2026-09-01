'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/lib/store/session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterLandingPage() {
  const router = useRouter();
  const session = useSession((s) => s.session);

  // If already signed in, jump straight to the role-appropriate dashboard.
  useEffect(() => {
    if (!session) return;
    const role = session.user.role;
    const dest =
      role === 'ADMIN'
        ? '/admin'
        : role === 'BUSINESS'
          ? '/business/dashboard'
          : role === 'PROFESSIONAL'
            ? '/professional/dashboard'
            : '/';
    router.replace(dest);
  }, [session, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Join Credible</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Build trust with verified reviews. Pick the account type that best describes you — you
            can change it later from your dashboard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <RoleCard
            href="/register?role=CUSTOMER"
            icon={<Users className="h-6 w-6" />}
            title="Customer"
            subtitle="Find & review"
            description="Search businesses and professionals, read verified reviews, and share your own experiences."
            perks={[
              'Bookmark favourites',
              'One-tap reviews with email or phone OTP',
              'Track all your reviews in one place',
            ]}
          />
          <RoleCard
            href="/register-business?role=BUSINESS"
            icon={<Building2 className="h-6 w-6" />}
            title="Business"
            subtitle="List your company"
            description="Claim your business profile, respond to reviews, and unlock the Credible Verified badge."
            perks={[
              'Public business page',
              'Review response & reporting',
              'Verification + analytics',
            ]}
            highlight
          />
          <RoleCard
            href="/register?role=PROFESSIONAL"
            icon={<Briefcase className="h-6 w-6" />}
            title="Professional"
            subtitle="Solo practitioner"
            description="For doctors, lawyers, consultants, freelancers — anyone who serves clients under their own name."
            perks={[
              'Personal profile with specialties',
              'Collect reviews from clients',
              'Showcase experience & languages',
            ]}
          />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

interface RoleCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  perks: string[];
  highlight?: boolean;
}

function RoleCard({ href, icon, title, subtitle, description, perks, highlight }: RoleCardProps) {
  return (
    <Card
      className={
        highlight
          ? 'border-primary shadow-md ring-1 ring-primary/30 relative'
          : 'hover:border-primary/40 transition-colors'
      }
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
          Most popular
        </span>
      )}
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <ul className="space-y-1.5">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full">
          <Link href={href as never}>
            Continue as {title} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
