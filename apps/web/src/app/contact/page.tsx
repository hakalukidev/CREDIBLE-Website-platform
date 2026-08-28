import { Mail, MessageSquare, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with the Credible team. We respond to all enquiries within 24 hours.',
  path: '/contact',
});

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
    icon: MapPin,
    title: 'Location',
    value: 'Dhaka, Bangladesh',
    detail: 'Operating across Bangladesh',
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            Contact
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Get in touch</h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Have a question, feedback, or partnership inquiry? We&apos;d love to hear from you. Our
            team typically responds within one business day.
          </p>
        </div>
      </section>

      <section className="container-wide py-12 grid gap-6 md:grid-cols-3">
        {CONTACTS.map(({ icon: Icon, title, value, detail }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm font-medium">{value}</p>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container-wide py-12 border-t">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill out the form below and we&apos;ll get back to you as soon as possible.
          </p>
          <form className="mt-6 space-y-4" action="#" method="POST">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                required
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="How can we help?"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="flex min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Tell us more..."
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Send message
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
