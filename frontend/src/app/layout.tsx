import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ChromeFrame } from '@/components/layout/chrome-frame';
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
          component" diagnostic that next-themes' inline script did.

          The site is locked to the light theme. This script runs before
          first paint to (1) drop any `dark` class that may have leaked
          from a previous session or browser extension, (2) sync
          `color-scheme` so form controls and scrollbars render correctly,
          and (3) persist the canonical 'light' value so any future toggle
          starts from a known state.
        */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='theme';document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';localStorage.setItem(k,'light');}catch(e){}})();`,
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
            <ChromeFrame>{children}</ChromeFrame>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}