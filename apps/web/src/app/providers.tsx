'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { makeQueryClient } from '@/lib/api/query-client';
import { useSession } from '@/lib/store/session';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <UnauthorizedListener />
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Listens for the `credible:unauthorized` event emitted by the axios
 * interceptor when the API rejects a request with 401, then clears the
 * client-side session and redirects to /login.
 */
function UnauthorizedListener() {
  const router = useRouter();
  const clear = useSession((s) => s.clear);

  useEffect(() => {
    function handle() {
      clear();
      router.push('/login');
    }
    window.addEventListener('credible:unauthorized', handle);
    return () => window.removeEventListener('credible:unauthorized', handle);
  }, [clear, router]);

  return null;
}