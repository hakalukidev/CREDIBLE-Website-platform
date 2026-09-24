import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Comfortaa, Inter } from 'next/font/google';
import { Providers } from './providers';
import { ChromeFrame } from '@/components/layout/chrome-frame';
import { CookieConsent } from '@/components/layout/cookie-consent';
import { siteMetadata } from '@/lib/seo/metadata';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Comfortaa — the brand's heading font. Loaded via next/font so it
// self-hosts the woff2s (no Google CDN round-trip) and pairs cleanly
// with Inter as the body face. Exposed as --font-comfortaa so
// `font-display` (Tailwind) picks it up automatically.
const comfortaa = Comfortaa({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-comfortaa',
  display: 'swap',
});

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Per the redesigned identity, the marketing surface is light-only.
  // (Admin + dashboard chrome still keep their own scoping.)
  themeColor: '#FFFFFF',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${comfortaa.variable}`}
      style={{ colorScheme: 'light' }}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Providers>
          <TooltipProvider delayDuration={150}>
            <ChromeFrame>{children}</ChromeFrame>
          </TooltipProvider>
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
