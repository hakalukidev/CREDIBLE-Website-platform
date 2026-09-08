'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';

interface ContactFormProps {
  businessId: string;
  businessName: string;
}

export function ContactForm({ businessId, businessName }: ContactFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const send = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/businesses/${businessId}/contact`, form);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Your message has been sent to ${businessName}`);
      setForm({ name: '', email: '', phone: '', message: '' });
      setOpen(false);
    },
    onError: (err) => toast.error(friendlyMessage(err, 'generic')),
  });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        Contact {businessName}
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold">Contact {businessName}</h3>
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <div>
            <Label htmlFor="c-name">Your name</Label>
            <Input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="c-phone">Phone (optional)</Label>
            <Input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="c-msg">Message</Label>
            <Textarea id="c-msg" required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={send.isPending} className="flex-1">
              Send message
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}