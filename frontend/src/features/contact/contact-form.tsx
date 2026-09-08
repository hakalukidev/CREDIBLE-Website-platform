'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, MessageSquare, MapPin, Phone, Clock, Facebook, Linkedin, Twitter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { contactSubmissionSchema } from '@credible/shared';

type ContactFormValues = z.infer<typeof contactSubmissionSchema>;

const CONTACTS = [
  {
    icon: Mail,
    title: 'Email',
    value: 'support@credible.com',
    detail: 'General enquiries & support',
  },
  {
    icon: MessageSquare,
    title: 'Response time',
    value: 'Within 24 hours',
    detail: 'Monday – Friday, 9 AM – 6 PM (BST)',
  },
  {
    icon: Phone,
    title: 'Phone',
    value: '+880 1700-000000',
    detail: 'Press enquiries only',
  },
  {
    icon: MapPin,
    title: 'Location',
    value: 'Dhaka, Bangladesh',
    detail: 'Operating across Bangladesh',
  },
  {
    icon: Clock,
    title: 'Business hours',
    value: '9 AM – 6 PM BST',
    detail: 'Monday through Friday',
  },
] as const;

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSubmissionSchema),
    defaultValues: { name: '', email: '', subject: '', message: '', website: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await apiClient.post('/contact/submissions', values);
      toast.success("Thanks — we'll be in touch within 24 hours.");
      form.reset();
    } catch (err) {
      toast.error(friendlyMessage(err, 'generic'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            Contact
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Get in touch</h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Have a question, feedback, or partnership inquiry? We&apos;d love to hear from you.
            Our team typically responds within one business day.
          </p>
        </div>
      </section>

      <section className="container-wide py-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CONTACTS.map(({ icon: Icon, title, value, detail }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <Icon className="h-7 w-7 text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm font-medium">{value}</p>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container-wide py-12 border-t grid gap-10 lg:grid-cols-[1fr_1.5fr]">
        <aside>
          <h2 className="text-2xl font-bold tracking-tight">Other ways to reach us</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For partnership or press enquiries, email us directly. For verification questions,
            check the FAQ below — most answers are already there.
          </p>
          <div className="mt-6 flex gap-3 text-muted-foreground">
            <a
              href="https://facebook.com/credible"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border p-2 hover:text-foreground"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com/company/credible"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border p-2 hover:text-foreground"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com/credible"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border p-2 hover:text-foreground"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </aside>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill out the form below and we&apos;ll get back to you as soon as possible.
          </p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            {/* Honeypot — hidden from real users, visible only to bots that ignore CSS. */}
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
              <label htmlFor="website">Website</label>
              <input id="website" type="text" tabIndex={-1} autoComplete="off" {...form.register('website')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="name"
                label="Name"
                error={form.formState.errors.name?.message}
                input={
                  <Input
                    id="name"
                    placeholder="Your name"
                    autoComplete="name"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    {...form.register('name')}
                  />
                }
              />
              <Field
                id="email"
                label="Email"
                error={form.formState.errors.email?.message}
                input={
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(form.formState.errors.email)}
                    {...form.register('email')}
                  />
                }
              />
            </div>
            <Field
              id="subject"
              label="Subject"
              error={form.formState.errors.subject?.message}
              input={
                <Input
                  id="subject"
                  placeholder="How can we help?"
                  aria-invalid={Boolean(form.formState.errors.subject)}
                  {...form.register('subject')}
                />
              }
            />
            <Field
              id="message"
              label="Message"
              error={form.formState.errors.message?.message}
              input={
                <Textarea
                  id="message"
                  rows={5}
                  placeholder="Tell us more..."
                  aria-invalid={Boolean(form.formState.errors.message)}
                  {...form.register('message')}
                />
              }
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send message'}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}

function Field({
  id,
  label,
  error,
  input,
}: {
  id: string;
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {input}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
