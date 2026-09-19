'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAdminSession } from '@/lib/admin/admin-session';
import { Timer, LogOut } from 'lucide-react';

/**
 * Inactivity auto-logout: warns at 25 minutes, force-logs-out at 30 minutes
 * of no interaction. Any activity (key, mouse, touch, scroll) resets the
 * clock. The session length is derived from the admin JWT's lifetime so the
 * behaviour stays in sync with the token expiry.
 */
export function AdminSessionTimer({ onExpire }: { onExpire: () => void }) {
  const session = useAdminSession((s) => s.session);
  const expiresMs = (session?.expiresIn ?? 30 * 60) * 1000;
  const warnMs = expiresMs - 5 * 60 * 1000;

  const lastActiveRef = useRef<number>(Date.now());
  const warnedRef = useRef(false);
  const expiringRef = useRef(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleActivity = () => {
    lastActiveRef.current = Date.now();
    if (warnedRef.current && !expiringRef.current) {
      warnedRef.current = false;
      setShowWarning(false);
    }
  };

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = [
      'keydown',
      'mousedown',
      'touchstart',
      'scroll',
      'pointerdown',
    ];
    events.forEach((evt) => window.addEventListener(evt, handleActivity));
    const interval = setInterval(() => {
      const idle = Date.now() - lastActiveRef.current;
      if (idle >= expiresMs) {
        expiringRef.current = true;
        onExpire();
        return;
      }
      if (idle >= warnMs && !warnedRef.current) {
        warnedRef.current = true;
        setShowWarning(true);
      }
    }, 15_000);
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInterval(interval);
    };
  }, [expiresMs, warnMs, onExpire]);

  return (
    <Dialog open={showWarning} onOpenChange={(o) => setShowWarning(o)}>
      <DialogContent className="max-w-sm border-border bg-card text-card-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Timer className="h-5 w-5" />
            <DialogTitle className="text-foreground">Session expiring soon</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            You&apos;ve been inactive for 25 minutes. The admin session locks
            automatically after 30 minutes of inactivity for security.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              handleActivity();
              setShowWarning(false);
            }}
          >
            Continue working
          </Button>
          <Button variant="destructive" onClick={onExpire}>
            <LogOut className="h-4 w-4" /> Log out now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}