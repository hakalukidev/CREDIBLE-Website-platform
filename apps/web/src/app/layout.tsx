import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import { siteMetadata } from '@/lib/seo/metadata';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1220' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/*
          Pre-paint theme boot. Rendered as a real HTML <script> from a
          server component (not JSX inside a React client tree), so it does
          not trip the React 19 / Next 16 "script tag inside React
          component" diagnostic that next-themes' inline script did. It
          mirrors exactly what next-themes was doing: read the stored
          preference (or system default), toggle the `dark` class, and set
          `color-scheme` before first paint to avoid a theme flash.
        */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='theme';var s=localStorage.getItem(k);var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var c=t==='dark';document.documentElement.classList.toggle('dark',c);document.documentElement.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Providers>
          <TooltipProvider delayDuration={150}>
            <SiteHeader />
            <main id="main-content" className="min-h-[60vh]" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}