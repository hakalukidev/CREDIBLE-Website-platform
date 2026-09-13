'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AdminLoginForm } from './admin-login-form';
import { ShieldCheck, KeyRound } from 'lucide-react';

/**
 * The hidden "secure gateway" — a modal (never a public page link) used to
 * reach `/admin/login`. Publicly reachable only via the secret keyboard
 * shortcut below; the codebase contains no links that open it.
 */
export function AdminGatewayModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideDefaultClose
        className="max-w-sm border-zinc-800 bg-zinc-950 p-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-800/80 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600/15">
            <KeyRound className="h-4 w-4 text-rose-500" />
          </div>
          <div>
            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-zinc-200">
              Admin Access
            </DialogTitle>
            <p className="text-xs text-zinc-500">Authorized personnel only</p>
          </div>
          <ShieldCheck className="ml-auto h-4 w-4 text-zinc-700" />
        </div>
        <div className="px-6 pb-6">
          <AdminLoginForm embedded onSuccess={() => onOpenChange(false)} />
        </div>
        <div className="border-t border-zinc-800/80 bg-zinc-900/40 px-6 py-3 text-center text-[11px] text-zinc-600">
          All access attempts are recorded in the audit trail.
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Global listener for **Shift + Alt + A**. Pressing it anywhere on the public
 * site opens the admin gateway modal. Mounted once in the root providers.
 */
export function AdminAccessTrigger() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith('/admin');

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.shiftKey || !e.altKey) return;
      const key = e.key.toLowerCase();
      const isA = key === 'a' || e.code === 'KeyA';
      if (!isA) return;
      e.preventDefault();
      if (isAdminArea) return;
      setOpen(true);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pathname, isAdminArea]);

  return <AdminGatewayModal open={open} onOpenChange={setOpen} />;
}